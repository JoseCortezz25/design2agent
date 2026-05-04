import { DESIGN_MD_VERSION, type DesignMdSettings } from '@common/design-md/domain.types';
import { PLUGIN } from '@common/networkSides';
import { UI_CHANNEL } from '@ui/app.network';
import { useDesignMdStore } from '@ui/store/design-md.store';

let hasRepositoryBinding = false;

function createRequestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}`;
}

export function initializeDesignMdRepository() {
  if (hasRepositoryBinding) {
    return;
  }

  hasRepositoryBinding = true;

  UI_CHANNEL.subscribe('settingsLoaded', payload => {
    useDesignMdStore.getState().actions.setSettings(payload.settings);
  });

  UI_CHANNEL.subscribe('settingsSaved', payload => {
    useDesignMdStore.getState().actions.setSettings(payload.settings);
    useDesignMdStore.getState().actions.showIdle();
  });

  UI_CHANNEL.subscribe('extractionReady', payload => {
    useDesignMdStore.getState().actions.setSourceSnapshot(payload.source);
  });

  UI_CHANNEL.subscribe('pipelineProgress', payload => {
    useDesignMdStore.getState().actions.setProgress(payload);
  });

  UI_CHANNEL.subscribe('pipelineWarning', payload => {
    useDesignMdStore.getState().actions.addIssue(payload.issue);
  });

  UI_CHANNEL.subscribe('pipelineCompleted', payload => {
    useDesignMdStore
      .getState()
      .actions.complete(payload.artifacts, payload.requestId);
  });

  UI_CHANNEL.subscribe('pluginError', payload => {
    useDesignMdStore.getState().actions.fail(payload.message);
  });
}

export function loadDesignMdSettings() {
  UI_CHANNEL.emit(PLUGIN, 'loadSettings', [{ version: DESIGN_MD_VERSION.V1 }]);
}

export function saveDesignMdSettings(settings: DesignMdSettings) {
  UI_CHANNEL.emit(PLUGIN, 'saveSettings', [
    {
      version: DESIGN_MD_VERSION.V1,
      settings
    }
  ]);
}

export function extractCurrentDesignPage() {
  const requestId = createRequestId();
  useDesignMdStore.getState().actions.startGeneration(requestId);

  UI_CHANNEL.emit(PLUGIN, 'extractCurrentPage', [
    {
      version: DESIGN_MD_VERSION.V1,
      requestId
    }
  ]);
}
