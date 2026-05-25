import { FailedScreen } from '@ui/screens/failed/failed.screen';
import { useDesignMdStore } from '@ui/store/design-md.store';

export function FailedRouteScreen() {
  const { errorMessage } = useDesignMdStore();

  return <FailedScreen errorMessage={errorMessage} />;
}
