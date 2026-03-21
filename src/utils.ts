import type { CompList, GameObj, KAPLAYCtx, Quad } from 'kaplay';

import type {
  ParsedTiledLayer,
  ParsedTiledMap,
  ParsedTiledObjectLayer,
  ParsedTiledTile,
  ParsedTiledTileLayer,
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

const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
const FLIPPED_VERTICALLY_FLAG = 0x40000000;
const FLIPPED_DIAGONALLY_FLAG = 0x20000000;
const FLIP_FLAGS =
  FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG;

interface ParsedTileGid {
  gid: number;
  flip: {
    diagonal: boolean;
    horizontal: boolean;
    vertical: boolean;
  };
}

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
    type: 'tilelayer',
    visible: layer.visible ?? true,
    width: layer.width,
    x: layer.x ?? 0,
    y: layer.y ?? 0,
    zIndex: 0,
  };
}

function normalizeObjectLayer(layer: TiledObjectLayer): ParsedTiledObjectLayer {
  return {
    name: layer.name,
    objects: layer.objects,
    type: 'objectgroup',
    visible: layer.visible ?? true,
    zIndex: 0,
  };
}

export function parseTileGid(rawGid: number): ParsedTileGid | null {
  if (rawGid === 0) {
    return null;
  }

  return {
    gid: (rawGid & ~FLIP_FLAGS) >>> 0,
    flip: {
      diagonal: (rawGid & FLIPPED_DIAGONALLY_FLAG) !== 0,
      horizontal: (rawGid & FLIPPED_HORIZONTALLY_FLAG) !== 0,
      vertical: (rawGid & FLIPPED_VERTICALLY_FLAG) !== 0,
    },
  };
}

function getTileDrawTransform(flip: ParsedTileGid['flip']): {
  angle: number;
  flipX: boolean;
  flipY: boolean;
} {
  if (!flip.diagonal) {
    return {
      angle: 0,
      flipX: flip.horizontal,
      flipY: flip.vertical,
    };
  }

  if (flip.horizontal && flip.vertical) {
    return {
      angle: 270,
      flipX: true,
      flipY: false,
    };
  }

  if (flip.horizontal) {
    return {
      angle: 270,
      flipX: false,
      flipY: false,
    };
  }

  if (flip.vertical) {
    return {
      angle: 90,
      flipX: false,
      flipY: false,
    };
  }

  return {
    angle: 270,
    flipX: false,
    flipY: true,
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
  layer: ParsedTiledTileLayer,
  map: ParsedTiledMap,
  sprite: string,
): GameObj {
  return k.add([
    k.pos(0, 0),
    k.z(layer.zIndex),
    {
      draw: () => {
        layer.data.forEach((rawGid, index) => {
          const parsedGid = parseTileGid(rawGid);

          if (!parsedGid) {
            return;
          }

          const column = index % layer.width;
          const row = Math.floor(index / layer.width);
          const drawTransform = getTileDrawTransform(parsedGid.flip);

          k.drawSprite({
            anchor: 'center',
            angle: drawTransform.angle,
            flipX: drawTransform.flipX,
            flipY: drawTransform.flipY,
            opacity: layer.opacity,
            pos: k.vec2(
              (column + layer.x) * map.tileWidth + map.tileset.tileWidth / 2,
              (row + layer.y) * map.tileHeight + map.tileset.tileHeight / 2,
            ),
            quad: getTileQuad(k, map, parsedGid.gid),
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
  layer: ParsedTiledTileLayer,
  map: ParsedTiledMap,
  options: TiledMapOpt,
): GameObj[] {
  const rules = options.tiles;

  if (!rules?.length) {
    return [];
  }

  const tiles: GameObj[] = [];

  layer.data.forEach((rawGid, index) => {
    const parsedGid = parseTileGid(rawGid);

    if (!parsedGid) {
      return;
    }

    const parsedTile = getParsedTile(map, parsedGid.gid);
    const column = index % layer.width;
    const row = Math.floor(index / layer.width);
    const tile = {
      flip: parsedGid.flip,
      gid: parsedGid.gid,
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
      tileId: parsedTile?.tileId ?? parsedGid.gid - map.tileset.firstGid,
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
          k.z(layer.zIndex),
          ...rule.comps(tile),
        ] as CompList<unknown>),
      );
    });
  });

  return tiles;
}

export function createMatchedObjectObjects(
  k: KAPLAYCtx,
  layer: ParsedTiledObjectLayer,
  options: TiledMapOpt,
): GameObj[] {
  const rules = options.objects;

  if (!rules?.length) {
    return [];
  }

  const objects: GameObj[] = [];

  if (!layer.visible) {
    return objects;
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
          k.z(layer.zIndex),
          ...rule.comps(context),
        ] as CompList<unknown>),
      );
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

  const layers = data.layers.map((layer, zIndex) => {
    if (isTileLayer(layer)) {
      if (layer.data.length !== layer.width * layer.height) {
        throw new Error(
          `Layer "${layer.name}" data length does not match its dimensions.`,
        );
      }

      return {
        ...normalizeTileLayer(layer),
        zIndex,
      };
    }

    if (isObjectLayer(layer)) {
      return {
        ...normalizeObjectLayer(layer),
        zIndex,
      };
    }

    throw new Error('Unsupported Tiled layer type.');
  });

  return {
    height: data.height,
    layers,
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
