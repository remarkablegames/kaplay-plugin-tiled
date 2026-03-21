import type { CompList, GameObj, KAPLAYCtx, Quad } from 'kaplay';

import type {
  ParsedTiledLayer,
  ParsedTiledMap,
  ParsedTiledTile,
  TiledLayer,
  TiledLayerComp,
  TiledMap,
  TiledMapData,
  TiledMapOpt,
  TiledObjectContext,
  TiledObjectLayer,
  TiledObjectMatch,
  TiledProperty,
  TiledPropertyValue,
  TiledTileContext,
  TiledTileLayer,
  TiledTileMatch,
} from './types';

export function resolveTiledMap(k: KAPLAYCtx, map: TiledMap): TiledMapData {
  if (typeof map !== 'string') {
    return map;
  }

  const asset = k.getAsset(map);

  if (!asset) {
    throw new Error(`Tiled map asset "${map}" is not loaded.`);
  }

  if (!asset.data) {
    throw new Error(`Tiled map asset "${map}" is not ready yet.`);
  }

  return asset.data as TiledMapData;
}

function getPropertyRecord(
  properties: TiledProperty[] | undefined,
): Record<string, TiledPropertyValue> {
  const record: Record<string, TiledPropertyValue> = {};

  properties?.forEach((property) => {
    record[property.name] = property.value;
  });

  return record;
}

function isObjectLayer(layer: TiledLayer): layer is TiledObjectLayer {
  return layer.type === 'objectgroup';
}

function isTileLayer(layer: TiledLayer): layer is TiledTileLayer {
  return layer.type === 'tilelayer';
}

function normalizeTileLayer(layer: TiledTileLayer): ParsedTiledLayer {
  return {
    data: layer.data,
    height: layer.height,
    name: layer.name,
    opacity: layer.opacity ?? 1,
    visible: layer.visible ?? true,
    width: layer.width,
    x: layer.x ?? 0,
    y: layer.y ?? 0,
  };
}

function getTileQuad(k: KAPLAYCtx, map: ParsedTiledMap, gid: number): Quad {
  const localTileId = gid - map.tileset.firstGid;
  const column = localTileId % map.tileset.columns;
  const row = Math.floor(localTileId / map.tileset.columns);
  const x =
    map.tileset.margin + column * (map.tileset.tileWidth + map.tileset.spacing);
  const y =
    map.tileset.margin + row * (map.tileset.tileHeight + map.tileset.spacing);

  return k.quad(
    x / map.tileset.imageWidth,
    y / map.tileset.imageHeight,
    map.tileset.tileWidth / map.tileset.imageWidth,
    map.tileset.tileHeight / map.tileset.imageHeight,
  );
}

export function getLayerNames(options: TiledMapOpt): Set<string> | null {
  if (!options.layerNames?.length) {
    return null;
  }

  return new Set(options.layerNames);
}

function getParsedTile(
  map: ParsedTiledMap,
  gid: number,
): ParsedTiledTile | undefined {
  return map.tileset.tiles[gid];
}

function matchesProperties(
  expected: Record<string, TiledPropertyValue> | undefined,
  actual: Record<string, TiledPropertyValue>,
): boolean {
  if (!expected) {
    return true;
  }

  return Object.entries(expected).every(
    ([name, value]) => actual[name] === value,
  );
}

function matchesTileRule(
  match: TiledTileMatch,
  tile: TiledTileContext,
): boolean {
  if (match.gid !== undefined && match.gid !== tile.gid) {
    return false;
  }

  if (match.tileId !== undefined && match.tileId !== tile.tileId) {
    return false;
  }

  if (match.layer !== undefined && match.layer !== tile.layer) {
    return false;
  }

  return matchesProperties(match.properties, tile.properties);
}

function matchesObjectRule(
  match: TiledObjectMatch,
  object: TiledObjectContext,
): boolean {
  if (match.layer !== undefined && match.layer !== object.layer) {
    return false;
  }

  if (match.name !== undefined && match.name !== object.name) {
    return false;
  }

  if (match.type !== undefined && match.type !== object.type) {
    return false;
  }

  return matchesProperties(match.properties, object.properties);
}

export function createLayerRenderer(
  k: KAPLAYCtx,
  layer: ParsedTiledLayer,
  layerIndex: number,
  map: ParsedTiledMap,
  sprite: string,
): GameObj {
  return k.add([
    k.pos(0, 0),
    k.z(layerIndex),
    {
      draw: () => {
        layer.data.forEach((gid, index) => {
          if (gid === 0) {
            return;
          }

          const column = index % layer.width;
          const row = Math.floor(index / layer.width);

          k.drawSprite({
            anchor: 'topleft',
            opacity: layer.opacity,
            pos: k.vec2(
              (column + layer.x) * map.tileWidth,
              (row + layer.y) * map.tileHeight,
            ),
            quad: getTileQuad(k, map, gid),
            sprite,
          });
        });
      },
      id: 'tiled-layer',
    },
  ] as CompList<TiledLayerComp>);
}

