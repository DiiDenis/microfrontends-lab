import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';

const accountAssetPrefix =
  process.env.ACCOUNT_ASSET_PREFIX ?? 'http://localhost:3002/';

export default defineConfig({
  plugins: [
    pluginVue({
      vueLoaderOptions: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'lab-status-chip',
        },
      },
    }),
    pluginModuleFederation({
      name: 'account',
      filename: 'remoteEntry.js',
      exposes: {
        './mount': './src/mount.ts',
        './technicalInfo': './src/technicalInfo.ts',
      },
      manifest: true,
      shared: {
        vue: {
          singleton: true,
          requiredVersion: '3.5.42',
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
    assetPrefix: accountAssetPrefix,
  },
  server: {
    port: 3002,
  },
  html: {
    title: 'Minha conta',
  },
});
