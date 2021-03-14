import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import { builtinModules } from 'module';
import path from 'path';
import sourcemaps from 'rollup-plugin-sourcemaps';
import ts from 'rollup-plugin-typescript2';
import typescript from 'typescript';
import pkg from './package.json';

export default {
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
  external: [
    ...Object.keys(pkg.peerDependencies),
    ...Object.keys(pkg.dependencies),
    ...builtinModules,
  ],
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
};
