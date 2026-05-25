import { PLUGIN, UI } from '@common/networkSides';
import {
  DESIGN_MD_PIPELINE_PHASE,
  DESIGN_MD_VERSION,
  type DesignMdArtifactBundle,
  type DesignMdIssue
} from '@common/design-md/domain.types';
import { normalizeDesignSnapshot } from '@common/design-md/normalize';
import { mapNormalizedToDtcgJson } from '@common/design-md/dtcg.mapper';
import { generateDesignMd } from '@common/design-md/design-md.generator';
import { mapSnapshotToSemanticModel } from '@common/design-md/semantic.mapper';
import { generateTailwindV4ThemeCss } from '@common/design-md/tailwind-v4.generator';
import { validateNormalizedDesign } from '@common/design-md/design-md.validator';
import { createCurrentPageSnapshot } from './canvas.snapshot';
import { loadDesignMdSettings } from './settings.service';
import { createArtifactZipBase64 } from './artifact-zip.service';

type PluginChannel = ReturnType<
  ReturnType<typeof PLUGIN.channelBuilder>['startListening']
>;

function emitProgress(
  pluginChannel: PluginChannel,
  requestId: string,
  current: number,
  total: number,
  label: string
) {
  pluginChannel.emit(UI, 'pipelineProgress', [
    {
      version: DESIGN_MD_VERSION.V1,
      requestId,
      phase: DESIGN_MD_PIPELINE_PHASE.EXTRACTION,
      current,
      total,
      label
    }
  ]);
}

function emitWarning(
  pluginChannel: PluginChannel,
  requestId: string,
  issue: DesignMdIssue
) {
  pluginChannel.emit(UI, 'pipelineWarning', [
    {
      version: DESIGN_MD_VERSION.V1,
      requestId,
      issue
    }
  ]);
}

export function registerExtractCurrentPageHandler(pluginChannel: PluginChannel) {
  pluginChannel.registerMessageHandler('extractCurrentPage', async payload => {
    try {
      emitProgress(pluginChannel, payload.requestId, 0, 5, 'reading-current-page');

      const { snapshot, warnings } = await createCurrentPageSnapshot();

      for (const warning of warnings) {
        emitWarning(pluginChannel, payload.requestId, warning);
      }

      emitProgress(pluginChannel, payload.requestId, 1, 5, 'snapshot-ready');

      pluginChannel.emit(UI, 'pipelineProgress', [
        {
          version: DESIGN_MD_VERSION.V1,
          requestId: payload.requestId,
          phase: DESIGN_MD_PIPELINE_PHASE.NORMALIZATION,
          current: 2,
          total: 5,
          label: 'normalizing-snapshot'
        }
      ]);

      const normalized = normalizeDesignSnapshot(snapshot);

      pluginChannel.emit(UI, 'pipelineProgress', [
        {
          version: DESIGN_MD_VERSION.V1,
          requestId: payload.requestId,
          phase: DESIGN_MD_PIPELINE_PHASE.VALIDATION,
          current: 3,
          total: 5,
          label: 'validating-artifacts'
        }
      ]);

      const validationIssues = validateNormalizedDesign(normalized);

      pluginChannel.emit(UI, 'pipelineProgress', [
        {
          version: DESIGN_MD_VERSION.V1,
          requestId: payload.requestId,
          phase: DESIGN_MD_PIPELINE_PHASE.GENERATION,
          current: 4,
          total: 5,
          label: 'generating-design-artifacts'
        }
      ]);

      const dtcgJsonContent = mapNormalizedToDtcgJson(normalized);
      const semanticModel = mapSnapshotToSemanticModel(snapshot);
      const markdownContent = generateDesignMd(semanticModel);
      const settings = await loadDesignMdSettings();
      const tailwindV4CssContent = settings.includeTailwindV4
        ? generateTailwindV4ThemeCss(normalized)
        : null;
      const markdownArtifact = {
        fileName: 'DESIGN.md',
        mimeType: 'text/markdown',
        content: markdownContent
      };
      const dtcgJsonArtifact = {
        fileName: 'tokens.json',
        mimeType: 'application/json',
        content: dtcgJsonContent
      };
      const tailwindArtifact =
        tailwindV4CssContent == null
          ? null
          : {
              fileName: 'tailwind.theme.css',
              mimeType: 'text/css',
              content: tailwindV4CssContent
            };
      const zipBase64 = settings.includeZip
        ? createArtifactZipBase64({
            markdown: markdownArtifact,
            dtcgJson: dtcgJsonArtifact,
            tailwindV4Css: tailwindArtifact
          })
        : null;

      const artifactBundle: DesignMdArtifactBundle = {
        version: DESIGN_MD_VERSION.V1,
        markdown: markdownArtifact,
        dtcgJson: dtcgJsonArtifact,
        tailwindV4Css: tailwindArtifact,
        zipBase64,
        issues: [...warnings, ...validationIssues]
      };

      pluginChannel.emit(UI, 'pipelineProgress', [
        {
          version: DESIGN_MD_VERSION.V1,
          requestId: payload.requestId,
          phase: DESIGN_MD_PIPELINE_PHASE.GENERATION,
          current: 5,
          total: 5,
          label: 'artifacts-ready'
        }
      ]);

      pluginChannel.emit(UI, 'extractionReady', [
        {
          version: DESIGN_MD_VERSION.V1,
          requestId: payload.requestId,
          source: snapshot
        }
      ]);

      pluginChannel.emit(UI, 'pipelineCompleted', [
        {
          version: DESIGN_MD_VERSION.V1,
          requestId: payload.requestId,
          artifacts: artifactBundle
        }
      ]);

      return artifactBundle;
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error while extracting current page.';

      pluginChannel.emit(UI, 'pluginError', [
        {
          version: DESIGN_MD_VERSION.V1,
          requestId: payload.requestId,
          message,
          recoverable: true
        }
      ]);

      return null;
    }
  });
}
