import level from '../example/level.json';
import { addTiledMap, type TiledMap, tiledPlugin } from '../src/plugin';
import {
  createContext,
  createMapFixture,
  getAddedObject,
  getDrawComponent,
} from './test-helpers';

describe('addTiledMap', () => {
  it('parses the repo fixture and creates one renderer per visible layer', () => {
    const { add, k } = createContext();

    addTiledMap(k, level as TiledMap, { sprite: 'tileset' });

    expect(add).toHaveBeenCalledTimes(3);
    expect(add).toHaveBeenCalled();
  });

  it('renders tiles through one layer renderer', () => {
    const { add, drawSprite, k, quad } = createContext();

    addTiledMap(k, createMapFixture(), { sprite: 'tileset' });

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
    getAsset.mockReturnValue({ data: createMapFixture() });

    addTiledMap(k, 'level', { sprite: 'tileset' });

    expect(getAsset).toHaveBeenCalledWith('level');
    expect(add).toHaveBeenCalledOnce();
  });

  it('uses the default visual path when opacity and colliders are absent', () => {
    const { add, area, body, drawSprite, k } = createContext();

    addTiledMap(
      k,
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
});

describe('tiledPlugin', () => {
  it('binds addTiledMap to the KAPLAY context', () => {
    const { add, k } = createContext();
    const api = tiledPlugin(k);

    api.addTiledMap(createMapFixture(), { sprite: 'tileset' });

    expect(add).toHaveBeenCalled();
  });
});
