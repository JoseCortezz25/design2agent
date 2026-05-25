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

function createIssue(
  id: string,
  message: string,
  path: string,
  hint: string
): DesignMdIssue {
  return {
    id,
    severity: 'warning',
    rule: 'partial-data',
    path,
    message,
    hint
  };
}

function toRgb(color: RGB | RGBA): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
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

function serializeVariableValue(
  value: VariableValue
): DesignMdVariableModeValue {
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

  if (
    value &&
    typeof value === 'object' &&
    'type' in value &&
    value.type === 'VARIABLE_ALIAS'
  ) {
    return {
      kind: 'alias',
      value: {
        type: 'VARIABLE_ALIAS',
        id: value.id
      }
    };
  }

  if (
    value &&
    typeof value === 'object' &&
    'r' in value &&
    'g' in value &&
    'b' in value
  ) {
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

function readBoundVariableId(input: unknown, keys: string[]): string | null {
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
    opacity:
      'opacity' in paint && typeof paint.opacity === 'number'
        ? paint.opacity
        : null,
    boundVariableId
  };
}

function extractEffect(effect: Effect): DesignMdEffectValueSnapshot {
  const base: DesignMdEffectValueSnapshot = {
    type: effect.type,
    radius:
      'radius' in effect && typeof effect.radius === 'number'
        ? effect.radius
        : null,
    spread:
      'spread' in effect && typeof effect.spread === 'number'
        ? effect.spread
        : null,
    offsetX: null,
    offsetY: null,
    color: 'color' in effect ? toRgb(effect.color) : null,
    boundVariableId: readBoundVariableId(effect, [
      'color',
      'radius',
      'spread',
      'offsetX',
      'offsetY'
    ])
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
  const widthValues = new Set<number>();
  const heightValues = new Set<number>();
  const minWidthValues = new Set<number>();
  const maxWidthValues = new Set<number>();
  const minHeightValues = new Set<number>();
  const maxHeightValues = new Set<number>();
  const itemSpacingValues = new Set<number>();
  const strokeWeightValues = new Set<number>();
  const layoutModeCounts = new Map<string, number>();
  const primaryAxisAlignItemsCounts = new Map<string, number>();
  const counterAxisAlignItemsCounts = new Map<string, number>();

  const incrementCount = (target: Map<string, number>, key: string) => {
    target.set(key, (target.get(key) ?? 0) + 1);
  };

  for (const frame of frames) {
    if (frame.width > 0) {
      widthValues.add(Math.round(frame.width));
    }

    if (frame.height > 0) {
      heightValues.add(Math.round(frame.height));
    }

    if (frame.minWidth != null && frame.minWidth > 0) {
      minWidthValues.add(Math.round(frame.minWidth));
    }

    if (frame.maxWidth != null && frame.maxWidth > 0) {
      maxWidthValues.add(Math.round(frame.maxWidth));
    }

    if (frame.minHeight != null && frame.minHeight > 0) {
      minHeightValues.add(Math.round(frame.minHeight));
    }

    if (frame.maxHeight != null && frame.maxHeight > 0) {
      maxHeightValues.add(Math.round(frame.maxHeight));
    }

    if (
      'itemSpacing' in frame &&
      typeof frame.itemSpacing === 'number' &&
      frame.itemSpacing > 0
    ) {
      gapValues.add(frame.itemSpacing);
      itemSpacingValues.add(frame.itemSpacing);
    }

    if (typeof frame.strokeWeight === 'number' && frame.strokeWeight > 0) {
      strokeWeightValues.add(frame.strokeWeight);
    }

    incrementCount(layoutModeCounts, frame.layoutMode);
    incrementCount(primaryAxisAlignItemsCounts, frame.primaryAxisAlignItems);
    incrementCount(counterAxisAlignItemsCounts, frame.counterAxisAlignItems);

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
    cornerRadiusValues: [...cornerRadiusValues].sort(
      (left, right) => left - right
    ),
    widthValues: [...widthValues].sort((left, right) => left - right),
    heightValues: [...heightValues].sort((left, right) => left - right),
    minWidthValues: [...minWidthValues].sort((left, right) => left - right),
    maxWidthValues: [...maxWidthValues].sort((left, right) => left - right),
    minHeightValues: [...minHeightValues].sort((left, right) => left - right),
    maxHeightValues: [...maxHeightValues].sort((left, right) => left - right),
    itemSpacingValues: [...itemSpacingValues].sort(
      (left, right) => left - right
    ),
    strokeWeightValues: [...strokeWeightValues].sort(
      (left, right) => left - right
    ),
    layoutModeCounts: Object.fromEntries(layoutModeCounts),
    primaryAxisAlignItemsCounts: Object.fromEntries(
      primaryAxisAlignItemsCounts
    ),
    counterAxisAlignItemsCounts: Object.fromEntries(counterAxisAlignItemsCounts)
  };
}

function extractLayoutGrid(layoutGrid: LayoutGrid) {
  const boundVariableId = readBoundVariableId(layoutGrid, [
    'sectionSize',
    'gutterSize',
    'offset',
    'count'
  ]);

  return {
    pattern: layoutGrid.pattern,
    sectionSize:
      'sectionSize' in layoutGrid ? (layoutGrid.sectionSize ?? null) : null,
    gutterSize: 'gutterSize' in layoutGrid ? layoutGrid.gutterSize : null,
    count: 'count' in layoutGrid ? layoutGrid.count : null,
    alignment: 'alignment' in layoutGrid ? layoutGrid.alignment : null,
    color:
      'color' in layoutGrid && layoutGrid.color
        ? toRgb(layoutGrid.color)
        : null,
    boundVariableId
  };
}

function getLocalGridStyles() {
  const styles = figma.getLocalGridStyles();

  return styles.map(style => ({
    id: style.id,
    name: style.name,
    layoutGrids: style.layoutGrids.map(extractLayoutGrid)
  }));
}

function serializeComponentPropertyDefinitions(
  input: ComponentNode['componentPropertyDefinitions']
) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      {
        type: value.type,
        defaultValue: value.defaultValue,
        variantOptions: value.variantOptions,
        preferredValues: value.preferredValues?.map(preferredValue => ({
          type: preferredValue.type,
          key: preferredValue.key
        }))
      }
    ])
  );
}

