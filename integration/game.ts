import kaplay from 'kaplay';

import { tiledPlugin } from '../src/plugin';
import level from './level.json';
import tilesetUrl from './tileset.png';

const k = kaplay({
  plugins: [tiledPlugin()],
});

k.debug.inspect = true;

k.loadSprite('tileset', tilesetUrl);
k.loadSprite('bean', 'https://kaboomjs.com/sprites/bean.png');

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
          'wall',
        ],
      },
    ],
  });

  const player = k.add([
    k.sprite('bean'),
    k.pos(k.center()),
    k.area(),
    k.body(),
  ]);
  const SPEED = 320;

  k.onKeyDown((key) => {
    switch (key) {
      case 'left':
      case 'a':
        player.move(-SPEED, 0);
        break;

      case 'right':
      case 'd':
        player.move(SPEED, 0);
        break;

      case 'up':
      case 'w':
        player.move(0, -SPEED);
        break;

      case 'down':
      case 's':
        player.move(0, SPEED);
        break;
    }
  });
});
