import level from '../integration/level.json';
import type { TiledMap, TiledMapOpt } from '../src/plugin';
import { addTiledMap } from '../src/plugin';
import {
  createMatchedObjectObjects,
  createMatchedTileObjects,
  parseTiledMap,
} from '../src/utils';
import {
  createContext,
  createMapFixture,
  createObjectMapFixture,
} from './test-helpers';

describe('utils', () => {
  it('filters layers when layerNames are provided', () => {
    const { add, k } = createContext();
    const options: TiledMapOpt = {
      layerNames: ['Missing'],
      sprite: 'tileset',
    };

    addTiledMap(k, createMapFixture(), options);

    expect(add).not.toHaveBeenCalled();
  });

  it('spawns tile objects for matching gid, layer, and property rules', () => {
    const { add, area, body, k } = createContext();

    addTiledMap(k, createMapFixture(), {
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

    expect(add).toHaveBeenCalledTimes(3);
    expect(area).toHaveBeenCalledTimes(1);
    expect(body).toHaveBeenCalledTimes(1);
  });

  it('does not spawn tile objects when tile rules fail tileId or layer matching', () => {
    const { add, k } = createContext();

    addTiledMap(k, createMapFixture(), {
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
      ],
    });

    expect(add).toHaveBeenCalledOnce();
  });

  it('does not spawn tile objects when tile rules fail gid matching', () => {
    const { k } = createContext();
    const parsedMap = parseTiledMap(createMapFixture());
    const tiles = createMatchedTileObjects(
      k,
      parsedMap.layers[0],
      0,
      parsedMap,
      {
        sprite: 'tileset',
        tiles: [
          {
            comps: () => ['wrong-gid'],
            match: { gid: 99 },
          },
        ],
      },
    );

    expect(tiles).toHaveLength(0);
  });

  it('spawns object objects for matching object-layer rules', () => {
    const { add, area, body, k } = createContext();

    addTiledMap(k, level as TiledMap, {
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
            'wall',
          ],
          match: { properties: { collides: true } },
        },
      ],
      sprite: 'tileset',
    });

    expect(add).toHaveBeenCalledTimes(7);
    expect(area).toHaveBeenCalledTimes(4);
    expect(body).toHaveBeenCalledTimes(4);
  });

  it('treats an empty layerNames filter like no filter', () => {
    const { add, k } = createContext();

    addTiledMap(k, createMapFixture(), { layerNames: [], sprite: 'tileset' });

    expect(add).toHaveBeenCalledOnce();
  });

  it('skips invisible layers', () => {
    const { add, k } = createContext();

    addTiledMap(
      k,
      {
        height: 1,
        infinite: false,
        layers: [
          {
            data: [1],
            height: 1,
            name: 'Hidden',
            type: 'tilelayer',
            visible: false,
            width: 1,
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
      },
      { sprite: 'tileset' },
    );

    expect(add).not.toHaveBeenCalled();
  });

  it('rejects unsupported map orientations', () => {
    const { k } = createContext();

    expect(() => {
      addTiledMap(k, { ...level, orientation: 'isometric' } as TiledMap, {
        sprite: 'tileset',
      });
    }).toThrow(
      'Unsupported Tiled orientation "isometric". Expected "orthogonal".',
    );
  });

  it('rejects infinite maps', () => {
    const { k } = createContext();

    expect(() => {
      addTiledMap(k, { ...level, infinite: true } as TiledMap, {
        sprite: 'tileset',
      });
    }).toThrow('Infinite Tiled maps are not supported.');
  });

  it('rejects multiple tilesets', () => {
    const { k } = createContext();

    expect(() => {
      addTiledMap(
        k,
        {
          ...level,
          tilesets: [...level.tilesets, level.tilesets[0]],
        } as TiledMap,
        { sprite: 'tileset' },
      );
    }).toThrow('Exactly one Tiled tileset is required.');
  });

  it('rejects tilesets without columns', () => {
    const { k } = createContext();

    expect(() => {
      addTiledMap(
        k,
        {
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
        },
        { sprite: 'tileset' },
      );
    }).toThrow('Tiled tileset columns must be greater than 0.');
  });

  it('rejects tile layers whose data length does not match their dimensions', () => {
    const { k } = createContext();

    expect(() => {
      addTiledMap(
        k,
        {
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
        },
        { sprite: 'tileset' },
      );
    }).toThrow('Layer "Broken" data length does not match its dimensions.');
  });

  it('throws when a tile gid is outside the supported tileset range', () => {
    const { k } = createContext();

    expect(() => {
      addTiledMap(
        k,
        {
          ...createMapFixture(),
          layers: [
            {
              ...createMapFixture().layers[0],
              data: [99, 0, 0, 0],
            },
            ...createMapFixture().layers.slice(1),
          ],
        },
        { sprite: 'tileset' },
      );
    }).toThrow('Tile gid 99 is outside the supported tileset range.');
  });

  it('normalizes flipped gids for range checks, matching, and sprite quads', () => {
    const { add, drawSprite, k, quad } = createContext();

    addTiledMap(
      k,
      {
        ...createMapFixture(),
        layers: [
          {
            ...createMapFixture().layers[0],
            data: [0x80000002, 0, 0, 0],
          },
        ],
      },
      {
        sprite: 'tileset',
        tiles: [
          {
            comps: ({ flip, gid, tileId }) => {
              expect(flip).toEqual({
                diagonal: false,
                horizontal: true,
                vertical: false,
              });
              expect(gid).toBe(2);
              expect(tileId).toBe(1);

              return ['matched'];
            },
            match: {
              gid: 2,
              properties: { collides: true },
              tileId: 1,
            },
          },
        ],
      },
    );

    const renderer = add.mock.results[0]?.value as { components: unknown[] };
    const drawComp = renderer.components.find(
      (component): component is { draw: () => void } =>
        typeof component === 'object' &&
        component !== null &&
        'draw' in component &&
        typeof component.draw === 'function',
    );

    drawComp?.draw();

    expect(quad).toHaveBeenCalledWith(0.5, 0, 0.5, 0.5);
    expect(drawSprite).toHaveBeenCalledWith(
      expect.objectContaining({
        angle: 0,
        flipX: true,
        flipY: false,
      }),
    );
    expect(add).toHaveBeenCalledTimes(2);
  });

  it('renders diagonal-only flipped tiles with the expected transform', () => {
    const { add, drawSprite, k } = createContext();

    addTiledMap(
      k,
      {
        ...createMapFixture(),
        layers: [
          {
            ...createMapFixture().layers[0],
            data: [0x20000001, 0, 0, 0],
          },
        ],
      },
      { sprite: 'tileset' },
    );

    const renderer = add.mock.results[0]?.value as { components: unknown[] };
    const drawComp = renderer.components.find(
      (component): component is { draw: () => void } =>
        typeof component === 'object' &&
        component !== null &&
        'draw' in component &&
        typeof component.draw === 'function',
    );

    drawComp?.draw();

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

    addTiledMap(
      k,
      {
        ...createMapFixture(),
        layers: [
          {
            ...createMapFixture().layers[0],
            data: [0xe0000001, 0, 0, 0],
          },
        ],
      },
      { sprite: 'tileset' },
    );

    const renderer = add.mock.results[0]?.value as { components: unknown[] };
    const drawComp = renderer.components.find(
      (component): component is { draw: () => void } =>
        typeof component === 'object' &&
        component !== null &&
        'draw' in component &&
        typeof component.draw === 'function',
    );

    drawComp?.draw();

    expect(drawSprite).toHaveBeenCalledWith(
      expect.objectContaining({
        angle: 270,
        flipX: true,
        flipY: false,
      }),
    );
  });

  it('throws when a map asset key is missing', () => {
    const { getAsset, k } = createContext();
    getAsset.mockReturnValue(null);

    expect(() => {
      addTiledMap(k, 'missing-level', { sprite: 'tileset' });
    }).toThrow('Tiled map asset "missing-level" is not loaded.');
  });

  it('throws when a map asset key is not ready yet', () => {
    const { getAsset, k } = createContext();
    getAsset.mockReturnValue({ data: null });

    expect(() => {
      addTiledMap(k, 'loading-level', { sprite: 'tileset' });
    }).toThrow('Tiled map asset "loading-level" is not ready yet.');
  });

  it('skips invisible object layers and invisible objects', () => {
    const { add, k } = createContext();

    addTiledMap(k, createObjectMapFixture() as TiledMap, {
      objects: [
        {
          comps: () => ['door'],
          match: { layer: 'Objects', name: 'Door', type: 'trigger' },
        },
      ],
      sprite: 'tileset',
    });

    expect(add).toHaveBeenCalledTimes(2);
  });

  it('does not spawn objects when object rules fail layer, name, or type matching', () => {
    const { add, k } = createContext();

    addTiledMap(k, createObjectMapFixture() as TiledMap, {
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

    expect(add).toHaveBeenCalledOnce();
  });

  it('does not spawn object objects when object rules fail layer matching', () => {
    const { k } = createContext();
    const parsedMap = parseTiledMap(createObjectMapFixture());
    const objects = createMatchedObjectObjects(k, parsedMap, {
      objects: [
        {
          comps: () => ['wrong-layer'],
          match: { layer: 'Missing' },
        },
      ],
      sprite: 'tileset',
    });

    expect(objects).toHaveLength(0);
  });

  it('skips invisible object layers and objects in the object matcher helper', () => {
    const { k } = createContext();
    const parsedMap = parseTiledMap(createObjectMapFixture());
    const objects = createMatchedObjectObjects(k, parsedMap, {
      objects: [
        {
          comps: () => ['door'],
          match: { layer: 'Objects', name: 'Door', type: 'trigger' },
        },
      ],
      sprite: 'tileset',
    });

    expect(objects).toHaveLength(1);
  });
});
