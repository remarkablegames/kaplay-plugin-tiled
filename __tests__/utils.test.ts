import type { TiledMapData } from '../src/types';
import {
  createLayerRenderer,
  createMatchedObjectObjects,
  createMatchedTileObjects,
  getLayerNames,
  parseTiledMap,
  parseTileGid,
  resolveTiledMap,
} from '../src/utils';
import {
  createContext,
  createMapFixture,
  createObjectMapFixture,
  createOrderedLayerMapFixture,
  getAddedObject,
  getDrawComponent,
  getZComponent,
} from './test-helpers';

describe('resolveTiledMap', () => {
  it('returns parsed map data directly', () => {
    const { k } = createContext();
    const map = createMapFixture();

    expect(resolveTiledMap(k, map)).toBe(map);
  });

  it('accepts a loaded asset key for the map source', () => {
    const { getAsset, k } = createContext();
    const map = createMapFixture();
    getAsset.mockReturnValue({ data: map });

    expect(resolveTiledMap(k, 'level')).toBe(map);
    expect(getAsset).toHaveBeenCalledWith('level');
  });

  it('throws when a map asset key is missing', () => {
    const { getAsset, k } = createContext();
    getAsset.mockReturnValue(null);

    expect(() => {
      resolveTiledMap(k, 'missing-level');
    }).toThrow('Tiled map asset "missing-level" is not loaded.');
  });

  it('throws when a map asset key is not ready yet', () => {
    const { getAsset, k } = createContext();
    getAsset.mockReturnValue({ data: null });

    expect(() => {
      resolveTiledMap(k, 'loading-level');
    }).toThrow('Tiled map asset "loading-level" is not ready yet.');
  });
});

describe('getLayerNames', () => {
  it('returns null when layerNames are absent or empty', () => {
    expect(getLayerNames({ sprite: 'tileset' })).toBeNull();
    expect(getLayerNames({ layerNames: [], sprite: 'tileset' })).toBeNull();
  });

  it('returns a set when layerNames are provided', () => {
    expect(
      getLayerNames({ layerNames: ['Ground', 'Objects'], sprite: 'tileset' }),
    ).toEqual(new Set(['Ground', 'Objects']));
  });
});

describe('parseTileGid', () => {
  it('returns null for an empty gid', () => {
    expect(parseTileGid(0)).toBeNull();
  });

  it('normalizes flipped gids', () => {
    expect(parseTileGid(0x80000002)).toEqual({
      flip: {
        diagonal: false,
        horizontal: true,
        vertical: false,
      },
      gid: 2,
    });
  });
});

describe('parseTiledMap', () => {
  it('normalizes layers, defaults, tileset metadata, and z indices', () => {
    const parsedMap = parseTiledMap(createOrderedLayerMapFixture());

    expect(parsedMap.layers).toHaveLength(3);
    expect(parsedMap.layers[0]).toMatchObject({
      name: 'Background',
      opacity: 1,
      type: 'tilelayer',
      visible: true,
      x: 0,
      y: 0,
      zIndex: 0,
    });
    expect(parsedMap.layers[1]).toMatchObject({
      name: 'Objects',
      type: 'objectgroup',
      visible: true,
      zIndex: 1,
    });
    expect(parsedMap.layers[2]).toMatchObject({
      name: 'Foreground',
      opacity: 1,
      type: 'tilelayer',
      visible: true,
      zIndex: 2,
    });
    expect(parsedMap.tileset).toMatchObject({
      columns: 1,
      firstGid: 1,
      lastGid: 1,
      margin: 0,
      spacing: 0,
      tileCount: 1,
    });
  });

  it('collects tile properties by gid', () => {
    const parsedMap = parseTiledMap(createMapFixture());

    expect(parsedMap.tileset.tiles[2]).toEqual({
      gid: 2,
      properties: { collides: true },
      tileId: 1,
    });
  });

  it('rejects unsupported map orientations', () => {
    expect(() => {
      parseTiledMap({
        ...createMapFixture(),
        orientation: 'isometric',
      } as TiledMapData);
    }).toThrow(
      'Unsupported Tiled orientation "isometric". Expected "orthogonal".',
    );
  });

  it('rejects infinite maps', () => {
    expect(() => {
      parseTiledMap({
        ...createMapFixture(),
        infinite: true,
      });
    }).toThrow('Infinite Tiled maps are not supported.');
  });

  it('rejects multiple tilesets', () => {
    const map = createMapFixture();

    expect(() => {
      parseTiledMap({
        ...map,
        tilesets: [...map.tilesets, map.tilesets[0]],
      });
    }).toThrow('Exactly one Tiled tileset is required.');
  });

  it('rejects tilesets without columns', () => {
    expect(() => {
      parseTiledMap({
        height: 1,
        infinite: false,
        layers: [],
        orientation: 'orthogonal',
        tileheight: 16,
        tilesets: [
          {
            columns: 0,
            firstgid: 1,
            image: 'tileset.png',
            imageheight: 16,
            imagewidth: 16,
            name: 'tileset',
            tilecount: 1,
            tileheight: 16,
            tilewidth: 16,
          },
        ],
        tilewidth: 16,
        width: 1,
      });
    }).toThrow('Tiled tileset columns must be greater than 0.');
  });

  it('rejects tile layers whose data length does not match their dimensions', () => {
    expect(() => {
      parseTiledMap({
        height: 1,
        infinite: false,
        layers: [
          {
            data: [1],
            height: 2,
            name: 'Broken',
            type: 'tilelayer',
            width: 2,
          },
        ],
        orientation: 'orthogonal',
        tileheight: 16,
        tilesets: [
          {
            columns: 1,
            firstgid: 1,
            image: 'tileset.png',
            imageheight: 16,
            imagewidth: 16,
            name: 'tileset',
            tilecount: 1,
            tileheight: 16,
            tilewidth: 16,
          },
        ],
        tilewidth: 16,
        width: 1,
      });
    }).toThrow('Layer "Broken" data length does not match its dimensions.');
  });
});

