# Architecture Patterns

**Dual-context model, IPC patterns, UX flow, and layer responsibilities.**

---

## 1. Two Isolated Execution Contexts

Figma runs plugins in two completely separate threads. They cannot share memory.

```
Figma Host
├── Sandbox (src/plugin/)
│   Has: figma.* API, canvas access, figma.clientStorage
│   No:  Browser APIs, fetch, DOM
│
└── UI iframe (src/ui/)
    Has: React, DOM, fetch, browser APIs
    No:  figma.* API
```

The sandbox is a restricted JavaScript environment that can read/write the Figma canvas. The UI is a standard React SPA running inside an iframe. They only communicate via messages.

---

## 2. IPC Pattern (monorepo-networker)

All communication between contexts MUST use the typed message contract.

**Contract definition** → `src/common/network-sides.ts`  
**Sandbox channel** → `src/plugin/plugin.network.ts`  
**UI channel** → `src/ui/app.network.tsx`

```
UI → (message) → Sandbox: request canvas data, trigger export
Sandbox → (message) → UI: return canvas data, status updates
```

Rule: The sandbox NEVER makes HTTP requests. All API calls go through the UI.

```
Sandbox needs API data → sends message to UI → UI calls repository → UI replies to sandbox
```

---

## 3. UX Flow (Stepper Model)

```
First launch:   Login → SelectClient* → SelectBrand → ExportHub
Subsequent:                                            ExportHub (cached session)

Export flow:    ExportHub → Identifying → ExportReview → Exporting → ExportHub (success)
                                                                    → ExportError → ExportReview (retry)
```

*SelectClient is skipped when the user has only one assigned client.*

Navigation uses `MemoryRouter` — the UI has no real URL since it runs inside a Figma iframe.

---

## 4. HTTP Request Layer

Requests flow through strict layers. Each layer has one responsibility.

```
Screen → Hook → Repository → apiClient → External API
```

| Layer | Responsibility | Example |
|-------|---------------|---------|
| Screen | Renders UI, delegates to hooks | `login.tsx` |
| Hook | Orchestrates loading/error state | `use-fetch.ts` |
| Repository | Builds requests, maps responses | `auth.repository.ts` |
| apiClient | Base instance with auth headers | `src/ui/api/client.ts` |

Screens do NOT call repositories directly. Repositories do NOT know how the UI renders.

---

## 5. State Management

Two Zustand stores manage the plugin state:

### session.store
Persists for the full session: authenticated user, active client, active brand.  
Not cleared on navigation — going back does not log the user out.

### stepper.store
Manages the export flow with **cascade invalidation**:  
If the user goes back and changes a selection (e.g., changes brand), all data that depended on that step is automatically discarded.

```
Change client → clears brand + campaign + identified elements
Change brand  → clears campaign + identified elements
```

---

## 6. Component Organization (Atomic Design)

```
src/ui/components/
├── atoms/      ← Wrappers around OMC UI Design tokens (Button, Input, Badge…)
├── molecules/  ← Combinations with a single visual responsibility
├── organisms/  ← Complete interface sections
└── ui/         ← shadcn/ui primitives (base layer)
```

Domain-specific components live inside `src/ui/screens/{screen}/` — not in `components/`.  
Only reusable, business-agnostic UI goes in `components/`.

---

## 7. Text Management

No hardcoded strings anywhere in components.

```
Global (reused in 2+ screens)  → src/ui/config/messages.ts
Screen-specific                → src/ui/screens/{screen}/messages.ts
Dynamic text                   → function in messages.ts, called at render time
```

```ts
// Dynamic example
export const exportMessages = {
  exportCount: (n: number) => `Exportar ${n} ${n === 1 ? 'elemento' : 'elementos'}`,
} as const;
```

---

## 8. Dependency Rules

```
src/common/   ← shared by both sides (types + message contract)
src/plugin/   ← can import from src/common/ only
src/ui/       ← can import from src/common/ only

Within src/ui/:
  screens/  → hooks/ → repositories/ → api/
  screens/  → components/
  screens/  → store/
  components/ must NOT import from screens/ or repositories/
```

---

## 9. Identification Logic (Sandbox)

The sandbox scans the canvas to find exportable elements:

- **Hub Frameworks**: Frames with a specific naming nomenclature
- **Independent components**: Standalone components outside frameworks

Scanners live in `src/plugin/identification/`:
- `framework.scanner.ts` — detects Hub Framework frames
- `component.scanner.ts` — detects independent components
- `identification.handler.ts` — orchestrates both scanners and replies to the UI
