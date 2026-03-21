import { addTiledMap, tiledPlugin } from '../dist/plugin.mjs';

describe('dist/plugin.mjs', () => {
  it('exports the tiled helpers', () => {
    expect(addTiledMap).toBeTypeOf('function');
    expect(tiledPlugin).toBeTypeOf('function');
  });
});
