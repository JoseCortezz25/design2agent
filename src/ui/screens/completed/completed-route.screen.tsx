import { CompletedScreen } from '@ui/screens/completed/completed.screen';
import { useDesignMdStore } from '@ui/store/design-md.store';

export function CompletedRouteScreen() {
  const { activeTab, artifacts, actions } = useDesignMdStore();

  return (
    <CompletedScreen
      activeTab={activeTab}
      artifacts={artifacts}
      onSetTab={actions.setTab}
    />
  );
}
