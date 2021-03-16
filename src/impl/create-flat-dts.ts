import { resolve } from 'path';
import ts from 'typescript';
import type { FlatDts } from '../api';

const FORMAT_HOST: ts.FormatDiagnosticsHost = {
  getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
  getNewLine: () => ts.sys.newLine,
  getCanonicalFileName: ts.sys.useCaseSensitiveFileNames ? f => f : f => f.toLowerCase(),
};

function formatDiagnostics(this: FlatDts): string {
  return this.diagnostics.length
      ? ts.formatDiagnosticsWithColorAndContext(this.diagnostics, FORMAT_HOST)
      : '';
}

export function emptyFlatDts(diagnostics: readonly ts.Diagnostic[]): FlatDts {
  return {
    files: [],
    diagnostics,
    formatDiagnostics,
    writeOut() {
      return Promise.reject(new Error('Failed to emit type definitions'));
    },
  };
}

export function createFlatDts(
    files: readonly FlatDts.File[],
    diagnostics: readonly ts.Diagnostic[] = [],
): FlatDts {
  return {
    files,
    diagnostics,
    formatDiagnostics,
    writeOut(rootDir) {

      const filePath: (file: FlatDts.File) => string | undefined = rootDir != null
          ? ({ path }) => resolve(rootDir, path)
          : ({ path }) => path;

      return Promise.all(files.map(file => file.writeOut(filePath(file)))).then(() => void 0);
    },
  };
}