export function createMatchedTileObjects(
  k: KAPLAYCtx,
  layer: ParsedTiledLayer,
  layerIndex: number,
  map: ParsedTiledMap,
  options: TiledMapOpt,
): GameObj[] {
  const rules = options.tiles;

  if (!rules?.length) {
    return [];
  }

  const tiles: GameObj[] = [];

  layer.data.forEach((gid, index) => {
    if (gid === 0) {
      return;
    }

    const parsedTile = getParsedTile(map, gid);
    const column = index % layer.width;
    const row = Math.floor(index / layer.width);
    const tile = {
      gid,
      layer: layer.name,
      pos: {
        x: (column + layer.x) * map.tileWidth,
        y: (row + layer.y) * map.tileHeight,
      },
      properties: parsedTile?.properties ?? {},
      tileSize: {
        height: map.tileHeight,
        width: map.tileWidth,
      },
      tileId: parsedTile?.tileId ?? gid - map.tileset.firstGid,
      tilePos: {
        x: column + layer.x,
        y: row + layer.y,
      },
    };

    rules.forEach((rule) => {
      if (!matchesTileRule(rule.match, tile)) {
        return;
      }

      tiles.push(
        k.add([
          k.pos(tile.pos.x, tile.pos.y),
          k.anchor('topleft'),
          k.z(layerIndex),
          ...rule.comps(tile),
        ] as CompList<unknown>),
      );
    });
  });

  return tiles;
}

export function createMatchedObjectObjects(
  k: KAPLAYCtx,
  map: ParsedTiledMap,
  options: TiledMapOpt,
): GameObj[] {
  const rules = options.objects;

  if (!rules?.length) {
    return [];
  }

  const objects: GameObj[] = [];

  map.objectLayers.forEach((layer, layerIndex) => {
    if (!(layer.visible ?? true)) {
      return;
    }

    layer.objects.forEach((object) => {
      if (!object.visible) {
        return;
      }

      const context: TiledObjectContext = {
        id: object.id,
        layer: layer.name,
        name: object.name,
        objectSize: {
          height: object.height,
          width: object.width,
        },
        point: object.point ?? false,
        pos: {
          x: object.x,
          y: object.y,
        },
        properties: getPropertyRecord(object.properties),
        rotation: object.rotation,
        type: object.type,
      };

      rules.forEach((rule) => {
        if (!matchesObjectRule(rule.match, context)) {
          return;
        }

        objects.push(
          k.add([
            k.pos(context.pos.x, context.pos.y),
            k.anchor('topleft'),
            k.z(map.layers.length + layerIndex),
            ...rule.comps(context),
          ] as CompList<unknown>),
        );
      });
    });
  });

  return objects;
}

export function parseTiledMap(data: TiledMapData): ParsedTiledMap {
  if (data.orientation !== 'orthogonal') {
    throw new Error(
      `Unsupported Tiled orientation "${data.orientation}". Expected "orthogonal".`,
    );
  }

  if (data.infinite) {
    throw new Error('Infinite Tiled maps are not supported.');
  }

  if (data.tilesets.length !== 1) {
    throw new Error('Exactly one Tiled tileset is required.');
  }

  const [tileset] = data.tilesets;

  if (tileset.columns <= 0) {
    throw new Error('Tiled tileset columns must be greater than 0.');
  }

  const layers = data.layers.filter(isTileLayer).map((layer) => {
    if (layer.data.length !== layer.width * layer.height) {
      throw new Error(
        `Layer "${layer.name}" data length does not match its dimensions.`,
      );
    }

    return normalizeTileLayer(layer);
  });

  return {
    height: data.height,
    layers,
    objectLayers: data.layers.filter(isObjectLayer),
    orientation: 'orthogonal',
    tileHeight: data.tileheight,
    tileWidth: data.tilewidth,
    tileset: {
      columns: tileset.columns,
      firstGid: tileset.firstgid,
      image: tileset.image,
      imageHeight: tileset.imageheight,
      imageWidth: tileset.imagewidth,
      lastGid: tileset.firstgid + tileset.tilecount - 1,
      margin: tileset.margin ?? 0,
      name: tileset.name,
      spacing: tileset.spacing ?? 0,
      tileCount: tileset.tilecount,
      tileHeight: tileset.tileheight,
      tiles: Object.fromEntries(
        (tileset.tiles ?? []).map((tile) => [
          tile.id + tileset.firstgid,
          {
            gid: tile.id + tileset.firstgid,
            properties: getPropertyRecord(tile.properties),
            tileId: tile.id,
          },
        ]),
      ),
      tileWidth: tileset.tilewidth,
    },
    width: data.width,
  };
}
