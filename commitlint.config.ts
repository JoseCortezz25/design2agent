import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^(?:(\w+-\d+)\s)?(\w+)(?:\(([^)]+)\))?: (.+)$/,
      headerCorrespondence: ['ticket', 'type', 'scope', 'subject']
    }
  },
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'chore', 'docs', 'style', 'refactor', 'test', 'perf']
    ],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never']
  }
};

export default config;
