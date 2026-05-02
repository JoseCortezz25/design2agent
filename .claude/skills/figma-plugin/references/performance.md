# Performance Best Practices

The Figma sandbox runs on the **UI thread** of the Figma desktop app. Heavy synchronous work blocks the entire Figma interface until it completes. These rules are non-negotiable for good plugin UX.

---

## Rule 1: Avoid findAll() on Large Documents

`findAll()` and `findAllWithCriteria()` traverse the entire document tree. On large files with thousands of nodes, this blocks the UI thread for seconds.

```ts
// ❌ WRONG — traverses entire document
const allFrames = figma.currentPage.findAll(n => n.type === 'FRAME');

// ✅ BETTER — only search within a known scope
const targetFrames = figma.currentPage.children
  .filter((n): n is FrameNode => n.type === 'FRAME');

// ✅ BEST — use findAllWithCriteria (more targeted)
const frames = figma.currentPage.findAllWithCriteria({ types: ['FRAME'] });
```

If you must search broadly, limit the depth:

```ts
function findInDepth(node: BaseNode, type: string, maxDepth: number): SceneNode[] {
  if (maxDepth <= 0) return [];
  const results: SceneNode[] = [];
  if ('children' in node) {
    for (const child of (node as ChildrenMixin).children) {
      if (child.type === type) results.push(child);
      results.push(...findInDepth(child, type, maxDepth - 1));
    }
  }
  return results;
}
```

---

## Rule 2: Batch Reads Before Writes

Alternating property reads and writes forces Figma to recalculate layout after every write, which is extremely expensive.

```ts
// ❌ WRONG — read-write-read-write causes repeated layout recalcs
for (const node of nodes) {
  const x = node.x;             // read
  node.x = x + 10;              // write → layout recalc
  const width = node.width;     // read (forces recalc to resolve)
  node.resize(width, 100);      // write → layout recalc
}

// ✅ CORRECT — all reads first, then all writes
const positions = nodes.map(n => ({ x: n.x, width: n.width }));
for (let i = 0; i < nodes.length; i++) {
  nodes[i].x = positions[i].x + 10;
  nodes[i].resize(positions[i].width, 100);
}
```

---

## Rule 3: Defer Heavy Loops

For processing hundreds or thousands of nodes, yield control back to Figma periodically to prevent the "spinning cursor" experience.

```ts
// ✅ Yield every N iterations to keep Figma responsive
async function processNodes(nodes: SceneNode[]) {
  const BATCH_SIZE = 50;
  
  for (let i = 0; i < nodes.length; i++) {
    processNode(nodes[i]);
    
    if (i % BATCH_SIZE === 0 && i > 0) {
      // Yield to Figma's event loop
      await new Promise(r => setTimeout(r, 0));
      
      // Optionally notify UI of progress
      pluginNetwork.send('PROGRESS_UPDATE', {
        current: i,
        total: nodes.length,
      });
    }
  }
}
```

---

## Rule 4: Export Assets in Parallel

`exportAsync()` is async and IO-bound — run multiple exports concurrently.

```ts
// ❌ WRONG — sequential, slow
const results = [];
for (const node of nodes) {
  results.push(await node.exportAsync({ format: 'PNG' }));
}

// ✅ CORRECT — parallel
const results = await Promise.all(
  nodes.map(n => n.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } }))
);
```

For very large exports (50+ nodes), chunk into batches to avoid memory issues:

```ts
async function exportInBatches(nodes: SceneNode[], batchSize = 10) {
  const results: Uint8Array[] = [];
  for (let i = 0; i < nodes.length; i += batchSize) {
    const batch = nodes.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(n => n.exportAsync({ format: 'PNG' }))
    );
    results.push(...batchResults);
  }
  return results;
}
```

---

## Rule 5: Cache Expensive Lookups

Don't re-traverse the document inside event handlers or loops.

```ts
// ❌ WRONG — findAll on every selection change
figma.on('selectionchange', () => {
  const allFrames = figma.currentPage.findAll(n => n.type === 'FRAME'); // expensive
});

// ✅ CORRECT — compute once, listen for doc changes to invalidate
let cachedFrames: FrameNode[] | null = null;

function getHubFrameworks(): FrameNode[] {
  if (!cachedFrames) {
    cachedFrames = figma.currentPage.findAllWithCriteria({ types: ['FRAME'] })
      .filter(isHubFramework);
  }
  return cachedFrames;
}

// Invalidate on document changes (debounced)
figma.on('documentchange', debounce(() => {
  cachedFrames = null;
}, 500));
```

---

## Rule 6: Minimize font loads

`figma.loadFontAsync()` is slow. Load fonts once and cache the promise.

```ts
// ❌ WRONG — loads font on every iteration
for (const textNode of textNodes) {
  await figma.loadFontAsync(textNode.fontName as FontName);
  textNode.characters = 'Updated';
}

// ✅ CORRECT — deduplicate font loads
const fontsNeeded = [...new Set(
  textNodes.map(n => JSON.stringify(n.fontName))
)].map(s => JSON.parse(s) as FontName);

await Promise.all(fontsNeeded.map(f => figma.loadFontAsync(f)));

for (const textNode of textNodes) {
  textNode.characters = 'Updated'; // fonts already loaded
}
```

---

## Rule 7: Keep the UI iframe Lightweight

- Lazy-load heavy libraries — don't import everything at startup
- Avoid blocking the main thread in the UI — use `setTimeout` for non-critical work
- Keep the total inlined `index.html` under ~5MB; Figma loads it on every plugin open

---

## Performance Checklist

- [ ] No `findAll()` on the entire document — scoped or typed traversal only
- [ ] Reads batched before writes in loops
- [ ] Heavy loops yield with `await new Promise(r => setTimeout(r, 0))`
- [ ] Multiple `exportAsync()` calls use `Promise.all()`
- [ ] Font loads deduplicated with `Promise.all()`
- [ ] No expensive lookups inside event handlers without caching