describe('createLayerRenderer', () => {
  it('renders tiles with normalized quads and positions', () => {
    const { add, drawSprite, k, quad } = createContext();
    const parsedMap = parseTiledMap(createMapFixture());
    const groundLayer = parsedMap.layers.find(
      (
        layer,
      ): layer is (typeof parsedMap.layers)[number] & { type: 'tilelayer' } =>
        layer.type === 'tilelayer' && layer.name === 'Ground',
    );

    if (!groundLayer) {
      throw new Error('Expected Ground tile layer.');
    }

    createLayerRenderer(k, groundLayer, parsedMap, 'tileset');

    expect(add).toHaveBeenCalledOnce();

    const renderer = getAddedObject(add, 0);
    getDrawComponent(renderer).draw?.();

    expect(drawSprite).toHaveBeenCalledTimes(3);
    expect(quad).toHaveBeenNthCalledWith(1, 0, 0, 0.5, 0.5);
    expect(drawSprite).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        angle: 0,
        flipX: false,
        flipY: false,
        opacity: 0.5,
        pos: { x: 8, y: 8 },
      }),
    );
    expect(drawSprite).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ pos: { x: 8, y: 24 } }),
    );
    expect(drawSprite).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ pos: { x: 24, y: 24 } }),
    );
  });

  it('renders diagonal-only flipped tiles with the expected transform', () => {
    const { add, drawSprite, k } = createContext();
    const parsedMap = parseTiledMap({
      ...createMapFixture(),
      layers: [
        {
          ...createMapFixture().layers[0],
          data: [0x20000001, 0, 0, 0],
        },
      ],
    });
    const layer = parsedMap.layers[0];

    if (layer.type !== 'tilelayer') {
      throw new Error('Expected tile layer.');
    }

    createLayerRenderer(k, layer, parsedMap, 'tileset');

    getDrawComponent(getAddedObject(add, 0)).draw?.();

    expect(drawSprite).toHaveBeenCalledWith(
      expect.objectContaining({
        angle: 270,
        flipX: false,
        flipY: true,
      }),
    );
  });

  it('renders diagonal plus horizontal plus vertical flips with the expected transform', () => {
    const { add, drawSprite, k } = createContext();
    const parsedMap = parseTiledMap({
      ...createMapFixture(),
      layers: [
        {
          ...createMapFixture().layers[0],
          data: [0xe0000001, 0, 0, 0],
        },
      ],
    });
    const layer = parsedMap.layers[0];

    if (layer.type !== 'tilelayer') {
      throw new Error('Expected tile layer.');
    }

    createLayerRenderer(k, layer, parsedMap, 'tileset');

    getDrawComponent(getAddedObject(add, 0)).draw?.();

    expect(drawSprite).toHaveBeenCalledWith(
      expect.objectContaining({
        angle: 270,
        flipX: true,
        flipY: false,
      }),
    );
  });
});

