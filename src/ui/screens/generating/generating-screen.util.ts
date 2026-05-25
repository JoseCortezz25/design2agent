import { generatingMessages } from '@ui/screens/generating/messages';

export function resolveStepLabel(label: string) {
  const map = {
    'reading-current-page': generatingMessages.steps.variables,
    'snapshot-ready': generatingMessages.steps.styles,
    'normalizing-snapshot': generatingMessages.steps.designMd,
    'generating-design-artifacts': generatingMessages.steps.tokens,
    'validating-artifacts': generatingMessages.steps.lint,
    'artifacts-ready': generatingMessages.steps.lint
  } as const;

  if (label in map) {
    return map[label as keyof typeof map];
  }

  return label;
}
