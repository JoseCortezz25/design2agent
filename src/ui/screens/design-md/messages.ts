export const designMdMessages = {
  title: 'DESIGN.md',
  chrome: {
    draft: 'v1 · Compact dark'
  },
  badge: {
    figmaDetected: 'Figma detected'
  },
  metrics: {
    colors: 'Colors',
    textStyles: 'Text styles',
    variables: 'Variables',
    effects: 'Effects'
  },
  idle: {
    title: 'Generate DESIGN.md',
    description:
      'Extract from current page and generate deterministic artifacts for documentation and tokens.',
    generate: 'Generate DESIGN.md',
    settings: 'Configure options'
  },
  generating: {
    title: 'Generating artifacts',
    description: 'Pipeline running over current page data.',
    waiting: 'Waiting plugin response...',
    stepsTitle: 'Pipeline steps',
    steps: {
      variables: 'Variables',
      styles: 'Styles',
      designMd: 'Generating DESIGN.md',
      tokens: 'Generating tokens.json',
      lint: 'Lint validation'
    }
  },
  preview: {
    title: 'Preview and download',
    tabs: {
      markdown: 'DESIGN.md',
      tokens: 'TOKENS.JSON',
      tailwindV4: 'TAILWIND V4',
      lint: 'LINT'
    },
    downloads: {
      title: 'Downloads',
      markdown: 'Download DESIGN.md',
      tokens: 'Download tokens.json',
      tailwindV4: 'Download tailwind.theme.css',
      zip: 'Download both (.zip)',
      zipUnavailable: 'ZIP unavailable in this run',
      blockedByErrors: 'Resolve lint errors to enable downloads.'
    },
    lint: {
      clean: 'No issues found.',
      counts: 'Issue summary'
    }
  },
  settings: {
    title: 'Settings',
    description: 'Source and output configuration persisted in plugin storage.',
    sourceSection: 'Source',
    outputSection: 'Output',
    defaultMode: 'Default mode',
    defaultModeUnavailable: 'Static in v1 (current-page only)',
    primaryCollection: 'Primary collection id',
    includeComponents: 'Include components summary',
    includeTokens: 'Include tokens.json output',
    includeTailwindV4: 'Include Tailwind CSS v4 output',
    includeWarnings: 'Run lint and include warnings',
    includeZip: 'Enable zip output when available',
    save: 'Save settings',
    back: 'Back to generator'
  },
  failed: {
    title: 'Pipeline failed',
    description: 'The plugin reported an error. Review details and retry.',
    retry: 'Retry generation'
  }
} as const;
