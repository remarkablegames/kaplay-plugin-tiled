# kaplay-plugin-tiled

[![NPM](https://nodei.co/npm/kaplay-plugin-tiled.svg)](https://www.npmjs.com/package/kaplay-plugin-tiled)

[![NPM version](https://img.shields.io/npm/v/kaplay-plugin-tiled.svg)](https://www.npmjs.com/package/kaplay-plugin-tiled)
[![build](https://github.com/remarkablegames/kaplay-plugin-tiled/actions/workflows/build.yml/badge.svg)](https://github.com/remarkablegames/kaplay-plugin-tiled/actions/workflows/build.yml)
[![codecov](https://codecov.io/gh/remarkablegames/kaplay-plugin-tiled/graph/badge.svg?token=E7kjfLCpkM)](https://codecov.io/gh/remarkablegames/kaplay-plugin-tiled)

Kaplay Plugin Template

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
import { examplePlugin } from 'kaplay-plugin-tiled';

const k = kaplay({
  plugins: [examplePlugin()],
});

k.example();
```

To expose `example` on the window, enable the `global` option:

```ts
const k = kaplay({
  plugins: [examplePlugin({ global: true })],
});

example();
```

To load the plugin using a script:

```html
<script src="https://unpkg.com/kaplay@latest/dist/kaplay.js"></script>
<script src="https://unpkg.com/kaplay-plugin-tiled@latest/dist/plugin.umd.js"></script>

<script>
  const k = kaplay({
    plugins: [window['kaplay-plugin-tiled'].examplePlugin()],
  });

  k.example();
</script>
```

## Release

Release is automated with [Release Please](https://github.com/googleapis/release-please).

## License

[MIT](https://github.com/remarkablegames/kaplay-plugin-tiled/blob/master/LICENSE)
