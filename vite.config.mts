import { copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/plugin.ts'),
      name: 'kaplay-plugin-tiled',
      formats: ['cjs', 'es', 'umd'],
      fileName: (format) => {
        switch (format) {
          case 'cjs':
            return 'plugin.cjs';
          case 'es':
            return 'plugin.mjs';
          case 'umd':
            return 'plugin.umd.js';
          default:
            return `plugin.${format}.js`;
        }
      },
    },
    rollupOptions: {
      external: ['kaplay'],
    },
    sourcemap: true,
  },

  plugins: [
    dts({
      include: ['src'],
      rollupTypes: true,
      async afterBuild() {
        const outDir = resolve(import.meta.dirname, 'dist');
        await Promise.all(
          ['cts', 'mts'].map((extension) =>
            copyFile(
              resolve(outDir, 'plugin.d.ts'),
              resolve(outDir, `plugin.d.${extension}`),
            ),
          ),
        );
      },
    }),
  ],

  test: {
    globals: true,
    coverage: {
      include: ['src/**/*.ts'],
      thresholds: {
        100: true,
      },
    },
  },
});
