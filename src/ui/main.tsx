import { UI } from '@common/networkSides';
import { UI_CHANNEL } from '@ui/app.network';
import { Networker } from 'monorepo-networker';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

async function bootstrap() {
  Networker.initialize(UI, UI_CHANNEL);

  const { App } = await import('./app');

  const rootElement = document.getElementById('root') as HTMLElement;
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();
