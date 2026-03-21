import level from '../example/level.json';
import { type TiledMap, tiledPlugin } from '../src/plugin';
import {
  createContext,
  createMapFixture,
  createObjectMapFixture,
  createOrderedLayerMapFixture,
  getAddedObject,
  getDrawComponent,
  getZComponent,
} from './test-helpers';

describe('addTiledMap', () => {
  it('parses the repo fixture and creates one renderer per visible layer', () => {
    const { add, k } = createContext();
    const api = tiledPlugin(k);

    api.addTiledMap(level as TiledMap, { sprite: 'tileset' });

    expect(add).toHaveBeenCalledTimes(3);
    expect(add).toHaveBeenCalled();
  });

  it('renders tiles through one layer renderer', () => {
    const { add, drawSprite, k, quad } = createContext();
    const api = tiledPlugin(k);

    api.addTiledMap(createMapFixture(), { sprite: 'tileset' });

    expect(add).toHaveBeenCalledTimes(1);

    const renderer = getAddedObject(add, 0);
    const drawComp = getDrawComponent(renderer);
    drawComp.draw?.();

    expect(drawSprite).toHaveBeenCalledTimes(3);
    expect(quad).toHaveBeenNthCalledWith(1, 0, 0, 0.5, 0.5);
    expect(drawSprite).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        angle: 0,
        flipX: false,
        flipY: false,
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

  it('accepts a loaded asset key for the map source', () => {
    const { add, getAsset, k } = createContext();
    const api = tiledPlugin(k);
    getAsset.mockReturnValue({ data: createMapFixture() });

    api.addTiledMap('level', { sprite: 'tileset' });

    expect(getAsset).toHaveBeenCalledWith('level');
    expect(add).toHaveBeenCalledOnce();
  });

  it('uses the default visual path when opacity and colliders are absent', () => {
    const { add, area, body, drawSprite, k } = createContext();
    const api = tiledPlugin(k);

    api.addTiledMap(
      {
        height: 1,
        infinite: false,
        layers: [
          {
            data: [1],
            height: 1,
            name: 'Ground',
            type: 'tilelayer',
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

    const renderer = getAddedObject(add, 0);
    getDrawComponent(renderer).draw?.();

    expect(add).toHaveBeenCalledOnce();
    expect(drawSprite).toHaveBeenCalledOnce();
    expect(area).not.toHaveBeenCalled();
    expect(body).not.toHaveBeenCalled();
  });

  it('filters layers when layerNames are provided', () => {
    const { add, k } = createContext();
    const api = tiledPlugin(k);

    api.addTiledMap(createMapFixture(), {
      layerNames: ['Missing'],
      sprite: 'tileset',
    });

    expect(add).not.toHaveBeenCalled();
  });

  it('treats an empty layerNames filter like no filter', () => {
    const { add, k } = createContext();
    const api = tiledPlugin(k);

    api.addTiledMap(createMapFixture(), {
      layerNames: [],
      sprite: 'tileset',
    });

    expect(add).toHaveBeenCalledOnce();
  });

  it('skips invisible layers', () => {
    const { add, k } = createContext();
    const api = tiledPlugin(k);

    api.addTiledMap(
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

  it('throws when a tile gid is outside the supported tileset range', () => {
    const { k } = createContext();
    const api = tiledPlugin(k);
    const map = createMapFixture();

    expect(() => {
      api.addTiledMap(
        {
          ...map,
          layers: [
            {
              ...map.layers[0],
              data: [99, 0, 0, 0],
            },
            ...map.layers.slice(1),
          ],
        },
        { sprite: 'tileset' },
      );
    }).toThrow('Tile gid 99 is outside the supported tileset range.');
  });

  it('skips invisible object layers and invisible objects', () => {
    const { add, k } = createContext();
    const api = tiledPlugin(k);

    api.addTiledMap(createObjectMapFixture() as TiledMap, {
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

  it('preserves Tiled layer order for object and tile z indices', () => {
    const { add, k } = createContext();
    const api = tiledPlugin(k);

    api.addTiledMap(createOrderedLayerMapFixture() as TiledMap, {
      objects: [
        {
          comps: () => ['door'],
          match: { layer: 'Objects', name: 'Door', type: 'trigger' },
        },
      ],
      sprite: 'tileset',
    });

    expect(getZComponent(getAddedObject(add, 0)).value).toBe(0);
    expect(getZComponent(getAddedObject(add, 1)).value).toBe(1);
    expect(getZComponent(getAddedObject(add, 2)).value).toBe(2);
  });

  it('applies layerNames to object layers as well as tile layers', () => {
    const { add, k } = createContext();
    const api = tiledPlugin(k);

    api.addTiledMap(createOrderedLayerMapFixture() as TiledMap, {
      layerNames: ['Background'],
      objects: [
        {
          comps: () => ['door'],
          match: { layer: 'Objects', name: 'Door', type: 'trigger' },
        },
      ],
      sprite: 'tileset',
    });

    expect(add).toHaveBeenCalledOnce();
    expect(getZComponent(getAddedObject(add, 0)).value).toBe(0);
  });
});

describe('tiledPlugin', () => {
  it('binds addTiledMap to the KAPLAY context', () => {
    const { add, k } = createContext();
    const api = tiledPlugin(k);

    api.addTiledMap(createMapFixture(), { sprite: 'tileset' });

    expect(add).toHaveBeenCalled();
  });
});
