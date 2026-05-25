import type { DesignMdSettings } from '@common/design-md/domain.types';

export function createUpdatedSettings(
  currentSettings: DesignMdSettings | null,
  updates: Partial<DesignMdSettings>
) {
  if (currentSettings == null) {
    return null;
  }

  return {
    ...currentSettings,
    ...updates
  };
}
