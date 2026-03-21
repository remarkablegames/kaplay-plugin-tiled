import type { KAPLAYCtx } from 'kaplay';

import { tiledPlugin } from '../dist/plugin.mjs';
import type { AddTiledMap } from '../src/types';

describe('dist/plugin.mjs', () => {
  it('exports plugin', () => {
    expect(tiledPlugin).toBeTypeOf('function');
  });

  it('adds plugin', () => {
    const k = {} as unknown as KAPLAYCtx;
    const plugin = tiledPlugin(k) as { addTiledMap: AddTiledMap };

    expect(plugin.addTiledMap).toBeTypeOf('function');
  });
});
