import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import path from 'node:path';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@chromatic-com/storybook'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  async viteFinal(config) {
    const { default: tailwindcss } = await import('@tailwindcss/vite');
    return mergeConfig(config, {
      plugins: [tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../src'),
          '@common': path.resolve(__dirname, '../src/common'),
          '@ui': path.resolve(__dirname, '../src/ui'),
          '@plugin': path.resolve(__dirname, '../src/plugin')
        }
      },
      build: {
        // Prevents esbuild from stripping newlines between CSS side-effect imports
        // and const declarations, which causes SyntaxError in production builds.
        minify: false
      }
    });
  }
};

export default config;
