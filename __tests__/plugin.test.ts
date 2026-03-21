import type { KAPLAYCtx } from 'kaplay';

import { examplePlugin } from '../src/plugin';

function noop() {
  // pass
}

describe('plugin', () => {
  const log = vi.fn();
  const k = {
    debug: {
      log,
    },
  } as unknown as KAPLAYCtx;

  afterEach(() => {
    vi.clearAllMocks();
    globalThis.example = noop;
  });

  it('logs the template name', () => {
    examplePlugin()(k).example();

    expect(log).toHaveBeenCalledExactlyOnceWith('kaplay-plugin-template');
  });

  it('registers example on globalThis when global is enabled', () => {
    examplePlugin({ global: true })(k);

    expect(globalThis.example).toBeTypeOf('function');

    globalThis.example();

    expect(log).toHaveBeenCalledExactlyOnceWith('kaplay-plugin-template');
  });
});
