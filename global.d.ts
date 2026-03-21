import type { TiledMap, TiledMapOpt } from './dist/plugin';

declare global {
  var addTiledMap: (map: TiledMap, options: TiledMapOpt) => void;
}

export {};
