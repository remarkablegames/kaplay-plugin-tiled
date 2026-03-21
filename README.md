# kaplay-plugin-tiled

[![NPM](https://nodei.co/npm/kaplay-plugin-tiled.svg)](https://www.npmjs.com/package/kaplay-plugin-tiled)

[![NPM version](https://img.shields.io/npm/v/kaplay-plugin-tiled.svg)](https://www.npmjs.com/package/kaplay-plugin-tiled)
[![build](https://github.com/remarkablegames/kaplay-plugin-tiled/actions/workflows/build.yml/badge.svg)](https://github.com/remarkablegames/kaplay-plugin-tiled/actions/workflows/build.yml)
[![codecov](https://codecov.io/gh/remarkablegames/kaplay-plugin-tiled/graph/badge.svg?token=WriHyIpFCh)](https://codecov.io/gh/remarkablegames/kaplay-plugin-tiled)

[KAPLAY](https://kaplayjs.com/) plugin for loading finite orthogonal [Tiled](https://www.mapeditor.org/) JSON maps.

## Prerequisites

Install [kaplay](https://www.npmjs.com/package/kaplay):

```sh
npm install kaplay
```

## Install

[NPM](https://www.npmjs.com/package/kaplay-plugin-tiled):

```sh
npm install kaplay-plugin-tiled
```

[CDN](https://unpkg.com/browse/kaplay-plugin-tiled/):

```html
<script src="https://unpkg.com/kaplay-plugin-tiled@latest/dist/plugin.umd.js"></script>
```

## Usage

Use the plugin in your game:

```ts
import kaplay from 'kaplay';
import { tiledPlugin } from 'kaplay-plugin-tiled';

import level from './level.json';
import tilesetUrl from './tileset.png';

const k = kaplay({
  plugins: [tiledPlugin()],
});

k.loadSprite('tileset', tilesetUrl);

k.onLoad(() => {
  k.addTiledMap(level, {
    sprite: 'tileset',
    objects: [
      {
        match: { properties: { collides: true } },
        comps: ({ objectSize }) => [
          k.area({
            shape: new k.Rect(k.vec2(), objectSize.width, objectSize.height),
          }),
          k.body({ isStatic: true }),
        ],
      },
    ],
  });
});
```

The current implementation is intentionally small:

- finite orthogonal Tiled JSON only
- 1 tileset per map
- visible tile layers plus optional `tiles` and `objects` matchers for extra spawned components

To load the plugin using a script:

```html
<script src="https://unpkg.com/kaplay@latest/dist/kaplay.js"></script>
<script src="https://unpkg.com/kaplay-plugin-tiled@latest/dist/plugin.umd.js"></script>

<script>
  const k = kaplay({
    plugins: [window['kaplay-plugin-tiled'].tiledPlugin()],
  });
</script>
```

## Release

Release is automated with [Release Please](https://github.com/googleapis/release-please).

## License

[MIT](https://github.com/remarkablegames/kaplay-plugin-tiled/blob/master/LICENSE)
