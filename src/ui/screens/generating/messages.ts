export const generatingMessages = {
  title: 'Generating artifacts',
  description:
    'The extraction pipeline is reading your current selection and preparing output.',
  waiting: 'Waiting plugin response...',
  steps: {
    variables: 'Variables',
    styles: 'Styles',
    designMd: 'Generating DESIGN.md',
    tokens: 'Generating tokens.json',
    lint: 'Lint validation'
  }
} as const;
