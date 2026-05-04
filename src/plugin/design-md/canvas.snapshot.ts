import {
  DESIGN_MD_VERSION,
  type DesignMdEffectValueSnapshot,
  type DesignMdIssue,
  type DesignMdPaintValueSnapshot,
  type DesignMdSourceSnapshot,
  type DesignMdVariableModeValue,
  type DesignMdVariableSnapshot
} from '@common/design-md/domain.types';

export interface DesignMdSnapshotResult {
  snapshot: DesignMdSourceSnapshot;
  warnings: DesignMdIssue[];
}

function createIssue(id: string, message: string, path: string, hint: string): DesignMdIssue {
  return {
    id,
    severity: 'warning',
    rule: 'partial-data',
    path,
    message,
    hint
  };
}

function toRgb(color: RGB | RGBA): { r: number; g: number; b: number; a: number } {
  return {
    r: color.r,
    g: color.g,
    b: color.b,
    a: 'a' in color ? color.a : 1
  };
}

function toLineHeightValue(value: LineHeight): string {
  if (value.unit === 'AUTO') {
    return 'auto';
  }

  return `${value.value}${value.unit}`;
}

function toLetterSpacingValue(value: LetterSpacing): string {
  if (value.unit === 'PERCENT') {
    return `${value.value}%`;
  }

  return `${value.value}px`;
}

function serializeVariableValue(value: VariableValue): DesignMdVariableModeValue {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return {
      kind: 'primitive',
      value
    };
  }

  if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    return {
      kind: 'alias',
      value: {
        type: 'VARIABLE_ALIAS',
        id: value.id
      }
    };
  }

  if (value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
    return {
      kind: 'color',
      value: toRgb(value)
    };
  }

  return {
    kind: 'unsupported',
    value: null
  };
}

function readBoundVariableId(
  input: unknown,
  keys: string[]
): string | null {
  if (!input || typeof input !== 'object' || !('boundVariables' in input)) {
    return null;
  }

  const withBoundVariables = input as {
    boundVariables?: Record<string, { id?: string } | undefined>;
  };

  for (const key of keys) {
    const candidateId = withBoundVariables.boundVariables?.[key]?.id;

    if (typeof candidateId === 'string' && candidateId.length > 0) {
      return candidateId;
    }
  }

  return null;
}

function extractPaint(paint: Paint): DesignMdPaintValueSnapshot {
  const boundVariableId = readBoundVariableId(paint, ['color', 'opacity']);

  if (paint.type === 'SOLID') {
    return {
      kind: 'solid',
      color: toRgb(paint.color),
      opacity: paint.opacity ?? 1,
      boundVariableId
    };
  }

  return {
    kind: paint.type.toLowerCase() as DesignMdPaintValueSnapshot['kind'],
    color: null,
    opacity: 'opacity' in paint && typeof paint.opacity === 'number' ? paint.opacity : null,
    boundVariableId
  };
}

function extractEffect(effect: Effect): DesignMdEffectValueSnapshot {
  const base: DesignMdEffectValueSnapshot = {
    type: effect.type,
    radius: 'radius' in effect && typeof effect.radius === 'number' ? effect.radius : null,
    spread: 'spread' in effect && typeof effect.spread === 'number' ? effect.spread : null,
    offsetX: null,
    offsetY: null,
    color: 'color' in effect ? toRgb(effect.color) : null,
    boundVariableId: readBoundVariableId(effect, ['color', 'radius', 'spread', 'offsetX', 'offsetY'])
  };

  if ('offset' in effect) {
    base.offsetX = effect.offset.x;
    base.offsetY = effect.offset.y;
  }

  return base;
}

function extractFrameMetrics(frames: FrameNode[]) {
  const gapValues = new Set<number>();
  const paddingValues = new Set<number>();
  const cornerRadiusValues = new Set<number>();

  for (const frame of frames) {
    if ('itemSpacing' in frame && typeof frame.itemSpacing === 'number' && frame.itemSpacing > 0) {
      gapValues.add(frame.itemSpacing);
    }

    const paddings = [
      frame.paddingTop,
      frame.paddingRight,
      frame.paddingBottom,
      frame.paddingLeft
    ];

    for (const padding of paddings) {
      if (padding > 0) {
        paddingValues.add(padding);
      }
    }

    if (typeof frame.cornerRadius === 'number' && frame.cornerRadius > 0) {
      cornerRadiusValues.add(frame.cornerRadius);
    }
  }

  return {
    frameCount: frames.length,
    gapValues: [...gapValues].sort((left, right) => left - right),
    paddingValues: [...paddingValues].sort((left, right) => left - right),
    cornerRadiusValues: [...cornerRadiusValues].sort((left, right) => left - right)
  };
}

async function getLocalVariableCollections() {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();

  return collections.map(collection => ({
    id: collection.id,
    name: collection.name,
    defaultModeId: collection.defaultModeId,
    modes: collection.modes.map(mode => ({
      modeId: mode.modeId,
      name: mode.name
    }))
  }));
}

