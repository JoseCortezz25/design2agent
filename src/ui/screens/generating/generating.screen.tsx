import { ScreenContent } from '@ui/components/layout/screen-content';
import { generatingMessages } from '@ui/screens/generating/messages';
import { resolveStepLabel } from '@ui/screens/generating/generating-screen.util';

interface GeneratingScreenProps {
  progressLabel: string;
  progressValue: number;
}

export function GeneratingScreen({
  progressLabel,
  progressValue
}: GeneratingScreenProps) {
  return (
    <ScreenContent>
      <div>
        <h2 className="text-foreground text-lg font-semibold">
          {generatingMessages.title}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          {generatingMessages.description}
        </p>
      </div>

      <div className="border-border bg-background/75 space-y-3 rounded-[24px] border p-4 shadow-[0_12px_28px_rgba(31,111,95,0.06)]">
        <p className="text-muted-foreground text-[11px] tracking-[0.28em] uppercase">
          {progressLabel.length > 0
            ? resolveStepLabel(progressLabel)
            : generatingMessages.waiting}
        </p>
        <div className="bg-muted h-3 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${progressValue}%` }}
          />
        </div>
        <p className="text-foreground text-sm font-semibold">
          {progressValue}%
        </p>
      </div>

      <ul className="text-muted-foreground grid grid-cols-1 gap-2 text-xs">
        {Object.values(generatingMessages.steps).map(step => (
          <li
            key={step}
            className="border-border bg-card rounded-2xl border px-3 py-2"
          >
            {step}
          </li>
        ))}
      </ul>
    </ScreenContent>
  );
}
