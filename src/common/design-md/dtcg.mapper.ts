import { DESIGN_MD_TOKEN_CATEGORY, type DesignMdNormalizedSnapshot } from './domain.types';

interface DtcgTokenNode {
  $type: string;
  $value: string | number;
  $description?: string;
}

interface DtcgGroup {
  [key: string]: DtcgGroup | DtcgTokenNode;
}

export interface DesignMdDtcgDocument {
  $schema: string;
  $metadata: {
    version: string;
    pageId: string;
    pageName: string;
  };
  color: DtcgGroup;
  typography: DtcgGroup;
  spacing: DtcgGroup;
  effects: DtcgGroup;
  components: DtcgGroup;
}

function ensureGroup(parent: DtcgGroup, key: string): DtcgGroup {
  const existing = parent[key];

  if (!existing || '$type' in existing) {
    const nextGroup: DtcgGroup = {};
    parent[key] = nextGroup;
    return nextGroup;
  }

  return existing;
}

function setByPath(root: DtcgGroup, path: string[], tokenNode: DtcgTokenNode): void {
  let cursor = root;

  for (let index = 0; index < path.length - 1; index += 1) {
    cursor = ensureGroup(cursor, path[index]);
  }

  cursor[path[path.length - 1]] = tokenNode;
}

function getTokenPath(tokenName: string): string[] {
  const tokenPath = tokenName.split('.').filter(Boolean);
  const rootPath = tokenPath.slice(1);
  return rootPath.length > 0 ? rootPath : [tokenPath[0]];
}

export function mapNormalizedToDtcg(
  normalized: DesignMdNormalizedSnapshot
): DesignMdDtcgDocument {
  const document: DesignMdDtcgDocument = {
    $schema: 'https://tr.designtokens.org/format/',
    $metadata: {
      version: normalized.version,
      pageId: normalized.page.id,
      pageName: normalized.page.name
    },
    color: {},
    typography: {},
    spacing: {},
    effects: {},
    components: {}
  };

  const sortedTokens = [...normalized.tokens].sort((left, right) =>
    left.name.localeCompare(right.name)
  );

  const tokenNameById = new Map(sortedTokens.map(token => [token.id, token.name]));

  for (const token of sortedTokens) {
    const resolvedAliasName = token.aliasOf ? tokenNameById.get(token.aliasOf) ?? null : null;
    const hasRealValue = typeof token.value === 'number' || (typeof token.value === 'string' && token.value.length > 0);

    if (!hasRealValue && resolvedAliasName == null) {
      continue;
    }

    const finalPath = getTokenPath(token.name);
    const tokenNode: DtcgTokenNode = {
      $type: token.tokenType,
      $value: resolvedAliasName ? `{${resolvedAliasName}}` : (token.value as string | number),
      $description: `source:${token.traceability.sourceKind}:${token.traceability.sourceId}`
    };

    if (token.category === DESIGN_MD_TOKEN_CATEGORY.COLOR) {
      setByPath(document.color, finalPath, tokenNode);
      continue;
    }

    if (token.category === DESIGN_MD_TOKEN_CATEGORY.TYPOGRAPHY) {
      setByPath(document.typography, finalPath, tokenNode);
      continue;
    }

    if (token.category === DESIGN_MD_TOKEN_CATEGORY.SPACING) {
      setByPath(document.spacing, finalPath, tokenNode);
      continue;
    }

    if (token.category === DESIGN_MD_TOKEN_CATEGORY.EFFECTS) {
      setByPath(document.effects, finalPath, tokenNode);
      continue;
    }

    setByPath(document.components, finalPath, tokenNode);
  }

  return document;
}

export function mapNormalizedToDtcgJson(normalized: DesignMdNormalizedSnapshot): string {
  return JSON.stringify(mapNormalizedToDtcg(normalized), null, 2);
}
