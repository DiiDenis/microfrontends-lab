import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  output: {
    target: 'web',
  },
  plugins: [pluginReact()],
  source: {
    entry: {
      index: './src/index.ts',
    },
  },
  lib: [
    {
      dts: {
        abortOnError: true,
      },
      format: 'esm',
      output: {
        externals: [/^react($|\/)/, /^react-dom($|\/)/],
      },
      syntax: 'es2022',
    },
  ],
});
