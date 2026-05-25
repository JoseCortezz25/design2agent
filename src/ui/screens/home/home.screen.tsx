import { ScreenContent } from '@ui/components/layout/screen-content';
import { Button } from '@ui/components/ui/button';
import { useDesignMdActions } from '@ui/screens/design-md/use-design-md-actions';
import { homeMessages } from '@ui/screens/home/messages';

export function HomeScreen() {
  const { startDesignMdExtraction } = useDesignMdActions();

  return (
    <ScreenContent layout="spread">
      <div>
        <h1 className="text-foreground mt-3 max-w-[16ch] text-[2rem] leading-[1.02] font-bold tracking-[-0.06em]">
          {homeMessages.idle.title}
        </h1>
        <p className="text-muted-foreground mt-4 max-w-[34ch] text-sm leading-6">
          {homeMessages.idle.description}
        </p>
      </div>

      <Button className="w-full" size="lg" onClick={startDesignMdExtraction}>
        {homeMessages.idle.generate}
      </Button>
    </ScreenContent>
  );
}
