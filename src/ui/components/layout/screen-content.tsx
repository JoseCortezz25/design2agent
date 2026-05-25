import type { HTMLAttributes } from 'react';
import { cn } from '@ui/lib/utils';

const SCREEN_CONTENT_LAYOUT = {
  STACK: 'stack',
  SPREAD: 'spread'
} as const;

type ScreenContentLayout =
  (typeof SCREEN_CONTENT_LAYOUT)[keyof typeof SCREEN_CONTENT_LAYOUT];

interface ScreenContentProps extends HTMLAttributes<HTMLElement> {
  layout?: ScreenContentLayout;
}

const screenContentLayoutClassName: Record<ScreenContentLayout, string> = {
  [SCREEN_CONTENT_LAYOUT.STACK]: 'space-y-4',
  [SCREEN_CONTENT_LAYOUT.SPREAD]: 'flex flex-col justify-between gap-4'
};

export function ScreenContent({
  children,
  className,
  layout = SCREEN_CONTENT_LAYOUT.STACK,
  ...props
}: ScreenContentProps) {
  return (
    <section
      className={cn(
        'min-h-[20rem]',
        screenContentLayoutClassName[layout],
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}
