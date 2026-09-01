import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'products',
      filename: 'remoteEntry.js',
      exposes: {
        './ProductApp': './src/ProductApp.tsx',
      },
      manifest: true,
      shared: {
        react: {
          singleton: true,
          requiredVersion: '19.2.8',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '19.2.8',
        },
      },
      dts: {
        generateTypes: {
          abortOnError: true,
        },
      },
    }),
  ],
  server: {
    port: 3001,
  },
  html: {
    title: 'Produtos',
  },
});
