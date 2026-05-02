# File Structure Conventions

**Naming rules, directory layout, and import patterns for this project.**

---

## Directory Structure

```
src/
├── common/                          ← shared between sandbox and UI
│   ├── network-sides.ts             ← typed message contract (monorepo-networker)
│   └── types/
│       ├── auth.types.ts
│       ├── brand.types.ts
│       ├── figma.types.ts
│       └── export.types.ts
│
├── plugin/                          ← Figma sandbox (figma.* yes, browser APIs no)
│   ├── plugin.ts                    ← sandbox entry point
│   ├── plugin.network.ts            ← sandbox message channel
│   ├── auth/
│   │   ├── auth.handler.ts
│   │   └── storage.service.ts
│   ├── identification/
│   │   ├── identification.handler.ts
│   │   ├── framework.scanner.ts
│   │   └── component.scanner.ts
│   ├── export/
│   │   ├── export.handler.ts
│   │   ├── nomenclature.ts
│   │   └── asset.exporter.ts
│   └── lib/
│       └── node-traversal.ts
│
└── ui/                              ← React iframe (browser, DOM, fetch)
    ├── index.html
    ├── main.tsx
    ├── App.tsx
    ├── app.network.tsx              ← UI message channel
    │
    ├── config/
    │   └── messages.ts              ← global reusable strings
    │
    ├── router/
    │   ├── app-router.tsx
    │   └── routes.ts                ← path constants ("/login", "/select-client"…)
    │
    ├── screens/                     ← one folder per stepper screen
    │   ├── login/
    │   │   ├── login.tsx
    │   │   └── messages.ts
    │   ├── select-client/
    │   │   ├── select-client.tsx
    │   │   └── messages.ts
    │   └── [other screens…]/
    │
    ├── components/                  ← Atomic Design (business-agnostic)
    │   ├── atoms/
    │   ├── molecules/
    │   ├── organisms/
    │   └── ui/                      ← shadcn/ui primitives
    │
    ├── repositories/
    │   ├── auth.repository.ts
    │   ├── client.repository.ts
    │   ├── brand.repository.ts
    │   ├── campaign.repository.ts
    │   └── export.repository.ts
    │
    ├── api/
    │   └── client.ts                ← base instance with auth headers
    │
    ├── store/
    │   ├── session.store.ts
    │   └── stepper.store.ts
    │
    ├── hooks/
    │   ├── use-fetch.ts
    │   ├── use-stepper.ts
    │   └── use-plugin-bridge.ts
    │
    ├── lib/
    │   ├── errors.ts
    │   ├── constants.ts             ← BASE_URL, timeouts (SCREAMING_SNAKE_CASE)
    │   └── format.util.ts
    │
    └── styles/                      ← 7-1 SCSS architecture
        ├── main.css
        ├── abstracts/
        ├── base/
        └── vendors/
```

---

## File Naming Rules

| Type | Convention | Example |
|------|-----------|---------|
| Directories | `kebab-case/` | `select-client/`, `export-hub/` |
| React components | `kebab-case.tsx` | `card-review.tsx`, `plugin-header.tsx` |
| Hooks | `use-*.ts` | `use-auth.ts`, `use-stepper.ts` |
| Zustand stores | `*.store.ts` | `session.store.ts`, `stepper.store.ts` |
| Zod schemas | `*.schema.ts` | `login.schema.ts`, `client.schema.ts` |
| Types | `*.types.ts` | `auth.types.ts`, `export.types.ts` |
| Services | `*.service.ts` | `storage.service.ts` |
| Utilities | `*.util.ts` | `format.util.ts`, `color.util.ts` |
| Handlers (sandbox) | `*.handler.ts` | `auth.handler.ts`, `export.handler.ts` |
| Screen messages | `messages.ts` | placed inside each screen folder |

---

## Variable Naming

| Type | Convention | Example |
|------|-----------|---------|
| Booleans | `is*`, `has*`, `should*`, `can*` | `isLoading`, `hasError`, `canExport` |
| Non-boolean state | `camelCase` | `selectedClient`, `currentUser` |
| Constants | `SCREAMING_SNAKE_CASE` | `API_BASE_URL`, `MAX_NODES` |
| Event handlers | `handle*` | `handleLogin`, `handleClientSelect` |
| Fetch functions | `fetch*`, `get*`, `load*` | `fetchClients`, `getAuthToken` |
| Transformers | verb + object | `parseFrameworkData`, `formatColorToHex` |

---

## Component Pattern

```ts
// Named export only — no default exports (except Storybook meta)
export function CardReview({ name, isSelected }: CardReviewProps) { ... }

// Props interface: component name + "Props" suffix
interface CardReviewProps {
  name: string;
  isSelected: boolean;
  onSelect: () => void;
}

// Types: PascalCase, no "I" prefix, no "Interface" suffix
type ExportResult = { ... }
interface Client { ... }

// Zod schema: camelCase + "Schema" suffix
export const loginSchema = z.object({ ... });
export type Login = z.infer<typeof loginSchema>;
```

---

## Path Aliases

```ts
@/*        → src/*
@common/*  → src/common/*
@ui/*      → src/ui/*
@plugin/*  → src/plugin/*
```

---

## Import Rules

- No barrel files (`index.ts` re-exports) — import from actual file path
- `src/plugin/` and `src/ui/` MUST NOT import from each other
- Both may import from `src/common/`
