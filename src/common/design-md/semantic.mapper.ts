import type {
  DesignMdSemanticColorToken,
  DesignMdSemanticComponentToken,
  DesignMdSemanticModel,
  DesignMdSemanticRoundedToken,
  DesignMdSemanticSpacingToken,
  DesignMdSemanticTypographyToken,
  DesignMdSourceSnapshot
} from './domain.types';

function toKebabCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createTokenRef(category: 'colors' | 'typography' | 'spacing' | 'rounded', tokenName: string): string {
  return `{${category}.${tokenName}}`;
}

function formatComponentDimensionValue(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value;
}

function toColorHex(color: { r: number; g: number; b: number; a: number }): string {
  const toByte = (channel: number) => Math.round(Math.max(0, Math.min(1, channel)) * 255);
  const hex = (byte: number) => byte.toString(16).padStart(2, '0');
  const base = `#${hex(toByte(color.r))}${hex(toByte(color.g))}${hex(toByte(color.b))}`;

  if (color.a >= 0.999) {
    return base;
  }

  return `${base}${hex(toByte(color.a))}`;
}

function collectColorTokens(snapshot: DesignMdSourceSnapshot): DesignMdSemanticColorToken[] {
  const colorTokens: DesignMdSemanticColorToken[] = [];

  for (const variable of snapshot.localVariables) {
    if (variable.resolvedType !== 'COLOR') {
      continue;
    }

    const collection = snapshot.localVariableCollections.find(
      item => item.id === variable.variableCollectionId
    );
    const modeId = collection?.defaultModeId ?? Object.keys(variable.valuesByMode)[0] ?? '';
    const modeValue = variable.valuesByMode[modeId];

    if (
      modeValue?.kind !== 'color' ||
      modeValue.value == null ||
      typeof modeValue.value !== 'object' ||
      !('r' in modeValue.value)
    ) {
      continue;
    }

    colorTokens.push({
      name: toKebabCase(variable.name),
      value: toColorHex(modeValue.value),
      source: 'variable',
      sourceId: variable.id
    });
  }

  if (colorTokens.length > 0) {
    return colorTokens.sort((left, right) => left.name.localeCompare(right.name));
  }

  for (const style of snapshot.localPaintStyles) {
    const solidPaint = style.paints.find(paint => paint.kind === 'solid' && paint.color != null);

    if (!solidPaint?.color) {
      continue;
    }

    colorTokens.push({
      name: toKebabCase(style.name),
      value: toColorHex(solidPaint.color),
      source: 'paint-style',
      sourceId: style.id
    });
  }

  return colorTokens.sort((left, right) => left.name.localeCompare(right.name));
}

