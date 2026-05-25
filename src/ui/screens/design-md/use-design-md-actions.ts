import type { DesignMdSettings } from '@common/design-md/domain.types';
import {
  extractCurrentDesignPage,
  saveDesignMdSettings
} from '@ui/repositories/design-md.repository';

export function useDesignMdActions() {
  function startDesignMdExtraction() {
    extractCurrentDesignPage();
  }

  function persistDesignMdSettings(settings: DesignMdSettings) {
    saveDesignMdSettings(settings);
  }

  return {
    startDesignMdExtraction,
    persistDesignMdSettings
  };
}
