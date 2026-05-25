import type { DesignMdSourceSnapshot } from '@common/design-md/domain.types';
import { getMetricValue } from '@ui/screens/home/home-screen.util';
import { homeMessages } from '@ui/screens/home/messages';

interface HomeMetricsProps {
  sourceSnapshot: DesignMdSourceSnapshot | null;
}

export function HomeMetrics({ sourceSnapshot }: HomeMetricsProps) {
  const metrics = [
    {
      key: homeMessages.metrics.colors,
      value: getMetricValue(sourceSnapshot?.localPaintStyles.length ?? 0),
      className: 'col-span-1'
    },
    {
      key: homeMessages.metrics.textStyles,
      value: getMetricValue(sourceSnapshot?.localTextStyles.length ?? 0),
      className: 'col-span-1'
    }
  ];

  return (
    <div className="mb-5 grid grid-cols-2 gap-3">
      {metrics.map(metric => (
        <article
          key={metric.key}
          className={`${metric.className} border-primary/25 bg-background rounded-[20px] border p-4`}
        >
          <p className="text-muted-foreground text-[10px] font-bold tracking-[0.24em] uppercase">
            {metric.key}
          </p>
          <p className="text-foreground mt-3 text-[2.15rem] leading-none font-bold tracking-[-0.06em]">
            {metric.value}
          </p>
        </article>
      ))}
    </div>
  );
}