describe('createMatchedTileObjects', () => {
  it('spawns tile objects for matching gid, layer, and property rules', () => {
    const { add, area, body, k } = createContext();
    const parsedMap = parseTiledMap(createMapFixture());
    const groundLayer = parsedMap.layers.find(
      (
        layer,
      ): layer is (typeof parsedMap.layers)[number] & { type: 'tilelayer' } =>
        layer.type === 'tilelayer' && layer.name === 'Ground',
    );

    if (!groundLayer) {
      throw new Error('Expected Ground tile layer.');
    }

    const tiles = createMatchedTileObjects(k, groundLayer, parsedMap, {
      sprite: 'tileset',
      tiles: [
        {
          comps: () => ['danger'],
          match: { gid: 2, layer: 'Ground' },
        },
        {
          comps: () => [area(), body({ isStatic: true }), 'solid'],
          match: { properties: { collides: true } },
        },
      ],
    });

    expect(tiles).toHaveLength(2);
    expect(add).toHaveBeenCalledTimes(2);
    expect(area).toHaveBeenCalledTimes(1);
    expect(body).toHaveBeenCalledTimes(1);
  });

  it('does not spawn tile objects when tile rules fail tileId, layer, or gid matching', () => {
    const { add, k } = createContext();
    const parsedMap = parseTiledMap(createMapFixture());
    const groundLayer = parsedMap.layers.find(
      (
        layer,
      ): layer is (typeof parsedMap.layers)[number] & { type: 'tilelayer' } =>
        layer.type === 'tilelayer' && layer.name === 'Ground',
    );

    if (!groundLayer) {
      throw new Error('Expected Ground tile layer.');
    }

    const tiles = createMatchedTileObjects(k, groundLayer, parsedMap, {
      sprite: 'tileset',
      tiles: [
        {
          comps: () => ['wrong-tile-id'],
          match: { tileId: 99 },
        },
        {
          comps: () => ['wrong-layer'],
          match: { layer: 'Missing' },
        },
        {
          comps: () => ['wrong-gid'],
          match: { gid: 99 },
        },
      ],
    });

    expect(tiles).toHaveLength(0);
    expect(add).not.toHaveBeenCalled();
  });

  it('returns no tile objects when there are no tile rules', () => {
    const { add, k } = createContext();
    const parsedMap = parseTiledMap(createMapFixture());
    const layer = parsedMap.layers[0];

    if (layer.type !== 'tilelayer') {
      throw new Error('Expected tile layer.');
    }

    expect(
      createMatchedTileObjects(k, layer, parsedMap, { sprite: 'tileset' }),
    ).toEqual([]);
    expect(add).not.toHaveBeenCalled();
  });

  it('passes normalized flip, gid, tileId, positions, and z index into spawned tile objects', () => {
    const { add, k } = createContext();
    const parsedMap = parseTiledMap({
      ...createMapFixture(),
      layers: [
        {
          ...createMapFixture().layers[0],
          data: [0x80000002, 0, 0, 0],
        },
      ],
    });
    const layer = parsedMap.layers[0];

    if (layer.type !== 'tilelayer') {
      throw new Error('Expected tile layer.');
    }

    const tiles = createMatchedTileObjects(k, layer, parsedMap, {
      sprite: 'tileset',
      tiles: [
        {
          comps: ({ flip, gid, pos, tileId, tilePos, tileSize }) => {
            expect(flip).toEqual({
              diagonal: false,
              horizontal: true,
              vertical: false,
            });
            expect(gid).toBe(2);
            expect(pos).toEqual({ x: 0, y: 0 });
            expect(tileId).toBe(1);
            expect(tilePos).toEqual({ x: 0, y: 0 });
            expect(tileSize).toEqual({ height: 16, width: 16 });

            return ['matched'];
          },
          match: {
            gid: 2,
            properties: { collides: true },
            tileId: 1,
          },
        },
      ],
    });

    expect(tiles).toHaveLength(1);
    expect(getZComponent(getAddedObject(add, 0)).value).toBe(0);
  });
});

