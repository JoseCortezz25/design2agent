import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { defaultUiRoute, uiRoutes } from '@ui/router/routes';
import {
  initializeDesignMdRepository,
  loadDesignMdSettings
} from '@ui/repositories/design-md.repository';
import { DesignMdScreen } from '@ui/screens/design-md/design-md.screen';

import '@ui/styles/main.css';

export function App() {
  useEffect(() => {
    initializeDesignMdRepository();
    loadDesignMdSettings();
  }, []);

  return (
    <MemoryRouter>
      <Routes>
        <Route path={uiRoutes.designMd} element={<DesignMdScreen />} />
        <Route path="*" element={<Navigate replace to={defaultUiRoute} />} />
      </Routes>
    </MemoryRouter>
  );
}
