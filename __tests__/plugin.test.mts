import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);

describe('dist/plugin.mjs', () => {
  it('exports the tiled helpers', () => {
    const plugin = require(
      resolve(import.meta.dirname, '../dist/plugin.cjs'),
    ) as Record<string, unknown>;

    expect(plugin.parseTiledMap).toBeUndefined();
    expect(plugin.addTiledMap).toBeTypeOf('function');
    expect(plugin.tiledPlugin).toBeTypeOf('function');
  });
});
