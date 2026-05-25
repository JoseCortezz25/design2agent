import { Settings } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import { Button } from '@ui/components/ui/button';
import { homePaths } from '@ui/router/routes';
import { useDesignMdStore } from '@ui/store/design-md.store';
import { HomeMetrics } from '@ui/screens/home/home-metrics';
import { homeMessages } from '@ui/screens/home/messages';
import { useHomeRouteSync } from '@ui/screens/home/use-home-route-sync';

const routesWithoutMetrics = new Set<string>([
  homePaths.settings,
  homePaths.completed
]);

export function HomeLayoutScreen() {
  const location = useLocation();
  const { status, sourceSnapshot, actions } = useDesignMdStore();
  const shouldShowMetrics = !routesWithoutMetrics.has(location.pathname);
  const isSettingsRoute = location.pathname === homePaths.settings;

  useHomeRouteSync(status);

  return (
    <main className="text-foreground min-h-screen overflow-x-hidden bg-white">
      <section className="h-fit min-h-screen w-full min-w-0 overflow-hidden p-4">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-foreground text-base leading-none font-bold tracking-[-0.04em]">
              {homeMessages.productName}
            </p>
          </div>

          {isSettingsRoute ? (
            <Button size="sm" variant="ghost" onClick={actions.showIdle}>
              {homeMessages.navigation.back}
            </Button>
          ) : (
            <Button
              aria-label={homeMessages.navigation.settings}
              size="icon"
              variant="ghost"
              onClick={actions.showSettings}
            >
              <Settings aria-hidden className="size-4" />
            </Button>
          )}
        </div>

        {shouldShowMetrics ? (
          <HomeMetrics sourceSnapshot={sourceSnapshot} />
        ) : null}

        <Outlet />
      </section>
    </main>
  );
}
