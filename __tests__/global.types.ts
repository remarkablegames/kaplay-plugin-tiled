import '../global';
import '../src/plugin';

import type { AddTiledMap } from '../src/types';

export function assertGlobalTyping() {
  const assertAddTiledMap = (addTiledMapFn: AddTiledMap) => {
    addTiledMapFn('level', {
      sprite: 'tileset',
    });
  };

  void assertAddTiledMap;
}

export function assertMixedImportTyping() {
  const globalAddTiledMap: AddTiledMap = addTiledMap;

  return globalAddTiledMap;
}