async function getLocalVariables(warnings: DesignMdIssue[]): Promise<DesignMdVariableSnapshot[]> {
  const variables = await figma.variables.getLocalVariablesAsync();

  return variables.map(variable => {
    const valuesByMode = Object.fromEntries(
      Object.entries(variable.valuesByMode).map(([modeId, value]) => [modeId, serializeVariableValue(value)])
    );

    const aliasEntry = Object.values(valuesByMode).find(modeValue => modeValue.kind === 'alias');
    const aliasMetadata =
      aliasEntry?.kind === 'alias' &&
      aliasEntry.value &&
      typeof aliasEntry.value === 'object' &&
      'id' in aliasEntry.value
        ? { targetVariableId: aliasEntry.value.id }
        : null;

    if (Object.keys(valuesByMode).length === 0) {
      warnings.push(
        createIssue(
          `extract/variable-missing-values/${variable.id}`,
          `Variable "${variable.name}" has no mode values.`,
          `source.localVariables.${variable.id}.valuesByMode`,
          'Define at least one value in collection modes for this variable.'
        )
      );
    }

    return {
      id: variable.id,
      name: variable.name,
      resolvedType: variable.resolvedType,
      variableCollectionId: variable.variableCollectionId,
      valuesByMode,
      aliasMetadata
    };
  });
}

async function getLocalPaintStyles(warnings: DesignMdIssue[]) {
  const styles = figma.getLocalPaintStyles();

  return styles.map(style => {
    if (style.paints.length === 0) {
      warnings.push(
        createIssue(
          `extract/paint-style-empty/${style.id}`,
          `Paint style "${style.name}" has no paints.`,
          `source.localPaintStyles.${style.id}.paints`,
          'Add at least one solid paint to this style.'
        )
      );
    }

    return {
      id: style.id,
      name: style.name,
      paints: style.paints.map(extractPaint)
    };
  });
}

function getLocalTextStyles() {
  const styles = figma.getLocalTextStyles();

  return styles.map(style => ({
    id: style.id,
    name: style.name,
    fontFamily: style.fontName.family,
    fontStyle: style.fontName.style,
    fontSize: style.fontSize,
    lineHeight: toLineHeightValue(style.lineHeight),
    letterSpacing: toLetterSpacingValue(style.letterSpacing),
    paragraphSpacing: style.paragraphSpacing,
    paragraphIndent: style.paragraphIndent
  }));
}

function getLocalEffectStyles() {
  const styles = figma.getLocalEffectStyles();

  return styles.map(style => ({
    id: style.id,
    name: style.name,
    effects: style.effects.map(extractEffect)
  }));
}

export async function createCurrentPageSnapshot(): Promise<DesignMdSnapshotResult> {
  const warnings: DesignMdIssue[] = [];
  const frames = figma.currentPage.findAllWithCriteria({ types: ['FRAME'] });
  const localVariableCollections = await getLocalVariableCollections();
  const localVariables = await getLocalVariables(warnings);
  const localPaintStyles = await getLocalPaintStyles(warnings);
  const localTextStyles = getLocalTextStyles();
  const localEffectStyles = getLocalEffectStyles();

  if (localVariableCollections.length === 0) {
    warnings.push(
      createIssue(
        'extract/variables-empty',
        'No local variable collections were found.',
        'source.localVariableCollections',
        'Create at least one local collection or continue with local styles only.'
      )
    );
  }

  if (localVariables.length === 0) {
    warnings.push(
      createIssue(
        'extract/local-variables-empty',
        'No local variables were found.',
        'source.localVariables',
        'Create variables to export mode-aware tokens and aliases.'
      )
    );
  }

  if (localPaintStyles.length === 0) {
    warnings.push(
      createIssue(
        'extract/paint-styles-empty',
        'No local paint styles were found.',
        'source.localPaintStyles',
        'Define paint styles or rely on color variables for color extraction.'
      )
    );
  }

  if (localTextStyles.length === 0) {
    warnings.push(
      createIssue(
        'extract/text-styles-empty',
        'No local text styles were found.',
        'source.localTextStyles',
        'Define text styles to improve typography coverage.'
      )
    );
  }

  if (localEffectStyles.length === 0) {
    warnings.push(
      createIssue(
        'extract/effect-styles-empty',
        'No local effect styles were found.',
        'source.localEffectStyles',
        'Define effect styles to include shadows and blurs in extraction.'
      )
    );
  }

  if (frames.length === 0) {
    warnings.push(
      createIssue(
        'extract/frames-empty',
        'No frames were found in the current page.',
        'source.frameMetrics.frameCount',
        'Add frame layers if spacing fallback should use frame analysis.'
      )
    );
  }

  return {
    snapshot: {
      version: DESIGN_MD_VERSION.V1,
      page: {
        id: figma.currentPage.id,
        name: figma.currentPage.name
      },
      localVariableCollections,
      localVariables,
      localPaintStyles,
      localTextStyles,
      localEffectStyles,
      frameMetrics: extractFrameMetrics(frames)
    },
    warnings
  };
}
