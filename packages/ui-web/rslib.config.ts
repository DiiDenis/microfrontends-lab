import { defineConfig } from '@rslib/core';

export default defineConfig({
  output: {
    target: 'web',
  },
  source: {
    entry: {
      index: './src/index.ts',
      react: './src/react.ts',
    },
  },
  lib: [
    {
      dts: {
        abortOnError: true,
      },
      format: 'esm',
      syntax: 'es2022',
    },
  ],
});
