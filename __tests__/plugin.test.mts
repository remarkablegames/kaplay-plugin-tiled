import type { KAPLAYCtx } from 'kaplay';

import { tiledPlugin } from '../dist/plugin.mjs';

describe('dist/plugin.mjs', () => {
  it('exports plugin', () => {
    expect(tiledPlugin).toBeTypeOf('function');
  });

  it('adds plugin', () => {
    const k = {} as unknown as KAPLAYCtx;
    expect(tiledPlugin(k).addTiledMap).toBeTypeOf('function');
  });
});
