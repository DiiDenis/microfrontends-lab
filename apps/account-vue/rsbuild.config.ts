import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import { defineConfig } from '@rsbuild/core';
import { pluginVue } from '@rsbuild/plugin-vue';

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
    assetPrefix: 'http://localhost:3002/',
  },
  server: {
    port: 3002,
  },
  html: {
    title: 'Minha conta',
  },
});
