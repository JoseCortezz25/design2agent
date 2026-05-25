export const homeRoutes = {
  root: '/home',
  settings: 'settings',
  generating: 'generating',
  completed: 'completed',
  failed: 'failed'
} as const;

export const homePaths = {
  home: homeRoutes.root,
  settings: `${homeRoutes.root}/${homeRoutes.settings}`,
  generating: `${homeRoutes.root}/${homeRoutes.generating}`,
  completed: `${homeRoutes.root}/${homeRoutes.completed}`,
  failed: `${homeRoutes.root}/${homeRoutes.failed}`
} as const;

export type HomePath = (typeof homePaths)[keyof typeof homePaths];

export const defaultUiRoute: HomePath = homePaths.home;
