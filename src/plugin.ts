/**
 * @packageDocumentation
 * @module rollup-plugin-flat-dts
 */
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

    async generateBundle(): Promise<void> {

      const dts = await emitFlatDts(dtsOptions);

      if (dts.diagnostics.length) {
        this.error(dts.formatDiagnostics());
      }

      dts.files.forEach(({ path, content }) => {
        this.emitFile({
          type: 'asset',
          fileName: path,
          source: content,
        });
      });
    },
  };
}
