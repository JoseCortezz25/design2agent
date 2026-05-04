import {
  DESIGN_MD_ISSUE_SEVERITY,
  DESIGN_MD_TOKEN_CATEGORY,
  type DesignMdIssue,
  type DesignMdNormalizedSnapshot
} from './domain.types';

function createIssue(params: {
  id: string;
  severity: DesignMdIssue['severity'];
  rule: string;
  path: string;
  message: string;
  hint: string;
}): DesignMdIssue {
  return {
    id: params.id,
    severity: params.severity,
    rule: params.rule,
    path: params.path,
    message: params.message,
    hint: params.hint
  };
}

function pushEmptyGroupIssues(snapshot: DesignMdNormalizedSnapshot, issues: DesignMdIssue[]) {
  for (const category of Object.values(DESIGN_MD_TOKEN_CATEGORY)) {
    const hasTokens = snapshot.tokens.some(token => token.category === category);

    if (!hasTokens) {
      issues.push(
        createIssue({
          id: `validate/empty-group/${category}`,
          severity: DESIGN_MD_ISSUE_SEVERITY.WARNING,
          rule: 'empty-group',
          path: `tokens.${category}`,
          message: `Group "${category}" has no tokens with real data.`,
          hint: 'Create local styles/variables in this category or disable this category from output.'
        })
      );
    }
  }
}

function pushAliasIntegrityIssues(snapshot: DesignMdNormalizedSnapshot, issues: DesignMdIssue[]) {
  const tokenNameById = new Map(snapshot.tokens.map(token => [token.id, token.name]));

  for (const token of snapshot.tokens) {
    if (token.aliasOf != null && !tokenNameById.has(token.aliasOf)) {
      issues.push(
        createIssue({
          id: `validate/broken-alias/${token.id}`,
          severity: DESIGN_MD_ISSUE_SEVERITY.ERROR,
          rule: 'broken-alias',
          path: `tokens.${token.name}.aliasOf`,
          message: `Alias target "${token.aliasOf}" does not exist in normalized tokens.`,
          hint: 'Ensure aliased variables are local and included in extraction.'
        })
      );
    }
  }
}

function pushMissingValueIssues(snapshot: DesignMdNormalizedSnapshot, issues: DesignMdIssue[]) {
  for (const token of snapshot.tokens) {
    const hasValue = typeof token.value === 'number' || (typeof token.value === 'string' && token.value.length > 0);

    if (!hasValue && token.aliasOf == null) {
      issues.push(
        createIssue({
          id: `validate/missing-value/${token.id}`,
          severity: DESIGN_MD_ISSUE_SEVERITY.WARNING,
          rule: 'missing-token-value',
          path: `tokens.${token.name}.value`,
          message: 'Token has no concrete value and no resolvable alias.',
          hint: 'Set a concrete value in Figma (style or variable mode) or bind it to a local variable alias.'
        })
      );
    }
  }
}

function pushCoreCoverageIssues(snapshot: DesignMdNormalizedSnapshot, issues: DesignMdIssue[]) {
  const hasColorValue = snapshot.tokens.some(
    token =>
      token.category === DESIGN_MD_TOKEN_CATEGORY.COLOR &&
      (typeof token.value === 'string' || token.aliasOf != null)
  );
  const hasTypographyValue = snapshot.tokens.some(
    token =>
      token.category === DESIGN_MD_TOKEN_CATEGORY.TYPOGRAPHY &&
      (typeof token.value === 'string' || token.aliasOf != null)
  );

  if (!hasColorValue) {
    issues.push(
      createIssue({
        id: 'validate/missing-color-values',
        severity: DESIGN_MD_ISSUE_SEVERITY.ERROR,
        rule: 'missing-color-values',
        path: 'tokens.color',
        message: 'No exportable color values were found.',
        hint: 'Define solid paint styles or COLOR variables with values in default mode.'
      })
    );
  }

  if (!hasTypographyValue) {
    issues.push(
      createIssue({
        id: 'validate/missing-typography-values',
        severity: DESIGN_MD_ISSUE_SEVERITY.ERROR,
        rule: 'missing-typography-values',
        path: 'tokens.typography',
        message: 'No exportable typography values were found.',
        hint: 'Create local text styles with explicit typography properties.'
      })
    );
  }
}

export function validateNormalizedDesign(snapshot: DesignMdNormalizedSnapshot): DesignMdIssue[] {
  const issues: DesignMdIssue[] = [];

  pushAliasIntegrityIssues(snapshot, issues);
  pushMissingValueIssues(snapshot, issues);
  pushEmptyGroupIssues(snapshot, issues);
  pushCoreCoverageIssues(snapshot, issues);

  return issues.sort((left, right) => left.id.localeCompare(right.id));
}
