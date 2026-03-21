import type { KAPLAYCtx } from 'kaplay';

declare module 'kaplay' {
  interface KAPLAYCtx {
    example: () => void;
  }
}

declare global {
  var example: () => void;
}

export function examplePlugin({ global = false } = {}) {
  return (k: KAPLAYCtx) => {
    const example = () => {
      k.debug.log('kaplay-plugin-template');
    };

    if (global) {
      globalThis.example = example;
    }

    return { example };
  };
}
