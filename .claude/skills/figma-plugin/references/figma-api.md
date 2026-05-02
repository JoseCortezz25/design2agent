# Figma Plugin API Reference

## Node Types

| Type | Description | Key properties |
|------|-------------|----------------|
| `FrameNode` | Frame or auto-layout frame | `children`, `layoutMode`, `name` |
| `ComponentNode` | Master component | `children`, `name`, `key` |
| `InstanceNode` | Component instance | `mainComponent`, `overrides` |
| `TextNode` | Text layer | `characters`, `fontSize`, `fontName` |
| `VectorNode` | Vector shape | `vectorNetwork` |
| `GroupNode` | Group of nodes | `children` |
| `RectangleNode` | Rectangle | `fills`, `cornerRadius` |
| `PageNode` | A page in the document | `children`, `name` |
| `DocumentNode` | Root document | `children` (pages) |

Check type safely:
```ts
if (node.type === 'FRAME') {
  const frame = node as FrameNode;
}
```

---

## Document Traversal

```ts
// All direct children of current page
figma.currentPage.children

// Find all matching nodes (expensive on large docs — use sparingly)
const frames = figma.currentPage.findAll(n => n.type === 'FRAME');

// Find first match (stops early — prefer over findAll when one is enough)
const node = figma.currentPage.findOne(n => n.name === 'Hub Framework');

// Walk a subtree manually (most efficient for controlled traversal)
function traverse(node: SceneNode, cb: (n: SceneNode) => void) {
  cb(node);
  if ('children' in node) {
    for (const child of node.children) traverse(child, cb);
  }
}
```

---

## Selection

```ts
// Read current selection
const selected = figma.currentPage.selection; // readonly SceneNode[]

// Set selection
figma.currentPage.selection = [node1, node2];

// Listen for selection changes
figma.on('selectionchange', () => {
  const nodes = figma.currentPage.selection;
});
```

---

## Node Export

```ts
// Export single node
const bytes = await node.exportAsync({
  format: 'PNG',           // 'PNG' | 'JPG' | 'SVG' | 'PDF'
  constraint: { type: 'SCALE', value: 2 },  // 2x
});

// Export multiple nodes in parallel
const results = await Promise.all(
  nodes.map(n => n.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } }))
);

// Export as SVG string
const svgBytes = await node.exportAsync({ format: 'SVG' });
const svgString = String.fromCharCode(...svgBytes);
```

---

## clientStorage

Async key-value storage that persists across plugin sessions. Scoped to the plugin.

```ts
// Write
await figma.clientStorage.setAsync('auth_token', 'Bearer xxx');

// Read (returns undefined if key doesn't exist)
const token = await figma.clientStorage.getAsync('auth_token');

// Delete
await figma.clientStorage.deleteAsync('auth_token');

// List all keys
const keys = await figma.clientStorage.keysAsync();
```

**Limitations**: Max ~1MB total per plugin. Store tokens and preferences, not large datasets.

---

## Plugin Lifecycle Events

```ts
// Plugin opened
figma.on('run', ({ command }) => {
  // command is the menu command that launched the plugin
});

// Plugin about to close
figma.on('close', () => {
  // cleanup
});

// Document changed (debounce this — fires frequently)
figma.on('documentchange', ({ documentChanges }) => {
  // documentChanges: array of change descriptors
});

// Close the plugin programmatically
figma.closePlugin();
figma.closePlugin('Optional status message');
```

---

## Node Geometry & Transforms

```ts
// Absolute position on canvas
const { x, y } = node.absoluteTransform; // matrix

// Bounding box
const bounds = node.absoluteBoundingBox; // { x, y, width, height } | null

// Relative position (to parent)
node.x; node.y; node.width; node.height;

// Resize (does not affect children proportionally)
node.resize(width, height);

// Rescale (affects children)
node.rescale(factor);
```

---

## Fills, Strokes, Effects

```ts
// Fills is readonly — clone before mutating
const fills = node.fills as Paint[];
node.fills = fills.map(f => ({ ...f, opacity: 0.5 }));

// Check fill type
for (const fill of fills) {
  if (fill.type === 'SOLID') {
    const { r, g, b } = fill.color; // 0–1 range
  }
}
```

---

## Creating Nodes

```ts
const frame = figma.createFrame();
frame.name = 'My Frame';
frame.resize(400, 300);
figma.currentPage.appendChild(frame);

const text = figma.createText();
await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
text.characters = 'Hello';
frame.appendChild(text);
```

---

## Notifications

```ts
// Show a toast notification in Figma
figma.notify('Export complete!');
figma.notify('Something went wrong', { error: true });
figma.notify('Processing...', { timeout: Infinity }); // persistent

// Cancel a notification
const notif = figma.notify('Loading...');
notif.cancel();
```

---

## Plugin Parameters & Commands

```ts
// figma.manifest.ts — multiple menu commands
{
  menu: [
    { name: 'Export', command: 'export' },
    { name: 'Settings', command: 'settings' },
  ]
}

// In plugin.ts — handle command
figma.on('run', ({ command }) => {
  if (command === 'export') launchExportUI();
  if (command === 'settings') launchSettingsUI();
});
```

---

## showUI Options

```ts
figma.showUI(__html__, {
  width: 320,
  height: 480,
  title: 'Template Starter Plugin',
  themeColors: true,   // inherit Figma theme (light/dark)
  visible: true,
});

// Resize UI programmatically
figma.ui.resize(width, height);
```
