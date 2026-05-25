import { ScreenContent } from '@ui/components/layout/screen-content';
import { Button } from '@ui/components/ui/button';
import { useDesignMdActions } from '@ui/screens/design-md/use-design-md-actions';
import { failedMessages } from '@ui/screens/failed/messages';

interface FailedScreenProps {
  errorMessage: string | null;
}

export function FailedScreen({ errorMessage }: FailedScreenProps) {
  const { startDesignMdExtraction } = useDesignMdActions();

  return (
    <ScreenContent>
      <div>
        <h2 className="text-foreground text-lg font-semibold">
          {failedMessages.title}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm leading-6">
          {failedMessages.description}
        </p>
      </div>
      <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-[24px] border p-4 text-xs leading-5">
        {errorMessage}
      </p>
      <Button className="w-full" onClick={startDesignMdExtraction}>
        {failedMessages.retry}
      </Button>
    </ScreenContent>
  );
}
