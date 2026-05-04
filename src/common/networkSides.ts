import { Networker } from 'monorepo-networker';
import type {
  DesignMdArtifactBundle,
  DesignMdExtractionReadyPayload,
  DesignMdPipelineCompletedPayload,
  DesignMdPipelineProgressPayload,
  DesignMdPipelineWarningPayload,
  DesignMdPluginErrorPayload,
  DesignMdSettings,
  DesignMdSettingsLoadedPayload,
  DesignMdSettingsSavedPayload
} from '@common/design-md/domain.types';

export const UI = Networker.createSide('UI-side').listens<{
  settingsLoaded(payload: DesignMdSettingsLoadedPayload): void;
  settingsSaved(payload: DesignMdSettingsSavedPayload): void;
  extractionReady(payload: DesignMdExtractionReadyPayload): void;
  pluginError(payload: DesignMdPluginErrorPayload): void;
  pipelineProgress(payload: DesignMdPipelineProgressPayload): void;
  pipelineWarning(payload: DesignMdPipelineWarningPayload): void;
  pipelineCompleted(payload: DesignMdPipelineCompletedPayload): void;
}>();

export const PLUGIN = Networker.createSide('Plugin-side').listens<{
  loadSettings(payload: { version: string }): Promise<DesignMdSettings>;
  saveSettings(payload: {
    version: string;
    settings: DesignMdSettings;
  }): Promise<DesignMdSettings>;
  extractCurrentPage(payload: {
    version: string;
    requestId: string;
  }): Promise<DesignMdArtifactBundle | null>;
  cancelJob(payload: {
    version: string;
    requestId: string;
  }): Promise<{ version: string; requestId: string; isCancelled: boolean }>;
}>();
