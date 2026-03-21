import type { KAPLAYCtx } from 'kaplay';

import { examplePlugin } from '../dist/plugin.mjs';

describe('dist/plugin.mjs', () => {
  it('adds example', () => {
    const log = vi.fn();
    const k = {
      debug: {
        log,
      },
    } as unknown as KAPLAYCtx;

    examplePlugin()(k).example();

    expect(log).toHaveBeenCalledExactlyOnceWith('kaplay-plugin-tiled');
  });
});
