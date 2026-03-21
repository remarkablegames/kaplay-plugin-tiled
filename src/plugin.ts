import type { KAPLAYCtx } from 'kaplay';

import type { TiledMap, TiledMapOpt } from './types';
import {
  createLayerRenderer,
  createMatchedObjectObjects,
  createMatchedTileObjects,
  getLayerNames,
  parseTiledMap,
  parseTileGid,
  resolveTiledMap,
} from './utils';

export type { TiledMap, TiledMapOpt } from './types';

declare module 'kaplay' {
  interface KAPLAYCtx {
    addTiledMap: (map: TiledMap, options: TiledMapOpt) => void;
  }
}

/**
 * Add a Tiled map to the current KAPLAY context.
 *
 * The `map` argument can either be:
 * - parsed map JSON, or
 * - the asset key of a map loaded with `loadJSON()`.
 *
 * @param k - The active KAPLAY context.
 * @param map - The Tiled map data.
 * @param opt - The Tiled map options.
 */
function addTiledMap(k: KAPLAYCtx, map: TiledMap, opt: TiledMapOpt): void {
  const parsedMap = parseTiledMap(resolveTiledMap(k, map));
  const allowedLayerNames = getLayerNames(opt);

  parsedMap.layers.forEach((layer) => {
    if (!layer.visible) {
      return;
    }

    if (allowedLayerNames && !allowedLayerNames.has(layer.name)) {
      return;
    }

    if (layer.type === 'tilelayer') {
      layer.data.forEach((rawGid) => {
        const parsedGid = parseTileGid(rawGid);

        if (
          parsedGid &&
          (parsedGid.gid < parsedMap.tileset.firstGid ||
            parsedGid.gid > parsedMap.tileset.lastGid)
        ) {
          throw new Error(
            `Tile gid ${String(rawGid)} is outside the supported tileset range.`,
          );
        }
      });

      createLayerRenderer(k, layer, parsedMap, opt.sprite);
      createMatchedTileObjects(k, layer, parsedMap, opt);
      return;
    }

    createMatchedObjectObjects(k, layer, opt);
  });
}

/**
 * KAPLAY plugin that adds `addTiledMap()` to the context.
 *
 * @param k - The active KAPLAY context.
 * @returns - The plugin API.
 */
export function tiledPlugin(k: KAPLAYCtx) {
  return {
    addTiledMap(map: TiledMap, options: TiledMapOpt) {
      addTiledMap(k, map, options);
    },
  };
}
