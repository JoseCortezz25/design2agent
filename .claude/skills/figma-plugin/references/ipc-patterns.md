# IPC Patterns — monorepo-networker

This project uses `monorepo-networker` for typed communication between the Figma sandbox and the React UI. Never use raw `postMessage` or `figma.ui.postMessage` directly.

---

## Architecture

```
Sandbox (src/plugin/)          UI (src/ui/)
        │                           │
plugin.network.ts ←→ messages ←→ app.network.tsx
        │                           │
        └─────── contract ──────────┘
              network-sides.ts
              (src/common/)
```

---

## 1. Define the Message Contract

All messages are defined once in `src/common/network-sides.ts`:

```ts
// src/common/network-sides.ts
import { NetworkSide, NetworkSides } from 'monorepo-networker';

// Messages the PLUGIN sends to the UI
export const PluginSide = NetworkSide.create({
  name: 'PLUGIN',
  onMessage: (message) => {
    console.log('[PLUGIN] received:', message);
  },
});

// Messages the UI sends to the PLUGIN
export const UISide = NetworkSide.create({
  name: 'UI',
  onMessage: (message) => {
    console.log('[UI] received:', message);
  },
});

// Message types: key = message name, value = payload type
export type PluginMessages = {
  ELEMENTS_IDENTIFIED: { frames: FrameData[]; components: ComponentData[] };
  AUTH_STATE: { isAuthenticated: boolean; token?: string };
  EXPORT_COMPLETE: { success: boolean; error?: string };
};

export type UIMessages = {
  IDENTIFY_ELEMENTS: void;
  LOGOUT: void;
  START_EXPORT: { elementIds: string[]; campaignId: string };
};
```

---

## 2. Initialize the Sandbox Channel

```ts
// src/plugin/plugin.network.ts
import { NetworkingCreator } from 'monorepo-networker';
import { PluginSide, UISide } from '@common/network-sides';

export const pluginNetwork = NetworkingCreator.create({
  side: PluginSide,
  otherSides: [UISide],
  transport: {
    send: (message) => figma.ui.postMessage(message),
    subscribe: (handler) => {
      figma.ui.on('message', handler);
      return () => figma.ui.off('message', handler);
    },
  },
});
```

---

## 3. Initialize the UI Channel

```ts
// src/ui/app.network.tsx
import { NetworkingCreator } from 'monorepo-networker';
import { PluginSide, UISide } from '@common/network-sides';

export const uiNetwork = NetworkingCreator.create({
  side: UISide,
  otherSides: [PluginSide],
  transport: {
    send: (message) => window.parent.postMessage({ pluginMessage: message }, '*'),
    subscribe: (handler) => {
      const listener = (event: MessageEvent) => {
        if (event.data.pluginMessage) handler(event.data.pluginMessage);
      };
      window.addEventListener('message', listener);
      return () => window.removeEventListener('message', listener);
    },
  },
});
```

---

## 4. Register Handlers in the Sandbox

Group handlers by feature, register all at sandbox startup:

```ts
// src/plugin/identification/identification.handler.ts
import { pluginNetwork } from '../plugin.network';

export function registerIdentificationHandlers() {
  pluginNetwork.on('IDENTIFY_ELEMENTS', async () => {
    const frames = await scanFrameworks();
    const components = await scanComponents();

    pluginNetwork.send('ELEMENTS_IDENTIFIED', { frames, components });
  });
}

// src/plugin/plugin.ts
import { pluginNetwork } from './plugin.network';
import { registerIdentificationHandlers } from './identification/identification.handler';
import { registerAuthHandlers } from './auth/auth.handler';

figma.showUI(__html__, { width: 320, height: 480 });

pluginNetwork.initialize();
registerAuthHandlers();
registerIdentificationHandlers();
```

---

## 5. Send Messages from the UI

```ts
// src/ui/hooks/use-plugin-bridge.ts
import { uiNetwork } from '@ui/app.network';

export function usePluginBridge() {
  const requestIdentification = () => {
    uiNetwork.send('IDENTIFY_ELEMENTS', undefined);
  };

  const startExport = (elementIds: string[], campaignId: string) => {
    uiNetwork.send('START_EXPORT', { elementIds, campaignId });
  };

  return { requestIdentification, startExport };
}
```

---

## 6. Listen for Sandbox Replies in the UI

```ts
// src/ui/app.network.tsx (or a hook)
import { uiNetwork } from './app.network';
import { useEffect } from 'react';

export function useIdentificationResult(onResult: (data: ElementsData) => void) {
  useEffect(() => {
    const unsubscribe = uiNetwork.on('ELEMENTS_IDENTIFIED', (data) => {
      onResult(data);
    });
    return unsubscribe;
  }, []);
}
```

---

## Common Patterns

### Request → Response (sandbox does work, UI waits)

```
UI: send('IDENTIFY_ELEMENTS')
                  ↓
Sandbox: on('IDENTIFY_ELEMENTS') → does work → send('ELEMENTS_IDENTIFIED', result)
                  ↓
UI: on('ELEMENTS_IDENTIFIED') → update state
```

### Auth State Sync (sandbox reads clientStorage, notifies UI)

```ts
// sandbox — on startup
const token = await figma.clientStorage.getAsync('auth_token');
pluginNetwork.send('AUTH_STATE', { isAuthenticated: !!token, token });

// UI — on mount
uiNetwork.on('AUTH_STATE', ({ isAuthenticated, token }) => {
  sessionStore.setUser(isAuthenticated ? decodeToken(token) : null);
});
```

### Sandbox requests API call via UI

```
Sandbox: send('FETCH_CLIENTS', { userId })
                ↓
UI: on('FETCH_CLIENTS') → calls clientRepository.list(userId) → send('CLIENTS_LOADED', { clients })
                ↓
Sandbox: on('CLIENTS_LOADED') → stores/uses data
```

---

## Debugging Tips

- All messages are serialized to JSON — classes, functions, and `undefined` values are lost
- Verify both sides call `network.initialize()` before sending any messages
- Handlers registered after a message is sent will miss it — always register before `showUI`
