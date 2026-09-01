import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const localProductsRemoteUrl = 'http://localhost:3001/mf-manifest.json';
const { parsed: environment } = loadEnv({ prefixes: ['PRODUCTS_'] });
const productsRemoteUrl = environment.PRODUCTS_REMOTE_URL ?? localProductsRemoteUrl;

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'shell',
      remotes: {
        products: `products@${productsRemoteUrl}`,
      },
      shareStrategy: 'loaded-first',
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
        consumeTypes: {
          abortOnError: true,
          typesOnBuild: true,
        },
      },
    }),
  ],
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
