import js from '@eslint/js';
import globals from 'globals';
import typescript from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: ['dist/**']
  },
  typescript.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { js },
    languageOptions: { globals: globals.browser },
    rules: {
      'react/no-unescaped-entities': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'warn',
      'no-unused-vars': 'off',
      camelcase: [
        'error',
        {
          allow: ['api_url', 'Geist_Mono']
        }
      ]
    }
  },
  prettier
]);
