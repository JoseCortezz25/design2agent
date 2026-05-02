---
name: figma-plugin
description: Best practices for developing Figma plugins with the dual execution context model (sandbox + UI iframe). Use when writing code in src/plugin/ (sandbox), setting up IPC between sandbox and UI, working with the figma.* API, exporting assets, reading/writing the canvas, managing clientStorage, or handling Figma-specific constraints. Covers the monorepo-networker IPC pattern, node traversal, asset export, performance, and manifest configuration.
---

# Figma Plugin Development

## Execution Context Rules (Non-Negotiable)

Two completely isolated threads — no shared memory, no direct imports across boundary:

| Context | Path | Access |
|---------|------|--------|
| Sandbox | `src/plugin/` | `figma.*` API, canvas, `clientStorage` — NO browser APIs |
| UI iframe | `src/ui/` | React, DOM, fetch — NO `figma.*` |
| Shared | `src/common/` | Types + message contract only |

**If you need to call an external API from the sandbox → send a message to the UI. The UI makes the request and replies.**

---

## IPC with monorepo-networker

All cross-context messages MUST go through the typed contract. Never use raw `postMessage`.

**Contract** → `src/common/network-sides.ts`  
**Sandbox channel** → `src/plugin/plugin.network.ts`  
**UI channel** → `src/ui/app.network.tsx`

See `references/ipc-patterns.md` for setup patterns and typed message examples.

---

## Working with the Figma API

For the full API reference: `references/figma-api.md`

**Quick patterns:**

```ts
// Read selection
const nodes = figma.currentPage.selection;

// Traverse a node's children
for (const child of node.children) { ... }

// Find by type
const frames = figma.currentPage.findAllWithCriteria({ types: ['FRAME'] });

// Export a node as PNG bytes
const bytes = await node.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });

// clientStorage (async key-value, persists between sessions)
await figma.clientStorage.setAsync('token', value);
const token = await figma.clientStorage.getAsync('token');

// Close the plugin
figma.closePlugin();
```

---

## Performance Rules

Performance is critical — the sandbox blocks Figma's UI thread when doing heavy work.

See `references/performance.md` for full guidance. Critical rules:

- **Avoid `findAll()` on large documents** — prefer `findAllWithCriteria()` or targeted traversal
- **Batch reads before writes** — never alternate read/write in a loop (triggers layout recalculation)
- **Defer expensive work** — break heavy loops with `await new Promise(r => setTimeout(r, 0))`
- **Export in parallel** — use `Promise.all()` for multiple `exportAsync()` calls

---

## Manifest Configuration

This project uses `figma.manifest.ts` (TypeScript) compiled by Vite. Key fields:

```ts
// figma.manifest.ts
export default {
  name: 'Template Starter Plugin',
  id: 'com.example.template-starter-plugin',
  api: '1.0.0',
  main: 'dist/plugin.js',   // sandbox output
  ui: 'dist/index.html',    // UI output (must be single inlined file)
  editorType: ['figma'],
}
```

`dist/index.html` MUST have all assets inlined (enforced by `vite-plugin-singlefile`). Figma cannot load external resources.

---

## Sandbox Handler Pattern

Each feature in the sandbox is a handler — it receives a message, does work, sends a reply.

```ts
// src/plugin/identification/identification.handler.ts
import { pluginNetwork } from '../plugin.network';

export function registerIdentificationHandlers() {
  pluginNetwork.on('IDENTIFY_ELEMENTS', async () => {
    const frames = findHubFrameworks();
    const components = findIndependentComponents();
    pluginNetwork.send('ELEMENTS_IDENTIFIED', { frames, components });
  });
}
```

Register all handlers in `plugin.ts` at startup — never register inside other handlers.

---

## Node Identification (This Project)

The sandbox identifies two element types on the canvas:

- **Hub Frameworks**: `FrameNode` with names matching the nomenclature in `src/plugin/export/nomenclature.ts`
- **Independent components**: `InstanceNode` not nested inside a Hub Framework

See `src/plugin/lib/node-traversal.ts` for traversal utilities.

---

## Reference Files

| File | When to read |
|------|-------------|
| `references/figma-api.md` | Working with figma.* API — node types, events, methods |
| `references/ipc-patterns.md` | Setting up or debugging sandbox ↔ UI communication |
| `references/performance.md` | Optimizing canvas traversal or asset export |
