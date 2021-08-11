/**
 * @packageDocumentation
 * @module Module rollup-plugin-flat-dts
 */
import { relative, resolve } from 'path';
import type { OutputPlugin } from 'rollup';
import type { FlatDts } from './api';
import { emitFlatDts } from './api';

export type { FlatDts };

/**
 * Creates type definitions flattening plugin instance.
 *
 * @param dtsOptions - Type definition flattening options.
 *
 * @returns Rollup output plugin instance.
 */
export default function flatDtsPlugin(dtsOptions?: FlatDts.Options): OutputPlugin {
  return {

    name: 'flat-dts',

    async generateBundle({ dir }): Promise<void> {

      let assetPath = (filePath: string): string => filePath;

      if (dir != null) {
        dtsOptions = dtsOptionsRelativeToDir(dir, dtsOptions);
        assetPath = filePath => relative(dir, filePath);
      }

      const dts = await emitFlatDts(dtsOptions);

      if (dts.diagnostics.length) {
        this.error(dts.formatDiagnostics());
      }

      dts.files.forEach(({ path, content }) => {
        this.emitFile({
          type: 'asset',
          fileName: assetPath(path),
          source: content,
        });
      });
    },
  };
}

function dtsOptionsRelativeToDir(dir: string, dtsOptions: FlatDts.Options = {}): FlatDts.Options {

  const { file = 'index.d.ts', entries = {} } = dtsOptions;

  return {
    ...dtsOptions,
    file: relative(process.cwd(), resolve(dir, file)),
    entries: Object.fromEntries(
        Object
            .entries(entries)
            .map(([key, dtsEntry = {}]) => [key, dtsEntryRelativeToDir(dir, dtsEntry)]),
    ),
  };
}

function dtsEntryRelativeToDir(dir: string, dtsEntry: FlatDts.EntryDecl = {}): FlatDts.EntryDecl {

  const { file } = dtsEntry;

  if (file == null) {
    return dtsEntry;
  }

  return {
    ...dtsEntry,
    file: relative(process.cwd(), resolve(dir, file)),
  };
}
