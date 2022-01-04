import path from 'node:path';
import { fileURLToPath } from 'node:url';
// eslint-disable-next-line no-restricted-imports
import { emitFlatDts } from '../dist/flat-dts.api.js';

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
  entries: {
    api: { file: 'api/index.d.ts' },
  },
  internal: 'impl',
}).then(flatDts => {
  if (flatDts.diagnostics.length) {
    console.error(flatDts.formatDiagnostics());
  }

  return flatDts.writeOut();
}).catch(error => {
  console.error('Failed to generate type definitions', error);
  process.exit(1);
});
