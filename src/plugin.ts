import type { KAPLAYCtx } from 'kaplay';

import type { TiledMap, TiledMapOpt } from './types';
import {
  createLayerRenderer,
  createMatchedObjectObjects,
  createMatchedTileObjects,
  getLayerNames,
  parseTiledMap,
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

  for (
    let layerIndex = 0;
    layerIndex < parsedMap.layers.length;
    layerIndex += 1
  ) {
    const layer = parsedMap.layers[layerIndex];

    if (!layer.visible) {
      continue;
    }

    if (allowedLayerNames && !allowedLayerNames.has(layer.name)) {
      continue;
    }

    layer.data.forEach((gid) => {
      if (
        gid !== 0 &&
        (gid < parsedMap.tileset.firstGid || gid > parsedMap.tileset.lastGid)
      ) {
        throw new Error(
          `Tile gid ${String(gid)} is outside the supported tileset range.`,
        );
      }
    });

    createLayerRenderer(k, layer, layerIndex, parsedMap, opt.sprite);
    createMatchedTileObjects(k, layer, layerIndex, parsedMap, opt);
  }

  createMatchedObjectObjects(k, parsedMap, opt);
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
