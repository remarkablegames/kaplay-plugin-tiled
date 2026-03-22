# kaplay-plugin-tiled

[![NPM](https://nodei.co/npm/kaplay-plugin-tiled.svg)](https://www.npmjs.com/package/kaplay-plugin-tiled)

[![NPM version](https://img.shields.io/npm/v/kaplay-plugin-tiled.svg)](https://www.npmjs.com/package/kaplay-plugin-tiled)
[![build](https://github.com/remarkablegames/kaplay-plugin-tiled/actions/workflows/build.yml/badge.svg)](https://github.com/remarkablegames/kaplay-plugin-tiled/actions/workflows/build.yml)
[![codecov](https://codecov.io/gh/remarkablegames/kaplay-plugin-tiled/graph/badge.svg?token=WriHyIpFCh)](https://codecov.io/gh/remarkablegames/kaplay-plugin-tiled)

[KAPLAY](https://kaplayjs.com/) plugin for loading finite orthogonal [Tiled](https://www.mapeditor.org/) JSON maps.

Read the [blog post](https://remarkablegames.org/posts/kaplay-plugin-tiled/) or see the [demo](https://github.com/remarkablegames/kaplay-tiled-demo).

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

Import the plugin:

```ts
import kaplay from 'kaplay';
import { tiledPlugin } from 'kaplay-plugin-tiled';

kaplay({
  plugins: [tiledPlugin],
});
```

Load the assets:

```ts
import level from './level.json';
import tilesetUrl from './tileset.png';

loadSprite('tileset', tilesetUrl);
```

Render the tilemap:

```ts
addTiledMap(level, {
  sprite: 'tileset',
});
```

Or render the tilemap with objects:

```ts
addTiledMap(level, {
  sprite: 'tileset',
  objects: [
    {
      match: { properties: { collides: true } },
      comps: ({ width, height }) => [
        area({
          shape: new Rect(vec2(), width, height),
        }),
        body({ isStatic: true }),
      ],
    },
  ],
});
```

If you use TypeScript, load the ambient types explicitly:

```ts
import 'kaplay/global';
import 'kaplay-plugin-tiled/global';
```

To load the plugin using a script:

```html
<script src="https://unpkg.com/kaplay@latest/dist/kaplay.js"></script>
<script src="https://unpkg.com/kaplay-plugin-tiled@latest/dist/plugin.umd.js"></script>

<script>
  kaplay({
    plugins: [KaplayPluginTiled.tiledPlugin],
  });
</script>
```

## Release

Release is automated with [Release Please](https://github.com/googleapis/release-please).

## License

[MIT](https://github.com/remarkablegames/kaplay-plugin-tiled/blob/master/LICENSE)
