export const DESIGN_MD_VERSION = {
  V1: '1.0.0'
} as const;

export type DesignMdVersion =
  (typeof DESIGN_MD_VERSION)[keyof typeof DESIGN_MD_VERSION];

export const DESIGN_MD_PIPELINE_PHASE = {
  EXTRACTION: 'extraction',
  NORMALIZATION: 'normalization',
  CLASSIFICATION: 'classification',
  GENERATION: 'generation',
  VALIDATION: 'validation',
  DOWNLOAD: 'download'
} as const;

export type DesignMdPipelinePhase =
  (typeof DESIGN_MD_PIPELINE_PHASE)[keyof typeof DESIGN_MD_PIPELINE_PHASE];

export const DESIGN_MD_ISSUE_SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const;

export type DesignMdIssueSeverity =
  (typeof DESIGN_MD_ISSUE_SEVERITY)[keyof typeof DESIGN_MD_ISSUE_SEVERITY];

export interface DesignMdPageInfo {
  id: string;
  name: string;
}

export interface DesignMdCollectionRef {
  id: string;
  name: string;
}

export interface DesignMdVariableModeSnapshot {
  modeId: string;
  name: string;
}

export interface DesignMdVariableCollectionSnapshot {
  id: string;
  name: string;
  defaultModeId: string;
  modes: DesignMdVariableModeSnapshot[];
}

export type DesignMdPrimitiveValue = string | number | boolean;

export interface DesignMdRgbValue {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface DesignMdVariableAliasValue {
  type: 'VARIABLE_ALIAS';
  id: string;
}

export interface DesignMdVariableModeValue {
  kind: 'primitive' | 'color' | 'alias' | 'unsupported';
  value: DesignMdPrimitiveValue | DesignMdRgbValue | DesignMdVariableAliasValue | null;
}

export interface DesignMdAliasMetadata {
  targetVariableId: string;
}

export interface DesignMdVariableSnapshot {
  id: string;
  name: string;
  resolvedType: string;
  variableCollectionId: string;
  valuesByMode: Record<string, DesignMdVariableModeValue>;
  aliasMetadata: DesignMdAliasMetadata | null;
}

export interface DesignMdPaintValueSnapshot {
  kind: 'solid' | 'image' | 'gradient' | 'video' | 'emoji' | 'unknown';
  color: DesignMdRgbValue | null;
  opacity: number | null;
  boundVariableId: string | null;
}

export interface DesignMdPaintStyleSnapshot {
  id: string;
  name: string;
  paints: DesignMdPaintValueSnapshot[];
}

export interface DesignMdTextStyleSnapshot {
  id: string;
  name: string;
  fontFamily: string;
  fontStyle: string;
  fontSize: number;
  lineHeight: string;
  letterSpacing: string;
  paragraphSpacing: number;
  paragraphIndent: number;
}

export interface DesignMdEffectValueSnapshot {
  type: string;
  radius: number | null;
  spread: number | null;
  offsetX: number | null;
  offsetY: number | null;
  color: DesignMdRgbValue | null;
  boundVariableId: string | null;
}

export interface DesignMdEffectStyleSnapshot {
  id: string;
  name: string;
  effects: DesignMdEffectValueSnapshot[];
}

export interface DesignMdFrameMetricsSnapshot {
  frameCount: number;
  gapValues: number[];
  paddingValues: number[];
  cornerRadiusValues: number[];
}

export interface DesignMdSettings {
  version: DesignMdVersion;
  scope: 'current-page';
  primaryCollectionId: string | null;
  includeComponents: boolean;
  includeTokens: boolean;
  includeTailwindV4: boolean;
  includeWarnings: boolean;
  includeZip: boolean;
  lastPageId: string | null;
}

export interface DesignMdIssue {
  id: string;
  severity: DesignMdIssueSeverity;
  rule: string;
  path: string;
  message: string;
  hint: string | null;
}

export interface DesignMdSourceSnapshot {
  version: DesignMdVersion;
  page: DesignMdPageInfo;
  localVariableCollections: DesignMdVariableCollectionSnapshot[];
  localVariables: DesignMdVariableSnapshot[];
  localPaintStyles: DesignMdPaintStyleSnapshot[];
  localTextStyles: DesignMdTextStyleSnapshot[];
  localEffectStyles: DesignMdEffectStyleSnapshot[];
  frameMetrics: DesignMdFrameMetricsSnapshot;
}

export const DESIGN_MD_TOKEN_CATEGORY = {
  COLOR: 'color',
  TYPOGRAPHY: 'typography',
  SPACING: 'spacing',
  EFFECTS: 'effects',
  COMPONENTS: 'components'
} as const;

export type DesignMdTokenCategory =
  (typeof DESIGN_MD_TOKEN_CATEGORY)[keyof typeof DESIGN_MD_TOKEN_CATEGORY];

export const DESIGN_MD_SOURCE_KIND = {
  VARIABLE_COLLECTION: 'variable-collection',
  PAINT_STYLE: 'paint-style',
  TEXT_STYLE: 'text-style',
  EFFECT_STYLE: 'effect-style',
  FRAME: 'frame'
} as const;

export type DesignMdSourceKind =
  (typeof DESIGN_MD_SOURCE_KIND)[keyof typeof DESIGN_MD_SOURCE_KIND];

export interface DesignMdTraceability {
  sourceKind: DesignMdSourceKind;
  sourceId: string;
  sourceName: string;
}

export interface DesignMdNormalizedToken {
  id: string;
  name: string;
  category: DesignMdTokenCategory;
  tokenType: string;
  value: string | number | null;
  aliasOf: string | null;
  traceability: DesignMdTraceability;
}

export interface DesignMdNormalizedSnapshot {
  version: DesignMdVersion;
  page: DesignMdPageInfo;
  tokens: DesignMdNormalizedToken[];
}

export interface DesignMdArtifact {
  fileName: string;
  mimeType: string;
  content: string;
}

export interface DesignMdArtifactBundle {
  version: DesignMdVersion;
  markdown: DesignMdArtifact | null;
  dtcgJson: DesignMdArtifact | null;
  tailwindV4Css: DesignMdArtifact | null;
  zipBase64: string | null;
  issues: DesignMdIssue[];
}

export interface DesignMdSettingsLoadedPayload {
  version: DesignMdVersion;
  settings: DesignMdSettings;
}

export interface DesignMdSettingsSavedPayload {
  version: DesignMdVersion;
  settings: DesignMdSettings;
}

export interface DesignMdExtractionReadyPayload {
  version: DesignMdVersion;
  requestId: string;
  source: DesignMdSourceSnapshot;
}

export interface DesignMdPluginErrorPayload {
  version: DesignMdVersion;
  requestId: string | null;
  message: string;
  recoverable: boolean;
}

export interface DesignMdPipelineProgressPayload {
  version: DesignMdVersion;
  requestId: string;
  phase: DesignMdPipelinePhase;
  current: number;
  total: number;
  label: string;
}

export interface DesignMdPipelineWarningPayload {
  version: DesignMdVersion;
  requestId: string;
  issue: DesignMdIssue;
}

export interface DesignMdPipelineCompletedPayload {
  version: DesignMdVersion;
  requestId: string;
  artifacts: DesignMdArtifactBundle;
}
