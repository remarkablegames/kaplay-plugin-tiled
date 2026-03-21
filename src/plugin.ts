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
export function addTiledMap(
  k: KAPLAYCtx,
  map: TiledMap,
  opt: TiledMapOpt,
): void {
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
 * Create the Tiled plugin for KAPLAY.
 *
 * When `global` is enabled, `addTiledMap()` is available on the `window`.
 *
 * @param opt - The plugin options.
 * @returns - The KAPLAY plugin that adds `addTiledMap()`.
 */
export function tiledPlugin({ global = false } = {}) {
  return (k: KAPLAYCtx) => {
    const boundAddTiledMap = (map: TiledMap, options: TiledMapOpt) => {
      addTiledMap(k, map, options);
    };

    if (global) {
      globalThis.addTiledMap = boundAddTiledMap;
    }

    return {
      addTiledMap: boundAddTiledMap,
    };
  };
}
