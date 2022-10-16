import { builtinModules, createRequire } from 'node:module';
import path from 'node:path';
import { defineConfig } from 'rollup';
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
    ts({
      typescript,
      cacheRoot: 'target/.rts2_cache',
      useTsconfigDeclarationDir: true,
    }),
  ],
  external(id) {
    return id.startsWith('node:') || externals.has(id);
  },
  output: [
    {
      format: 'cjs',
      sourcemap: true,
      dir: './dist',
      exports: 'auto',
      entryFileNames: '[name].cjs',
      chunkFileNames: '_[name].cjs',
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

  return 'flat-dts.api';
}
