import { SettingsScreen } from '@ui/screens/settings/settings.screen';
import { useDesignMdStore } from '@ui/store/design-md.store';

export function SettingsRouteScreen() {
  const { settings, actions } = useDesignMdStore();

  return (
    <SettingsScreen
      settings={settings}
      onSetSettings={actions.setSettings}
      onShowHome={actions.showIdle}
    />
  );
}
