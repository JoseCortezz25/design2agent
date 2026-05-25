import { GeneratingScreen } from '@ui/screens/generating/generating.screen';
import { useDesignMdStore } from '@ui/store/design-md.store';

export function GeneratingRouteScreen() {
  const { progress } = useDesignMdStore();
  const progressValue = Math.max(
    0,
    Math.min(100, Math.round((progress.current / progress.total) * 100))
  );

  return (
    <GeneratingScreen
      progressLabel={progress.label}
      progressValue={progressValue}
    />
  );
}
