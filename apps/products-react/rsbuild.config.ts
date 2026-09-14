import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const productsAssetPrefix =
  process.env.PRODUCTS_ASSET_PREFIX ?? 'http://localhost:3001/';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'products',
      filename: 'remoteEntry.js',
      exposes: {
        './ProductApp': './src/ProductApp.tsx',
        './technicalInfo': './src/technicalInfo.ts',
      },
      manifest: true,
      shared: {
        react: {
          singleton: true,
          requiredVersion: '19.2.8',
        },
        'react/': {
          singleton: true,
          requiredVersion: '19.2.8',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '19.2.8',
        },
        'react-dom/': {
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
  output: {
    assetPrefix: productsAssetPrefix,
  },
  server: {
    port: 3001,
  },
  html: {
    title: 'Produtos',
  },
});
