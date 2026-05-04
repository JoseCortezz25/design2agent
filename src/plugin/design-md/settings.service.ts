import {
  DESIGN_MD_VERSION,
  type DesignMdSettings,
  type DesignMdVersion
} from '@common/design-md/domain.types';

const DESIGN_MD_SETTINGS_STORAGE_KEY = 'design-md/settings/v1';

const DEFAULT_DESIGN_MD_SETTINGS: DesignMdSettings = {
  version: DESIGN_MD_VERSION.V1,
  scope: 'current-page',
  primaryCollectionId: null,
  includeComponents: true,
  includeTokens: true,
  includeTailwindV4: true,
  includeWarnings: true,
  includeZip: false,
  lastPageId: null
};

interface DesignMdSettingsRecord {
  version: DesignMdVersion;
  settings: DesignMdSettings;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function parseSettings(value: unknown): DesignMdSettings | null {
  if (!isRecord(value)) {
    return null;
  }

  if (value.version !== DESIGN_MD_VERSION.V1 || !isRecord(value.settings)) {
    return null;
  }

  const settings = value.settings;

  if (
    settings.version !== DESIGN_MD_VERSION.V1 ||
    settings.scope !== 'current-page' ||
    !isStringOrNull(settings.primaryCollectionId) ||
    !isBoolean(settings.includeComponents) ||
    !isBoolean(settings.includeTokens) ||
    !isBoolean(settings.includeTailwindV4) ||
    !isBoolean(settings.includeWarnings) ||
    !isBoolean(settings.includeZip) ||
    !isStringOrNull(settings.lastPageId)
  ) {
    return null;
  }

  return {
    version: DESIGN_MD_VERSION.V1,
    scope: 'current-page',
    primaryCollectionId: settings.primaryCollectionId,
    includeComponents: settings.includeComponents,
    includeTokens: settings.includeTokens,
    includeTailwindV4: settings.includeTailwindV4,
    includeWarnings: settings.includeWarnings,
    includeZip: settings.includeZip,
    lastPageId: settings.lastPageId
  };
}

export function getDefaultDesignMdSettings(): DesignMdSettings {
  return { ...DEFAULT_DESIGN_MD_SETTINGS };
}

export async function loadDesignMdSettings(): Promise<DesignMdSettings> {
  const storedValue = await figma.clientStorage.getAsync(
    DESIGN_MD_SETTINGS_STORAGE_KEY
  );
  const parsedSettings = parseSettings(storedValue);

  if (parsedSettings === null) {
    return getDefaultDesignMdSettings();
  }

  return parsedSettings;
}

export async function saveDesignMdSettings(
  settings: DesignMdSettings
): Promise<DesignMdSettings> {
  const normalizedSettings: DesignMdSettings = {
    ...getDefaultDesignMdSettings(),
    ...settings,
    version: DESIGN_MD_VERSION.V1,
    scope: 'current-page'
  };

  const record: DesignMdSettingsRecord = {
    version: DESIGN_MD_VERSION.V1,
    settings: normalizedSettings
  };

  await figma.clientStorage.setAsync(DESIGN_MD_SETTINGS_STORAGE_KEY, record);

  return normalizedSettings;
}