describe('createMatchedObjectObjects', () => {
  it('spawns object objects for matching object-layer rules', () => {
    const { add, area, body, k } = createContext();
    const parsedMap = parseTiledMap(createObjectMapFixture());
    const objectLayer = parsedMap.layers.find(
      (
        layer,
      ): layer is (typeof parsedMap.layers)[number] & { type: 'objectgroup' } =>
        layer.type === 'objectgroup' && layer.name === 'Objects',
    );

    if (!objectLayer) {
      throw new Error('Expected Objects object layer.');
    }

    const objects = createMatchedObjectObjects(k, objectLayer, {
      objects: [
        {
          comps: ({ objectSize }) => [
            area({
              shape: new k.Rect(
                k.vec2(0, 0),
                objectSize.width,
                objectSize.height,
              ),
            }),
            body({ isStatic: true }),
            'door',
          ],
          match: { name: 'Door', type: 'trigger' },
        },
      ],
      sprite: 'tileset',
    });

    expect(objects).toHaveLength(1);
    expect(add).toHaveBeenCalledOnce();
    expect(area).toHaveBeenCalledOnce();
    expect(body).toHaveBeenCalledOnce();
  });

  it('does not spawn object objects when object rules fail layer, name, or type matching', () => {
    const { add, k } = createContext();
    const parsedMap = parseTiledMap(createObjectMapFixture());
    const objectLayer = parsedMap.layers.find(
      (
        layer,
      ): layer is (typeof parsedMap.layers)[number] & { type: 'objectgroup' } =>
        layer.type === 'objectgroup' && layer.name === 'Objects',
    );

    if (!objectLayer) {
      throw new Error('Expected Objects object layer.');
    }

    const objects = createMatchedObjectObjects(k, objectLayer, {
      objects: [
        {
          comps: () => ['wrong-layer'],
          match: { layer: 'Missing' },
        },
        {
          comps: () => ['wrong-name'],
          match: { name: 'Missing' },
        },
        {
          comps: () => ['wrong-type'],
          match: { type: 'sensor' },
        },
      ],
      sprite: 'tileset',
    });

    expect(objects).toHaveLength(0);
    expect(add).not.toHaveBeenCalled();
  });

  it('skips invisible object layers and invisible objects in the matcher helper', () => {
    const { add, k } = createContext();
    const parsedMap = parseTiledMap(createObjectMapFixture());
    const objectLayer = parsedMap.layers.find(
      (
        layer,
      ): layer is (typeof parsedMap.layers)[number] & { type: 'objectgroup' } =>
        layer.type === 'objectgroup' && layer.name === 'Objects',
    );
    const hiddenLayer = parsedMap.layers.find(
      (
        layer,
      ): layer is (typeof parsedMap.layers)[number] & { type: 'objectgroup' } =>
        layer.type === 'objectgroup' && layer.name === 'Hidden Objects',
    );

    if (!objectLayer || !hiddenLayer) {
      throw new Error('Expected object layers.');
    }

    const visibleObjects = createMatchedObjectObjects(k, objectLayer, {
      objects: [
        {
          comps: () => ['door'],
          match: { layer: 'Objects', name: 'Door', type: 'trigger' },
        },
      ],
      sprite: 'tileset',
    });
    const hiddenObjects = createMatchedObjectObjects(k, hiddenLayer, {
      objects: [
        {
          comps: () => ['ignored'],
          match: { layer: 'Hidden Objects', name: 'Ignored', type: 'trigger' },
        },
      ],
      sprite: 'tileset',
    });

    expect(visibleObjects).toHaveLength(1);
    expect(hiddenObjects).toHaveLength(0);
    expect(add).toHaveBeenCalledOnce();
  });

  it('preserves parsed layer z indices on spawned object objects', () => {
    const { add, k } = createContext();
    const parsedMap = parseTiledMap(createOrderedLayerMapFixture());
    const objectLayer = parsedMap.layers.find(
      (
        layer,
      ): layer is (typeof parsedMap.layers)[number] & { type: 'objectgroup' } =>
        layer.type === 'objectgroup' && layer.name === 'Objects',
    );

    if (!objectLayer) {
      throw new Error('Expected Objects object layer.');
    }

    createMatchedObjectObjects(k, objectLayer, {
      objects: [
        {
          comps: () => ['door'],
          match: { layer: 'Objects', name: 'Door', type: 'trigger' },
        },
      ],
      sprite: 'tileset',
    });

    expect(getZComponent(getAddedObject(add, 0)).value).toBe(1);
  });
});
