import {
  DESIGN_MD_ISSUE_SEVERITY,
  DESIGN_MD_TOKEN_CATEGORY,
  type DesignMdIssue,
  type DesignMdNormalizedSnapshot,
  type DesignMdTokenCategory
} from './domain.types';

const SECTION_ORDER: DesignMdTokenCategory[] = [
  DESIGN_MD_TOKEN_CATEGORY.COLOR,
  DESIGN_MD_TOKEN_CATEGORY.TYPOGRAPHY,
  DESIGN_MD_TOKEN_CATEGORY.SPACING,
  DESIGN_MD_TOKEN_CATEGORY.EFFECTS,
  DESIGN_MD_TOKEN_CATEGORY.COMPONENTS
];

function formatTokenLine(token: DesignMdNormalizedSnapshot['tokens'][number]): string {
  const valueLabel = token.aliasOf
    ? `alias → ${token.aliasOf}`
    : token.value === null
      ? 'value: n/a'
      : `value: ${token.value}`;

  return `- \`${token.name}\` · ${valueLabel} · source: \`${token.traceability.sourceId}\``;
}

function getSectionTokens(
  normalized: DesignMdNormalizedSnapshot,
  category: DesignMdTokenCategory
): string[] {
  return normalized.tokens
    .filter(token => token.category === category)
    .map(formatTokenLine);
}

function createSection(
  normalized: DesignMdNormalizedSnapshot,
  category: DesignMdTokenCategory
): string[] {
  const sectionTokens = getSectionTokens(normalized, category);
  const title = `## ${category}`;

  if (sectionTokens.length === 0) {
    return [title, '', '- _No data available from snapshot._', ''];
  }

  return [title, '', ...sectionTokens, ''];
}

function buildValidationSummary(issues: DesignMdIssue[]): string[] {
  const errors = issues.filter(
    issue => issue.severity === DESIGN_MD_ISSUE_SEVERITY.ERROR
  ).length;
  const warnings = issues.filter(
    issue => issue.severity === DESIGN_MD_ISSUE_SEVERITY.WARNING
  ).length;
  const info = issues.filter(
    issue => issue.severity === DESIGN_MD_ISSUE_SEVERITY.INFO
  ).length;

  return [
    '## validation summary',
    '',
    `- errors: ${errors}`,
    `- warnings: ${warnings}`,
    `- info: ${info}`,
    ''
  ];
}

function createScaleSummary(
  normalized: DesignMdNormalizedSnapshot,
  category: DesignMdTokenCategory
): string[] {
  const values = normalized.tokens
    .filter(token => token.category === category && typeof token.value === 'number')
    .map(token => token.value as number)
    .sort((left, right) => left - right);

  if (values.length === 0) {
    return ['- scale: n/a'];
  }

  return [
    `- scale-count: ${values.length}`,
    `- min: ${values[0]}`,
    `- max: ${values[values.length - 1]}`
  ];
}

export function generateDesignMd(
  normalized: DesignMdNormalizedSnapshot,
  issues: DesignMdIssue[]
): string {
  const lines: string[] = [
    '# DESIGN.md',
    '',
    '## overview',
    '',
    `- version: ${normalized.version}`,
    `- page-id: ${normalized.page.id}`,
    `- page-name: ${normalized.page.name}`,
    `- token-count: ${normalized.tokens.length}`,
    `- alias-count: ${normalized.tokens.filter(token => token.aliasOf != null).length}`,
    ''
  ];

  for (const category of SECTION_ORDER) {
    lines.push(...createScaleSummary(normalized, category), '');
    lines.push(...createSection(normalized, category));
  }

  lines.push(...buildValidationSummary(issues));

  return `${lines.join('\n').trimEnd()}\n`;
}
