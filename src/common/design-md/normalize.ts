import {
  DESIGN_MD_SOURCE_KIND,
  DESIGN_MD_TOKEN_CATEGORY,
  type DesignMdNormalizedSnapshot,
  type DesignMdNormalizedToken,
  type DesignMdSourceSnapshot,
  type DesignMdVariableModeValue
} from './domain.types';

function toKebabCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeColorHex(color: { r: number; g: number; b: number; a: number }): string {
  const toByte = (channel: number) => Math.round(Math.max(0, Math.min(1, channel)) * 255);
  const hex = (byte: number) => byte.toString(16).padStart(2, '0');
  const base = `#${hex(toByte(color.r))}${hex(toByte(color.g))}${hex(toByte(color.b))}`;

  if (color.a >= 0.999) {
    return base;
  }

  return `${base}${hex(toByte(color.a))}`;
}

function variableModeToValue(modeValue: DesignMdVariableModeValue): string | number | null {
  if (modeValue.kind === 'primitive') {
    if (typeof modeValue.value === 'boolean') {
      return modeValue.value ? 1 : 0;
    }
    return typeof modeValue.value === 'string' || typeof modeValue.value === 'number'
      ? modeValue.value
      : null;
  }

  if (modeValue.kind === 'color' && modeValue.value && typeof modeValue.value === 'object') {
    if ('r' in modeValue.value) {
      return normalizeColorHex(modeValue.value);
    }

    return null;
  }

  return null;
}

function inferVariableCategory(resolvedType: string): {
  category: DesignMdNormalizedToken['category'];
  tokenType: string;
} {
  if (resolvedType === 'COLOR') {
    return { category: DESIGN_MD_TOKEN_CATEGORY.COLOR, tokenType: 'color' };
  }

  if (resolvedType === 'FLOAT') {
    return { category: DESIGN_MD_TOKEN_CATEGORY.SPACING, tokenType: 'dimension' };
  }

  if (resolvedType === 'STRING') {
    return { category: DESIGN_MD_TOKEN_CATEGORY.COMPONENTS, tokenType: 'string' };
  }

  if (resolvedType === 'BOOLEAN') {
    return { category: DESIGN_MD_TOKEN_CATEGORY.COMPONENTS, tokenType: 'boolean' };
  }

  return { category: DESIGN_MD_TOKEN_CATEGORY.COMPONENTS, tokenType: 'other' };
}

function mapVariableTokens(snapshot: DesignMdSourceSnapshot): DesignMdNormalizedToken[] {
  const tokens: DesignMdNormalizedToken[] = [];
  const sortedVariables = [...snapshot.localVariables].sort((left, right) =>
    left.name.localeCompare(right.name)
  );

  for (const variable of sortedVariables) {
    const collection = snapshot.localVariableCollections.find(
      item => item.id === variable.variableCollectionId
    );
    const fallbackModeId = collection?.defaultModeId ?? Object.keys(variable.valuesByMode)[0] ?? '';
    const modeValue = variable.valuesByMode[fallbackModeId];
    const aliasMode = Object.values(variable.valuesByMode).find(item => item.kind === 'alias');
    const inferred = inferVariableCategory(variable.resolvedType);
    const name = `variables.${toKebabCase(variable.name)}`;

    tokens.push({
      id: `variable:${variable.id}`,
      name,
      category: inferred.category,
      tokenType: inferred.tokenType,
      value: modeValue ? variableModeToValue(modeValue) : null,
      aliasOf:
        aliasMode?.kind === 'alias' &&
        aliasMode.value &&
        typeof aliasMode.value === 'object' &&
        'id' in aliasMode.value
          ? `variable:${aliasMode.value.id}`
          : null,
      traceability: {
        sourceKind: DESIGN_MD_SOURCE_KIND.VARIABLE_COLLECTION,
        sourceId: variable.id,
        sourceName: variable.name
      }
    });
  }

  return tokens;
}

function mapPaintStyleTokens(snapshot: DesignMdSourceSnapshot): DesignMdNormalizedToken[] {
  return [...snapshot.localPaintStyles]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(style => {
      const firstSolid = style.paints.find(paint => paint.kind === 'solid' && paint.color != null);

      return {
        id: `paint-style:${style.id}`,
        name: `paint.${toKebabCase(style.name)}`,
        category: DESIGN_MD_TOKEN_CATEGORY.COLOR,
        tokenType: 'color',
        value: firstSolid?.color ? normalizeColorHex(firstSolid.color) : null,
        aliasOf: firstSolid?.boundVariableId ? `variable:${firstSolid.boundVariableId}` : null,
        traceability: {
          sourceKind: DESIGN_MD_SOURCE_KIND.PAINT_STYLE,
          sourceId: style.id,
          sourceName: style.name
        }
      } satisfies DesignMdNormalizedToken;
    });
}

