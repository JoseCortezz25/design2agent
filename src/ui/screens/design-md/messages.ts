export const designMdMessages = {
  productName: 'design2agent',
  title: 'DESIGN.md',
  chrome: {
    draft: 'AI context extractor'
  },
  badge: {
    figmaDetected: 'Figma selection ready'
  },
  metrics: {
    colors: 'Colors',
    textStyles: 'Typography',
    variables: 'Variables',
    effects: 'Effects'
  },
  idle: {
    title:
      'Extract tokens and layout structures directly from your Figma selection.',

    description:
      'Turn your current page into DESIGN.md, tokens, and implementation-ready output with a cleaner, more focused flow.',
    generate: 'Extract your DESIGN.md',
    settings: 'Open settings'
  },
  generating: {
    title: 'Generating artifacts',
    description:
      'The extraction pipeline is reading your current selection and preparing output.',
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
      markdown: 'DESIGN.md',
      tokens: 'tokens.json',
      tailwindV4: 'Download tailwind.theme.css',
      zip: 'Download both (.zip)',
      zipLabel: 'Both (.zip)',
      zipUnavailable: 'ZIP unavailable in this run',
      blockedByErrors: 'Resolve lint errors to enable downloads.'
    },
    lint: {
      title: 'Lint Results',
      clean: 'No issues found.',
      counts: 'Issue summary',
      severity: {
        error: 'ERROR',
        warning: 'WARN',
        info: 'INFO'
      },
      total: (count: number) => `${count} tokens total`
    }
  },
  settings: {
    title: 'Extraction settings',
    description:
      'Control the source scope and the generated outputs stored by the plugin.',
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
    description:
      'The plugin reported an error. Review the message and retry the extraction.',
    retry: 'Retry generation'
  }
} as const;
