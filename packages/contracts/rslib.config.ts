import { defineConfig } from '@rslib/core';

export default defineConfig({
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
      syntax: 'es2022',
    },
  ],
});
