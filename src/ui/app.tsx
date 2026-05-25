import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { defaultUiRoute, homeRoutes } from '@ui/router/routes';
import {
  initializeDesignMdRepository,
  loadDesignMdSettings
} from '@ui/repositories/design-md.repository';
import { CompletedRouteScreen } from '@ui/screens/completed/completed-route.screen';
import { FailedRouteScreen } from '@ui/screens/failed/failed-route.screen';
import { GeneratingRouteScreen } from '@ui/screens/generating/generating-route.screen';
import { HomeLayoutScreen } from '@ui/screens/home/home-layout.screen';
import { HomeScreen } from '@ui/screens/home/home.screen';
import { SettingsRouteScreen } from '@ui/screens/settings/settings-route.screen';

import '@ui/styles/main.css';

export function App() {
  useEffect(() => {
    initializeDesignMdRepository();
    loadDesignMdSettings();
  }, []);

  return (
    <MemoryRouter>
      <Routes>
        <Route path={homeRoutes.root} element={<HomeLayoutScreen />}>
          <Route index element={<HomeScreen />} />
          <Route path={homeRoutes.settings} element={<SettingsRouteScreen />} />
          <Route
            path={homeRoutes.generating}
            element={<GeneratingRouteScreen />}
          />
          <Route
            path={homeRoutes.completed}
            element={<CompletedRouteScreen />}
          />
          <Route path={homeRoutes.failed} element={<FailedRouteScreen />} />
        </Route>
        <Route path="*" element={<Navigate replace to={defaultUiRoute} />} />
      </Routes>
    </MemoryRouter>
  );
}
