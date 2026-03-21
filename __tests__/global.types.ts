import '../global';
import '../src/plugin';

type AddTiledMap = NonNullable<typeof addTiledMap>;

export function assertGlobalTyping() {
  const assertAddTiledMap = (addTiledMap: AddTiledMap) => {
    addTiledMap('level', {
      sprite: 'tileset',
    });
  };

  void assertAddTiledMap;
}

export function assertMixedImportTyping() {
  return addTiledMap;
}