function mapTextStyleTokens(snapshot: DesignMdSourceSnapshot): DesignMdNormalizedToken[] {
  return [...snapshot.localTextStyles]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(style => ({
      id: `text-style:${style.id}`,
      name: `text.${toKebabCase(style.name)}`,
      category: DESIGN_MD_TOKEN_CATEGORY.TYPOGRAPHY,
      tokenType: 'typography',
      value: JSON.stringify({
        fontFamily: style.fontFamily,
        fontStyle: style.fontStyle,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        paragraphSpacing: style.paragraphSpacing,
        paragraphIndent: style.paragraphIndent
      }),
      aliasOf: null,
      traceability: {
        sourceKind: DESIGN_MD_SOURCE_KIND.TEXT_STYLE,
        sourceId: style.id,
        sourceName: style.name
      }
    }));
}

function mapEffectStyleTokens(snapshot: DesignMdSourceSnapshot): DesignMdNormalizedToken[] {
  return [...snapshot.localEffectStyles]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(style => ({
      id: `effect-style:${style.id}`,
      name: `effect.${toKebabCase(style.name)}`,
      category: DESIGN_MD_TOKEN_CATEGORY.EFFECTS,
      tokenType: 'shadow',
      value: JSON.stringify(style.effects),
      aliasOf: style.effects[0]?.boundVariableId ? `variable:${style.effects[0].boundVariableId}` : null,
      traceability: {
        sourceKind: DESIGN_MD_SOURCE_KIND.EFFECT_STYLE,
        sourceId: style.id,
        sourceName: style.name
      }
    }));
}

function mapFrameMetricTokens(snapshot: DesignMdSourceSnapshot): DesignMdNormalizedToken[] {
  const tokens: DesignMdNormalizedToken[] = [];

  for (const gap of snapshot.frameMetrics.gapValues) {
    tokens.push({
      id: `frame-gap:${gap}`,
      name: `spacing.gap-${gap}`,
      category: DESIGN_MD_TOKEN_CATEGORY.SPACING,
      tokenType: 'dimension',
      value: gap,
      aliasOf: null,
      traceability: {
        sourceKind: DESIGN_MD_SOURCE_KIND.FRAME,
        sourceId: `gap-${gap}`,
        sourceName: 'frame-gap'
      }
    });
  }

  for (const padding of snapshot.frameMetrics.paddingValues) {
    tokens.push({
      id: `frame-padding:${padding}`,
      name: `spacing.padding-${padding}`,
      category: DESIGN_MD_TOKEN_CATEGORY.SPACING,
      tokenType: 'dimension',
      value: padding,
      aliasOf: null,
      traceability: {
        sourceKind: DESIGN_MD_SOURCE_KIND.FRAME,
        sourceId: `padding-${padding}`,
        sourceName: 'frame-padding'
      }
    });
  }

  for (const radius of snapshot.frameMetrics.cornerRadiusValues) {
    tokens.push({
      id: `frame-radius:${radius}`,
      name: `radius.corner-${radius}`,
      category: DESIGN_MD_TOKEN_CATEGORY.COMPONENTS,
      tokenType: 'dimension',
      value: radius,
      aliasOf: null,
      traceability: {
        sourceKind: DESIGN_MD_SOURCE_KIND.FRAME,
        sourceId: `radius-${radius}`,
        sourceName: 'frame-radius'
      }
    });
  }

  return tokens;
}

function sortByNameAndId(left: DesignMdNormalizedToken, right: DesignMdNormalizedToken): number {
  if (left.name === right.name) {
    return left.id.localeCompare(right.id);
  }

  return left.name.localeCompare(right.name);
}

export function normalizeDesignSnapshot(snapshot: DesignMdSourceSnapshot): DesignMdNormalizedSnapshot {
  return {
    version: snapshot.version,
    page: {
      id: snapshot.page.id,
      name: snapshot.page.name
    },
    tokens: [
      ...mapVariableTokens(snapshot),
      ...mapPaintStyleTokens(snapshot),
      ...mapTextStyleTokens(snapshot),
      ...mapEffectStyleTokens(snapshot),
      ...mapFrameMetricTokens(snapshot)
    ].sort(sortByNameAndId)
  };
}
