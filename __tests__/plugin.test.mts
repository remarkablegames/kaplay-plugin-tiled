import type { KAPLAYCtx } from 'kaplay';

import { tiledPlugin } from '../dist/plugin.mjs';

describe('dist/plugin.mjs', () => {
  it('exports plugin', () => {
    expect(tiledPlugin).toBeTypeOf('function');
  });

  it('adds plugin', () => {
    const k = {} as unknown as KAPLAYCtx;
    const plugin = tiledPlugin(k);

    expect(plugin.addTiledMap).toBeTypeOf('function');
  });
});