function serializeVariantGroupProperties(
  input: ComponentSetNode['variantGroupProperties']
) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      {
        values: value.values
      }
    ])
  );
}

function extractComponentSnapshot(component: ComponentNode) {
  const normalizeStyleId = (styleId: string | symbol): string =>
    typeof styleId === 'string' ? styleId : '';

  return {
    id: component.id,
    key: component.key,
    name: component.name,
    description: component.description,
    componentSetId:
      component.parent?.type === 'COMPONENT_SET' ? component.parent.id : null,
    componentPropertyDefinitions: serializeComponentPropertyDefinitions(
      component.componentPropertyDefinitions
    ),
    variantProperties: component.variantProperties,
    fillStyleId: normalizeStyleId(component.fillStyleId),
    strokeStyleId: normalizeStyleId(component.strokeStyleId),
    effectStyleId: normalizeStyleId(component.effectStyleId),
    gridStyleId: normalizeStyleId(component.gridStyleId),
    cornerRadius:
      typeof component.cornerRadius === 'number'
        ? component.cornerRadius
        : null,
    cornerRadiusValues:
      typeof component.cornerRadius === 'number' && component.cornerRadius > 0
        ? [component.cornerRadius]
        : [],
    itemSpacing:
      typeof component.itemSpacing === 'number' ? component.itemSpacing : null,
    paddingTop: component.paddingTop,
    paddingRight: component.paddingRight,
    paddingBottom: component.paddingBottom,
    paddingLeft: component.paddingLeft,
    width: component.width,
    height: component.height
  };
}

function extractComponentSetSnapshot(componentSet: ComponentSetNode) {
  const componentIds = componentSet.children
    .filter(child => child.type === 'COMPONENT')
    .map(component => component.id);

  return {
    id: componentSet.id,
    key: componentSet.key,
    name: componentSet.name,
    description: componentSet.description,
    variantGroupProperties: serializeVariantGroupProperties(
      componentSet.variantGroupProperties
    ),
    componentIds
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

async function getLocalVariables(
  warnings: DesignMdIssue[]
): Promise<DesignMdVariableSnapshot[]> {
  const variables = await figma.variables.getLocalVariablesAsync();

  return variables.map(variable => {
    const valuesByMode = Object.fromEntries(
      Object.entries(variable.valuesByMode).map(([modeId, value]) => [
        modeId,
        serializeVariableValue(value)
      ])
    );

    const aliasEntry = Object.values(valuesByMode).find(
      modeValue => modeValue.kind === 'alias'
    );
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
  const localGridStyles = getLocalGridStyles();
  const components = figma.currentPage
    .findAllWithCriteria({ types: ['COMPONENT'] })
    .map(extractComponentSnapshot);
  const componentSets = figma.currentPage
    .findAllWithCriteria({ types: ['COMPONENT_SET'] })
    .map(extractComponentSetSnapshot);

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
      localGridStyles,
      components,
      componentSets,
      frameMetrics: extractFrameMetrics(frames)
    },
    warnings
  };
}
