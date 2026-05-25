import type { DesignMdSemanticModel } from './domain.types';

function escapeYamlString(value: string): string {
  return value.replace(/"/g, '\\"');
}

function formatPixelValue(value: number): string {
  return `${value}px`;
}

function formatTokenValue(key: string, value: string | number): string {
  if (typeof value === 'string') {
    return `"${escapeYamlString(value)}"`;
  }

  if (
    key === 'padding' ||
    key === 'size' ||
    key === 'height' ||
    key === 'width' ||
    key === 'rounded'
  ) {
    return `"${formatPixelValue(value)}"`;
  }

  return `${value}`;
}

function pushSection(lines: string[], title: string, prose: string[]) {
  lines.push(`## ${title}`, '');
  for (const paragraph of prose) {
    lines.push(paragraph, '');
  }
}

function pushTokenList(lines: string[], entries: string[]) {
  if (entries.length === 0) {
    lines.push('- _No data available from snapshot._', '');
    return;
  }

  lines.push(...entries, '');
}

export function generateDesignMd(model: DesignMdSemanticModel): string {
  const frontMatter = [
    '---',
    `version: "${model.version}"`,
    `name: "${escapeYamlString(model.name)}"`,
    `description: "${escapeYamlString(model.description ?? '')}"`,
    'colors:',
    ...model.colors.map(token => `  ${token.name}: "${token.value}"`),
    'typography:',
    ...model.typography.flatMap(token => [
      `  ${token.name}:`,
      `    fontFamily: "${escapeYamlString(token.fontFamily)}"`,
      `    fontStyle: "${escapeYamlString(token.fontStyle)}"`,
      `    fontSize: "${formatPixelValue(token.fontSize)}"`,
      `    lineHeight: "${escapeYamlString(token.lineHeight)}"`,
      `    letterSpacing: "${escapeYamlString(token.letterSpacing)}"`,
      `    paragraphSpacing: "${formatPixelValue(token.paragraphSpacing)}"`,
      `    paragraphIndent: "${formatPixelValue(token.paragraphIndent)}"`
    ]),
    'spacing:',
    ...model.spacing.map(token => `  ${token.name}: "${formatPixelValue(token.value)}"`),
    'rounded:',
    ...model.rounded.map(token => `  ${token.name}: "${formatPixelValue(token.value)}"`),
    'components:',
    ...model.components.flatMap(token => [
      `  ${token.name}:`,
      ...Object.entries(token.tokens).map(([key, value]) =>
        `    ${key}: ${formatTokenValue(key, value)}`
      )
    ]),
    '---',
    ''
  ];

  const lines: string[] = [...frontMatter];

  pushSection(lines, 'Overview', model.sections.overview);
  pushSection(lines, 'Colors', model.sections.colors);
  pushTokenList(
    lines,
    model.colors.map(token => `- \`${token.name}\`: ${token.value}`)
  );

  pushSection(lines, 'Typography', model.sections.typography);
  pushTokenList(
    lines,
    model.typography.map(
      token =>
        `- \`${token.name}\`: ${token.fontFamily} ${token.fontStyle}, ${token.fontSize}px / ${token.lineHeight}`
    )
  );

  pushSection(lines, 'Layout', model.sections.layout);
  pushTokenList(lines, model.spacing.map(token => `- \`${token.name}\`: ${token.value}px`));

  pushSection(lines, 'Elevation & Depth', model.sections.elevationAndDepth);

  pushSection(lines, 'Shapes', model.sections.shapes);
  pushTokenList(lines, model.rounded.map(token => `- \`${token.name}\`: ${token.value}px`));

  pushSection(lines, 'Components', model.sections.components);
  pushTokenList(
    lines,
    model.components.map(token => {
      const tokenSummary = Object.entries(token.tokens)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ');
      return `- \`${token.name}\`${token.variants.length > 0 ? ` (${token.variants.join(', ')})` : ''}: ${tokenSummary || 'no tokenized properties'}`;
    })
  );

  pushSection(lines, "Do's and Don'ts", model.sections.dosAndDonts);
  pushTokenList(lines, model.sections.dosAndDonts.map(item => `- ${item}`));

  return `${lines.join('\n').trimEnd()}\n`;
}
