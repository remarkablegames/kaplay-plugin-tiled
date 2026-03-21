import type { Comp, CompList, KAPLAYCtx, Quad } from 'kaplay';

export class MockRect {
  constructor(
    public pos: { x: number; y: number },
    public width: number,
    public height: number,
  ) {}
}

export function createMapFixture() {
  return {
    height: 2,
    infinite: false,
    layers: [
      {
        data: [1, 0, 2, 3],
        height: 2,
        name: 'Ground',
        opacity: 0.5,
        type: 'tilelayer',
        visible: true,
        width: 2,
        x: 0,
        y: 0,
      },
      {
        data: [0, 0, 0, 0],
        height: 2,
        name: 'Hidden',
        type: 'tilelayer',
        visible: false,
        width: 2,
        x: 0,
        y: 0,
      },
    ],
    orientation: 'orthogonal',
    tileheight: 16,
    tilesets: [
      {
        columns: 2,
        firstgid: 1,
        image: 'tileset.png',
        imageheight: 32,
        imagewidth: 32,
        margin: 0,
        name: 'tileset',
        spacing: 0,
        tilecount: 4,
        tileheight: 16,
        tiles: [
          {
            id: 1,
            properties: [{ name: 'collides', type: 'bool', value: true }],
          },
        ],
        tilewidth: 16,
      },
    ],
    tilewidth: 16,
    width: 2,
  };
}

export function createObjectMapFixture() {
  return {
    height: 1,
    infinite: false,
    layers: [
      {
        data: [1],
        height: 1,
        name: 'Ground',
        type: 'tilelayer',
        visible: true,
        width: 1,
        x: 0,
        y: 0,
      },
      {
        id: 2,
        name: 'Objects',
        objects: [
          {
            height: 16,
            id: 1,
            name: 'Door',
            properties: [{ name: 'kind', value: 'door' }],
            rotation: 0,
            type: 'trigger',
            visible: true,
            width: 16,
            x: 10,
            y: 20,
          },
          {
            height: 16,
            id: 2,
            name: 'Hidden Door',
            rotation: 0,
            type: 'trigger',
            visible: false,
            width: 16,
            x: 30,
            y: 20,
          },
        ],
        type: 'objectgroup',
        visible: true,
        x: 0,
        y: 0,
      },
      {
        id: 3,
        name: 'Hidden Objects',
        objects: [
          {
            height: 16,
            id: 3,
            name: 'Ignored',
            rotation: 0,
            type: 'trigger',
            visible: true,
            width: 16,
            x: 40,
            y: 20,
          },
        ],
        type: 'objectgroup',
        visible: false,
        x: 0,
        y: 0,
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
  };
}

export function createOrderedLayerMapFixture() {
  return {
    height: 1,
    infinite: false,
    layers: [
      {
        data: [1],
        height: 1,
        name: 'Background',
        type: 'tilelayer',
        visible: true,
        width: 1,
        x: 0,
        y: 0,
      },
      {
        id: 2,
        name: 'Objects',
        objects: [
          {
            height: 16,
            id: 1,
            name: 'Door',
            rotation: 0,
            type: 'trigger',
            visible: true,
            width: 16,
            x: 10,
            y: 20,
          },
        ],
        type: 'objectgroup',
        visible: true,
        x: 0,
        y: 0,
      },
      {
        data: [1],
        height: 1,
        name: 'Foreground',
        type: 'tilelayer',
        visible: true,
        width: 1,
        x: 0,
        y: 0,
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
  };
}

export function createContext() {
  const add = vi.fn((components: CompList<unknown>) => ({ components }));
  const anchor = vi.fn((value: string) => ({ type: 'anchor', value }));
  const area = vi.fn((options?: object) => ({ options, type: 'area' }));
  const body = vi.fn((options: object) => ({ options, type: 'body' }));
  const drawSprite = vi.fn();
  const getAsset = vi.fn();
  const pos = vi.fn((x: number, y: number) => ({ type: 'pos', x, y }));
  const quad = vi.fn(
    (x: number, y: number, width: number, height: number): Quad =>
      ({ h: height, w: width, x, y }) as unknown as Quad,
  );
  const vec2 = vi.fn((x: number, y: number) => ({ x, y }));
  const z = vi.fn((value: number) => ({ type: 'z', value }));

  const k = {
    Rect: MockRect,
    add,
    anchor,
    area,
    body,
    drawSprite,
    getAsset,
    pos,
    quad,
    vec2,
    z,
  } as unknown as KAPLAYCtx;

  return { add, area, body, drawSprite, getAsset, k, pos, quad, vec2 };
}

export function getDrawComponent(renderer: {
  components: CompList<unknown>;
}): Comp {
  const drawComp = renderer.components.find(
    (component): component is Comp =>
      typeof component === 'object' &&
      component !== null &&
      'draw' in component &&
      typeof component.draw === 'function',
  );

  if (!drawComp) {
    throw new Error('Expected renderer draw component.');
  }

  return drawComp;
}

export function getAddedObject(
  add: ReturnType<typeof vi.fn>,
  index: number,
): {
  components: CompList<unknown>;
} {
  const result = add.mock.results[index];

  if (result.type !== 'return' || !result.value) {
    throw new Error(`Expected add() call result at index ${String(index)}.`);
  }

  return result.value as { components: CompList<unknown> };
}

export function getZComponent(object: { components: CompList<unknown> }): {
  type: 'z';
  value: number;
} {
  const zComp = object.components.find(
    (
      component,
    ): component is {
      type: 'z';
      value: number;
    } =>
      typeof component === 'object' &&
      component !== null &&
      'type' in component &&
      component.type === 'z' &&
      'value' in component &&
      typeof component.value === 'number',
  );

  if (!zComp) {
    throw new Error('Expected z component.');
  }

  return zComp;
}
