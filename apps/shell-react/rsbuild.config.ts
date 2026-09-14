import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig, loadEnv } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

const localProductsRemoteUrl = 'http://localhost:3001/mf-manifest.json';
const localAccountRemoteUrl = 'http://localhost:3002/mf-manifest.json';
const { parsed: environment } = loadEnv({ prefixes: ['PRODUCTS_', 'ACCOUNT_'] });
const productsRemoteUrl =
  process.env.PRODUCTS_REMOTE_URL ??
  environment.PRODUCTS_REMOTE_URL ??
  localProductsRemoteUrl;
const accountRemoteUrl =
  process.env.ACCOUNT_REMOTE_URL ??
  environment.ACCOUNT_REMOTE_URL ??
  localAccountRemoteUrl;
const consumeRemoteTypes = process.env.MF_CONSUME_REMOTE_TYPES !== 'false';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: 'shell',
      remotes: {
        products: `products@${productsRemoteUrl}`,
        account: `account@${accountRemoteUrl}`,
      },
      shareStrategy: 'loaded-first',
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
      dts: consumeRemoteTypes
        ? {
            consumeTypes: {
              abortOnError: true,
              typesOnBuild: true,
            },
          }
        : false,
    }),
  ],
  server: {
    historyApiFallback: {
      index: '/index.html',
    },
    htmlFallback: false,
    port: 3000,
  },
  source: {
    define: {
      __ACCOUNT_REMOTE_URL__: JSON.stringify(accountRemoteUrl),
      __PRODUCTS_REMOTE_URL__: JSON.stringify(productsRemoteUrl),
    },
  },
  html: {
    title: 'Micro Frontends Lab',
  },
});
