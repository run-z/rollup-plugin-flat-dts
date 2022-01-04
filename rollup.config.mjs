import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import { builtinModules, createRequire } from 'node:module';
import path from 'node:path';
import { defineConfig } from 'rollup';
import sourcemaps from 'rollup-plugin-sourcemaps';
import ts from 'rollup-plugin-typescript2';
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
    commonjs(),
    ts({
      typescript,
      cacheRoot: 'target/.rts2_cache',
      useTsconfigDeclarationDir: true,
    }),
    nodeResolve(),
    sourcemaps(),
  ],
  external(id) {
    return id.startsWith('node:') || externals.has(id);
  },
  manualChunks(id) {
    if (id === path.resolve('src', 'plugin.ts')) {
      return 'flat-dts.plugin';
    }

    return 'flat-dts.api';
  },
  output: [
    {
      format: 'cjs',
      sourcemap: true,
      dir: './dist',
      exports: 'auto',
      entryFileNames: '[name].cjs',
      chunkFileNames: '_[name].cjs',
      hoistTransitiveImports: false,
    },
    {
      format: 'esm',
      sourcemap: true,
      dir: '.',
      entryFileNames: 'dist/[name].js',
      chunkFileNames: 'dist/_[name].js',
      hoistTransitiveImports: false,
    },
  ],
});
