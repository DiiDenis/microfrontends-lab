/// <reference types="@rsbuild/core/types" />

declare module '*.vue' {
  import type { Component } from 'vue';

  const component: Component;

  export default component;
}
