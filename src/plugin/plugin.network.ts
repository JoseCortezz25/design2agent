import { PLUGIN, UI } from '@common/networkSides';
import { DESIGN_MD_VERSION } from '@common/design-md/domain.types';
import { registerExtractCurrentPageHandler } from '@plugin/design-md/extract.handler';
import {
  loadDesignMdSettings,
  saveDesignMdSettings
} from '@plugin/design-md/settings.service';

export const PLUGIN_CHANNEL = PLUGIN.channelBuilder()
  .emitsTo(UI, message => {
    figma.ui.postMessage(message);
  })
  .receivesFrom(UI, next => {
    const listener: MessageEventHandler = event => next(event);
    figma.ui.on('message', listener);
    return () => figma.ui.off('message', listener);
  })
  .startListening();

PLUGIN_CHANNEL.registerMessageHandler('loadSettings', async () => {
  const settings = await loadDesignMdSettings();

  PLUGIN_CHANNEL.emit(UI, 'settingsLoaded', [
    {
      version: DESIGN_MD_VERSION.V1,
      settings
    }
  ]);

  return settings;
});

PLUGIN_CHANNEL.registerMessageHandler('saveSettings', async payload => {
  const settings = await saveDesignMdSettings(payload.settings);

  PLUGIN_CHANNEL.emit(UI, 'settingsSaved', [
    {
      version: DESIGN_MD_VERSION.V1,
      settings
    }
  ]);

  return settings;
});

registerExtractCurrentPageHandler(PLUGIN_CHANNEL);

PLUGIN_CHANNEL.registerMessageHandler('cancelJob', async payload => {
  PLUGIN_CHANNEL.emit(UI, 'pipelineWarning', [
    {
      version: DESIGN_MD_VERSION.V1,
      requestId: payload.requestId,
      issue: {
        id: 'pipeline/cancelled',
        severity: 'info',
        rule: 'cancelled-by-user',
        path: 'pipeline',
        message: 'Job cancelled before extraction execution.',
        hint: null
      }
    }
  ]);

  return {
    version: DESIGN_MD_VERSION.V1,
    requestId: payload.requestId,
    isCancelled: true
  };
});

PLUGIN_CHANNEL.subscribe('loadSettings', payload => {
  if (payload.version !== DESIGN_MD_VERSION.V1) {
    PLUGIN_CHANNEL.emit(UI, 'pluginError', [
      {
        version: DESIGN_MD_VERSION.V1,
        requestId: null,
        message: `Unsupported version: ${payload.version}`,
        recoverable: true
      }
    ]);
  }
});

PLUGIN_CHANNEL.subscribe('extractCurrentPage', payload => {
  if (payload.version !== DESIGN_MD_VERSION.V1) {
    PLUGIN_CHANNEL.emit(UI, 'pluginError', [
      {
        version: DESIGN_MD_VERSION.V1,
        requestId: payload.requestId,
        message: `Unsupported version: ${payload.version}`,
        recoverable: true
      }
    ]);
  }
});

PLUGIN_CHANNEL.subscribe('cancelJob', payload => {
  if (payload.version !== DESIGN_MD_VERSION.V1) {
    PLUGIN_CHANNEL.emit(UI, 'pluginError', [
      {
        version: DESIGN_MD_VERSION.V1,
        requestId: payload.requestId,
        message: `Unsupported version: ${payload.version}`,
        recoverable: true
      }
    ]);
  }
});

PLUGIN_CHANNEL.subscribe('saveSettings', payload => {
  if (payload.version !== DESIGN_MD_VERSION.V1) {
    PLUGIN_CHANNEL.emit(UI, 'pluginError', [
      {
        version: DESIGN_MD_VERSION.V1,
        requestId: null,
        message: `Unsupported version: ${payload.version}`,
        recoverable: true
      }
    ]);
  }

  if (payload.settings.version !== DESIGN_MD_VERSION.V1) {
    PLUGIN_CHANNEL.emit(UI, 'pluginError', [
      {
        version: DESIGN_MD_VERSION.V1,
        requestId: null,
        message: `Unsupported settings version: ${payload.settings.version}`,
        recoverable: true
      }
    ]);
  }
});
