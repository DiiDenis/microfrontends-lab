import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    historyApiFallback: {
      index: '/index.html',
    },
    htmlFallback: false,
    port: 3000,
  },
  html: {
    title: 'Micro Frontends Lab',
  },
});
