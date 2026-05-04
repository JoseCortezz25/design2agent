export const uiRoutes = {
  designMd: '/design-md'
} as const;

export type UiRoute = (typeof uiRoutes)[keyof typeof uiRoutes];

export const defaultUiRoute: UiRoute = uiRoutes.designMd;
