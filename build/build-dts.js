import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { emitFlatDts } from 'rollup-plugin-flat-dts/api';

const moduleFile = fileURLToPath(import.meta.url);
const moduleDir = path.dirname(moduleFile);
const rootDir = path.normalize(path.join(moduleDir, '..'));

emitFlatDts({
  tsconfig: path.join(rootDir, 'tsconfig.json'),
  moduleName: 'rollup-plugin-flat-dts',
  lib: true,
  compilerOptions: {
    declarationMap: true,
  },
  file: 'dist/flat-dts.plugin.d.ts',
  entries: {
    api: { file: 'dist/flat-dts.api.d.ts' },
  },
  internal: 'impl',
})
  .then(flatDts => {
    if (flatDts.diagnostics.length) {
      console.error(flatDts.formatDiagnostics());
    }

    return flatDts.writeOut();
  })
  .catch(error => {
    console.error('Failed to generate type definitions', error);
    process.exit(1);
  });
