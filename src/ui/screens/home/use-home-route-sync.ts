import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { homePaths } from '@ui/router/routes';
import {
  DESIGN_MD_UI_STATUS,
  type DesignMdUiStatus
} from '@ui/store/design-md.store';

const designMdStatusRoute: Record<DesignMdUiStatus, string> = {
  [DESIGN_MD_UI_STATUS.IDLE]: homePaths.home,
  [DESIGN_MD_UI_STATUS.SETTINGS]: homePaths.settings,
  [DESIGN_MD_UI_STATUS.GENERATING]: homePaths.generating,
  [DESIGN_MD_UI_STATUS.COMPLETED]: homePaths.completed,
  [DESIGN_MD_UI_STATUS.FAILED]: homePaths.failed
};

export function useHomeRouteSync(status: DesignMdUiStatus) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const nextRoute = designMdStatusRoute[status];

    if (location.pathname !== nextRoute) {
      navigate(nextRoute, { replace: true });
    }
  }, [location.pathname, navigate, status]);
}