function collectTypographyTokens(
  snapshot: DesignMdSourceSnapshot
): DesignMdSemanticTypographyToken[] {
  return [...snapshot.localTextStyles]
    .map(style => ({
      name: toKebabCase(style.name),
      fontFamily: style.fontFamily,
      fontStyle: style.fontStyle,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      paragraphSpacing: style.paragraphSpacing,
      paragraphIndent: style.paragraphIndent,
      sourceId: style.id
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function collectSpacingTokens(snapshot: DesignMdSourceSnapshot): DesignMdSemanticSpacingToken[] {
  const spacingTokens: DesignMdSemanticSpacingToken[] = [];

  for (const variable of snapshot.localVariables) {
    if (variable.resolvedType !== 'FLOAT') {
      continue;
    }

    const collection = snapshot.localVariableCollections.find(
      item => item.id === variable.variableCollectionId
    );
    const modeId = collection?.defaultModeId ?? Object.keys(variable.valuesByMode)[0] ?? '';
    const modeValue = variable.valuesByMode[modeId];

    if (modeValue?.kind !== 'primitive' || typeof modeValue.value !== 'number') {
      continue;
    }

    const lowerName = variable.name.toLowerCase();

    if (
      lowerName.includes('radius') ||
      lowerName.includes('corner') ||
      lowerName.includes('round')
    ) {
      continue;
    }

    spacingTokens.push({
      name: toKebabCase(variable.name),
      value: modeValue.value,
      source: 'variable',
      sourceId: variable.id
    });
  }

  for (const value of snapshot.frameMetrics.gapValues) {
    spacingTokens.push({
      name: `layout-gap-${value}`,
      value,
      source: 'frame-metric',
      sourceId: `frame-gap-${value}`
    });
  }

  for (const value of snapshot.frameMetrics.paddingValues) {
    spacingTokens.push({
      name: `layout-padding-${value}`,
      value,
      source: 'frame-metric',
      sourceId: `frame-padding-${value}`
    });
  }

  for (const style of snapshot.localGridStyles) {
    for (const grid of style.layoutGrids) {
      if (typeof grid.gutterSize === 'number' && grid.gutterSize > 0) {
        spacingTokens.push({
          name: `grid-${toKebabCase(style.name)}-gutter`,
          value: grid.gutterSize,
          source: 'grid-style',
          sourceId: style.id
        });
      }

      if (typeof grid.sectionSize === 'number' && grid.sectionSize > 0) {
        spacingTokens.push({
          name: `grid-${toKebabCase(style.name)}-section`,
          value: grid.sectionSize,
          source: 'grid-style',
          sourceId: style.id
        });
      }
    }
  }

  return spacingTokens.sort((left, right) => left.name.localeCompare(right.name));
}

function collectRoundedTokens(snapshot: DesignMdSourceSnapshot): DesignMdSemanticRoundedToken[] {
  const roundedTokens: DesignMdSemanticRoundedToken[] = [];

  for (const variable of snapshot.localVariables) {
    if (variable.resolvedType !== 'FLOAT') {
      continue;
    }

    const lowerName = variable.name.toLowerCase();

    if (
      !lowerName.includes('radius') &&
      !lowerName.includes('corner') &&
      !lowerName.includes('round')
    ) {
      continue;
    }

    const collection = snapshot.localVariableCollections.find(
      item => item.id === variable.variableCollectionId
    );
    const modeId = collection?.defaultModeId ?? Object.keys(variable.valuesByMode)[0] ?? '';
    const modeValue = variable.valuesByMode[modeId];

    if (modeValue?.kind !== 'primitive' || typeof modeValue.value !== 'number') {
      continue;
    }

    roundedTokens.push({
      name: toKebabCase(variable.name),
      value: modeValue.value,
      source: 'variable',
      sourceId: variable.id
    });
  }

  for (const value of snapshot.frameMetrics.cornerRadiusValues) {
    roundedTokens.push({
      name: `frame-${value}`,
      value,
      source: 'frame-metric',
      sourceId: `frame-radius-${value}`
    });
  }

  for (const component of snapshot.components) {
    if (component.cornerRadius != null && component.cornerRadius > 0) {
      roundedTokens.push({
        name: `component-${toKebabCase(component.name)}`,
        value: component.cornerRadius,
        source: 'component',
        sourceId: component.id
      });
    }
  }

  return roundedTokens.sort((left, right) => left.name.localeCompare(right.name));
}

function findClosestTokenRef(
  value: number,
  tokens: DesignMdSemanticSpacingToken[] | DesignMdSemanticRoundedToken[],
  tokenCategory: 'spacing' | 'rounded'
): string | number {
  const exactToken = tokens.find(token => token.value === value);
  return exactToken ? createTokenRef(tokenCategory, exactToken.name) : value;
}

function collectComponentTokens(
  snapshot: DesignMdSourceSnapshot,
  colors: DesignMdSemanticColorToken[],
  typography: DesignMdSemanticTypographyToken[],
  spacing: DesignMdSemanticSpacingToken[],
  rounded: DesignMdSemanticRoundedToken[]
): DesignMdSemanticComponentToken[] {
  const colorBySourceId = new Map(colors.map(token => [token.sourceId, token]));
  const typographyPrimary = typography[0];

  return snapshot.components
    .map(component => {
      const tokens: Record<string, string | number> = {};
      const styleName = toKebabCase(component.name);

      if (component.fillStyleId.length > 0) {
        const colorToken = colorBySourceId.get(component.fillStyleId);
        tokens.backgroundColor = colorToken
          ? createTokenRef('colors', colorToken.name)
          : component.fillStyleId;
      }

      if (component.strokeStyleId.length > 0) {
        const colorToken = colorBySourceId.get(component.strokeStyleId);
        if (colorToken) {
          tokens.textColor = createTokenRef('colors', colorToken.name);
        }
      }

      if (component.cornerRadius != null && component.cornerRadius > 0) {
        tokens.rounded = findClosestTokenRef(component.cornerRadius, rounded, 'rounded');
      }

      if (component.width > 0) {
        tokens.width = component.width;
      }

      if (component.height > 0) {
        tokens.height = component.height;
      }

      if (component.itemSpacing != null && component.itemSpacing > 0) {
        tokens.size = findClosestTokenRef(component.itemSpacing, spacing, 'spacing');
      }

      const hasTopPadding = component.paddingTop > 0;
      const hasRightPadding = component.paddingRight > 0;
      const hasBottomPadding = component.paddingBottom > 0;
      const hasLeftPadding = component.paddingLeft > 0;
      const hasAnyPadding = hasTopPadding || hasRightPadding || hasBottomPadding || hasLeftPadding;
      const hasUniformPadding =
        component.paddingTop === component.paddingRight &&
        component.paddingRight === component.paddingBottom &&
        component.paddingBottom === component.paddingLeft &&
        hasAnyPadding;

      if (hasUniformPadding) {
        tokens.padding = findClosestTokenRef(component.paddingTop, spacing, 'spacing');
      } else if (hasAnyPadding) {
        const top = findClosestTokenRef(component.paddingTop, spacing, 'spacing');
        const right = findClosestTokenRef(component.paddingRight, spacing, 'spacing');
        const bottom = findClosestTokenRef(component.paddingBottom, spacing, 'spacing');
        const left = findClosestTokenRef(component.paddingLeft, spacing, 'spacing');
        tokens.padding = `${formatComponentDimensionValue(top)} ${formatComponentDimensionValue(right)} ${formatComponentDimensionValue(bottom)} ${formatComponentDimensionValue(left)}`;
      }

      if (typographyPrimary) {
        tokens.typography = createTokenRef('typography', typographyPrimary.name);
      }

      const properties = Object.entries(component.componentPropertyDefinitions).map(
        ([propertyName, propertyValue]) => `${propertyName}:${propertyValue.type}`
      );
      const variants = Object.entries(component.variantProperties ?? {}).map(
        ([variantName, variantValue]) => `${variantName}=${variantValue}`
      );

      return {
        name: styleName,
        description: component.description || undefined,
        variants,
        properties,
        tokens,
        sourceId: component.id
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function createSections(model: Omit<DesignMdSemanticModel, 'sections'>) {
  return {
    overview: [
      `${model.name} exposes ${model.colors.length} color tokens, ${model.typography.length} typography styles, and ${model.components.length} component definitions.`,
      `The source snapshot includes ${model.spacing.length} spacing signals and ${model.rounded.length} radius signals derived from variables, layout, and components.`
    ],
    colors: [
      'Color tokens prioritize local COLOR variables and fallback to paint styles when variables are unavailable.',
      `Detected palette size: ${model.colors.length}.`
    ],
    typography: [
      `Typography is based on ${model.typography.length} local text styles with explicit font, size, and line-height metadata.`
    ],
    layout: [
      `Layout guidance is inferred from frame metrics and ${model.spacing.filter(token => token.source === 'grid-style').length} grid-derived spacing values.`
    ],
    elevationAndDepth: [
      'Elevation and depth cues are extracted from local effect styles and preserved in DTCG output.',
      'When effect styles are missing, this section remains intentionally conservative.'
    ],
    shapes: [
      `Rounded primitives include ${model.rounded.length} radius values from variables, frames, and component geometry.`
    ],
    components: [
      `Component synthesis covers ${model.components.length} components with variants, component properties, and token references.`
    ],
    dosAndDonts: [
      'Do reuse token references in components instead of hardcoded numeric values.',
      'Do keep color definitions in variables as the primary source of truth.',
      "Don't define duplicate spacing scales with semantically equivalent names.",
      "Don't override component radius and spacing ad-hoc when equivalent tokens already exist."
    ]
  };
}

export function mapSnapshotToSemanticModel(snapshot: DesignMdSourceSnapshot): DesignMdSemanticModel {
  const colors = collectColorTokens(snapshot);
  const typography = collectTypographyTokens(snapshot);
  const spacing = collectSpacingTokens(snapshot);
  const rounded = collectRoundedTokens(snapshot);
  const components = collectComponentTokens(snapshot, colors, typography, spacing, rounded);
  const partialModel = {
    version: snapshot.version,
    name: snapshot.page.name,
    description: '',
    colors,
    typography,
    spacing,
    rounded,
    components
  };

  return {
    ...partialModel,
    sections: createSections(partialModel)
  };
}
