---
paths: src/**/*.{ts,tsx}
---

# State Management

This is a Figma Plugin — there is no server, no Server Actions, and no URL-based state. All state is client-side.

## Zustand Stores

Two atomic stores manage the plugin state. Never merge them into one global store.

**`session.store`** — persists for the full plugin session:
- Authenticated user
- Active client
- Active brand
- Not cleared on navigation — going back does not reset the session

**`stepper.store`** — manages the export flow with cascade invalidation:
- If the user changes client → clears brand, campaign, and identified elements
- If the user changes brand → clears campaign and identified elements
- If the user changes campaign → clears identified elements

```ts
// ✅ Atomic store — import only what you need
import { useSessionStore } from '@ui/store/session.store';

const user = useSessionStore(s => s.user);
```

## Form State

Use React Hook Form with Zod resolver for all forms. No `useActionState`, no `useFormStatus`.

```ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from './login.schema';

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(loginSchema),
});
```

---

# Component Architecture

All components in this project are **client components**. There are no React Server Components — the UI runs entirely inside a Figma iframe in the browser.

## Component Organization (Atomic Design)

```
src/ui/components/
├── atoms/      ← Wrappers of OMC UI Design tokens (Button, Input, Icon…)
├── molecules/  ← Compositions with a single visual responsibility
├── organisms/  ← Complete interface sections
└── ui/         ← shadcn/ui primitives (base layer only)
```

Domain-specific components go inside `src/ui/screens/{screen}/` — NOT in `components/`.  
`components/` is for reusable, business-agnostic UI only.

## Navigation

Always use `MemoryRouter` from `react-router-dom`. Never use `BrowserRouter` — the UI has no real URL.

Route path constants are defined in `src/ui/router/routes.ts`.

---

# IPC with Figma Sandbox

The UI cannot access `figma.*` directly. All communication with the sandbox goes through the typed message channel.

Use the `use-plugin-bridge.ts` hook to abstract over the message channel. Never call `window.parent.postMessage` directly from a component.

```ts
// ✅ Use the bridge hook
import { usePluginBridge } from '@ui/hooks/use-plugin-bridge';

const { requestIdentification } = usePluginBridge();

// ❌ Never do this in a component
window.parent.postMessage({ type: 'identify' }, '*');
```

---

# Data Fetching

All HTTP requests to the external API follow this chain:

```
Screen → Hook → Repository → apiClient → External API
```

- Screens use hooks for loading/error state — never call repositories directly
- Repositories handle request construction and response mapping
- `src/ui/api/client.ts` is the single axios/fetch instance with auth headers
- The sandbox NEVER makes HTTP requests — it sends a message to the UI instead
