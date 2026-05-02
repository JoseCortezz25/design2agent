# Tech Stack

**Complete technology stack with versions, commands, and key dependencies.**

---

## Core Technologies

| Technology | Version | Role |
|-----------|---------|------|
| **TypeScript** | `5.9.2` | Static typing across the entire project |
| **React** | `19.1.1` | UI rendering in the iframe |
| **React Router** | `7.14.2` | SPA navigation (MemoryRouter — Figma requirement) |
| **Vite** | `5.4.19` | Dual build: separate `plugin.js` and inlined `index.html` |
| **Tailwind CSS** | `v4.1.11` | Utility-first styling with design tokens |
| **shadcn/ui** | custom | Component base (atoms/molecules/organisms pattern) |
| **Zustand** | `5.0.12` | Client state (`session.store`, `stepper.store`) |
| **Zod** | `4.3.6` | Schema validation for forms |
| **monorepo-networker** | `2.1.0` | Typed IPC between sandbox ↔ UI |
| **Storybook** | `8.4.7` | Component documentation and visual dev |
| **Node.js** | `≥ 20.11.0` | Runtime requirement |
| **pnpm** | `8.6.3` | Package manager |

---

## Key Vite Plugins

| Plugin | Purpose |
|--------|---------|
| `vite-plugin-singlefile` | Inlines ALL assets into a single HTML (Figma requirement) |
| `vite-plugin-react-rich-svg` | Enhanced SVG support |
| `@vitejs/plugin-react` | React JSX transform |
| `@tailwindcss/vite` | Tailwind v4 integration |

---

## Build System

Two separate Vite configs compile independently:

| Config | Input | Output | Target |
|--------|-------|--------|--------|
| `vite.config.plugin.ts` | `src/plugin/plugin.ts` | `dist/plugin.js` | Figma sandbox |
| `vite.config.ui.ts` | `src/ui/index.html` | `dist/index.html` | Figma UI iframe |

Both outputs must be present for the plugin to work. `dist/index.html` must have NO external asset references.

---

## Path Aliases (tsconfig.json)

| Alias | Resolves to |
|-------|------------|
| `@/*` | `src/*` |
| `@common/*` | `src/common/*` |
| `@ui/*` | `src/ui/*` |
| `@plugin/*` | `src/plugin/*` |

---

## Commands

```bash
# Development
pnpm dev              # Watch mode: plugin + UI in parallel
pnpm dev:ui-only      # Vite dev server for UI only (port 5173)
pnpm watch            # Alias for dev
pnpm watch:ui         # UI watch only
pnpm watch:plugin     # Sandbox watch only

# Production
pnpm build            # Full build: types + clean + compile both
pnpm build:ui         # Build UI only
pnpm build:plugin     # Build sandbox only
pnpm clean            # Remove dist/

# Code Quality
pnpm lint             # ESLint across entire project
pnpm format           # Prettier format all files
pnpm eslint:format    # ESLint auto-fix in src/
pnpm types            # TypeScript type check (strict)

# Storybook
pnpm storybook        # Dev server on port 6006
pnpm build-storybook  # Production Storybook build
pnpm clean-storybook  # Clean Storybook cache
```

---

## Code Quality Configuration

**TypeScript** (`tsconfig.json`):
- Target: ES2022
- Strict mode enabled
- Module resolution: Node

**ESLint** (`eslint.config.mjs`):
- Base: `typescript-eslint` recommended
- `@typescript-eslint/no-explicit-any` → error
- `no-console` → warning

**Prettier** (`.prettierrc.json`):
- Single quotes, no trailing commas
- 2-space indent, line length 80
- Tailwind CSS plugin (auto-reorders classes)

**Git Hooks** (Husky):
- `pre-commit`: runs `lint-staged` (Prettier + ESLint fix on staged files)
- `commit-msg`: validates format — `[TICKET-123 ]type(scope)?: description`, max 88 chars
- Valid types: `feat`, `fix`, `chore`, `docs`, `test`, `style`, `refactor`, `perf`, `build`, `ci`, `revert`

---

## Testing

No unit test runner is currently configured. **Storybook** serves as the visual documentation and component development layer. When tests are added, Vitest is the planned framework.
