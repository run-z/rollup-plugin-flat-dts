import ts from '@rollup/plugin-typescript';
import { builtinModules, createRequire } from 'node:module';
import path from 'node:path';
import { defineConfig } from 'rollup';
import typescript from 'typescript';

const req = createRequire(import.meta.url);
const pkg = req('./package.json');
const externals = new Set([
  ...builtinModules,
  ...Object.keys(pkg.peerDependencies),
  ...Object.keys(pkg.dependencies),
]);

export default defineConfig({
  input: {
    'flat-dts.api': './src/api/index.ts',
    'flat-dts.plugin': './src/plugin.ts',
  },
  plugins: [
    ts({
      typescript,
      cacheDir: 'target/.rts_cache',
    }),
  ],
  external(id) {
    return id.startsWith('node:') || externals.has(id);
  },
  output: [
    {
      format: 'cjs',
      sourcemap: true,
      dir: '.',
      exports: 'auto',
      entryFileNames: 'dist/[name].cjs',
      chunkFileNames: 'dist/_[name].cjs',
      manualChunks,
      hoistTransitiveImports: false,
    },
    {
      format: 'esm',
      sourcemap: true,
      dir: '.',
      entryFileNames: 'dist/[name].js',
      chunkFileNames: 'dist/_[name].js',
      manualChunks,
      hoistTransitiveImports: false,
    },
  ],
});

function manualChunks(id) {
  if (id === path.resolve('src', 'plugin.ts')) {
    return 'flat-dts.plugin';
  }
  if (id.startsWith(path.resolve('src'))) {
    return 'flat-dts.api';
  }
}
