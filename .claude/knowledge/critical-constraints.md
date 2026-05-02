# Critical Constraints

**Non-negotiable rules that MUST be followed in all code.**

---

## 1. Dual Execution Context — NEVER Cross the Boundary

Figma plugins run in two isolated sandboxes with NO shared memory:

| Context | Path | Has | Does NOT have |
|---------|------|-----|---------------|
| **Sandbox** | `src/plugin/` | `figma.*` API, canvas, `figma.clientStorage` | Browser APIs, `fetch`, DOM |
| **UI iframe** | `src/ui/` | React, DOM, `fetch`, browser APIs | `figma.*` API |

**Rule**: `src/plugin/` MUST NOT import from `src/ui/`. `src/ui/` MUST NOT import from `src/plugin/`.  
Only `src/common/` is shared between both sides.

```ts
// ✅ CORRECT
// src/plugin/auth/auth.handler.ts
import type { AuthCredentials } from '@common/types/auth.types'; // ok

// ❌ WRONG
// src/plugin/auth/auth.handler.ts
import { useSession } from '@ui/store/session.store'; // FORBIDDEN
```

---

## 2. All IPC Must Go Through monorepo-networker

Never use raw `figma.ui.postMessage` or `window.parent.postMessage` directly.

✅ Define message contract in `src/common/network-sides.ts`  
✅ Send via the typed monorepo-networker API in `plugin.network.ts` / `app.network.tsx`  
❌ Never call `figma.ui.postMessage({...})` manually

---

## 3. No Hardcoded Strings in Components

All user-visible text MUST live in a `messages.ts` file.

| Situation | Location |
|-----------|----------|
| Generic action (Save, Cancel, Export) | `src/ui/config/messages.ts` |
| Generic server error | `src/ui/config/messages.ts` |
| Screen-specific title or description | `src/ui/screens/{screen}/messages.ts` |
| Domain-specific label | `src/ui/screens/{screen}/messages.ts` |
| Text used in 2+ screens | `src/ui/config/messages.ts` |

```ts
// ❌ WRONG
<h1>Bienvenido al plugin</h1>

// ✅ CORRECT
import { loginMessages } from './messages';
<h1>{loginMessages.title}</h1>
```

---

## 4. Single-File Output (Figma Requirement)

The UI build MUST produce a single inlined `index.html` with NO external asset references.  
Both Vite configs use `viteSingleFile`. Do NOT disable or bypass this plugin.

---

## 5. Use MemoryRouter — Never BrowserRouter

The UI runs inside a Figma iframe with no real URL. Always use `MemoryRouter` from `react-router-dom`.

---

## 6. API Calls Only from UI Side

The sandbox has no `fetch`. All HTTP requests to external APIs MUST originate from `src/ui/repositories/`.  
The sandbox requests data by sending a message to the UI — never directly.

---

## 7. Named Exports Only (No Default Exports)

```ts
// ❌ WRONG
export default function LoginScreen() {}

// ✅ CORRECT
export function LoginScreen() {}
```

Exception: Storybook stories may use default export for the meta object.

---

## 8. TypeScript: No `any`

`@typescript-eslint/no-explicit-any` is configured as an **error**. Every value must be typed.

---

## 9. Boolean Naming Prefixes

```ts
// ❌ WRONG
const loading = true;
const error = false;

// ✅ CORRECT
const isLoading = true;
const hasError = false;
const canExport = true;
const shouldRedirect = false;
```

---

## 10. No Barrel Files

Do NOT create `index.ts` re-export files. Import from the actual file path.

```ts
// ❌ WRONG
import { Button } from '@ui/components/atoms'; // barrel

// ✅ CORRECT
import { Button } from '@ui/components/atoms/button';
```

---

## Verification Checklist

Before submitting any code, verify:

- [ ] `src/plugin/` ↔ `src/ui/` boundary not crossed — only `src/common/` is shared
- [ ] IPC messages defined in `network-sides.ts` and sent via monorepo-networker
- [ ] No hardcoded strings in components — all text in `messages.ts`
- [ ] New component has named export only
- [ ] No `any` types
- [ ] Booleans prefixed with `is/has/can/should`
- [ ] No `index.ts` barrel files created
