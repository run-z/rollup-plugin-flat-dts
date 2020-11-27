import { promises as fs } from 'fs';
import { dirname, resolve } from 'path';
import ts from 'typescript';
import type { FlatDts } from '../api';

/**
 * @internal
 */
const FORMAT_HOST: ts.FormatDiagnosticsHost = {
  getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
  getNewLine: () => ts.sys.newLine,
  getCanonicalFileName: ts.sys.useCaseSensitiveFileNames ? f => f : f => f.toLowerCase(),
};

/**
 * @internal
 */
export function formatDiagnostics(this: FlatDts): string {
  return this.diagnostics.length
      ? ts.formatDiagnosticsWithColorAndContext(this.diagnostics, FORMAT_HOST)
      : '';
}

/**
 * @internal
 */
export function dtsFile(path: string, content: string): FlatDts.File {
  return {
    path,
    content,
    async writeOut(filePath = path) {
      await fs.mkdir(dirname(filePath), { recursive: true });
      return fs.writeFile(filePath, content);
    },
  };
}

/**
 * @internal
 */
export function emptyDts(diagnostics: readonly ts.Diagnostic[]): FlatDts {
  return {
    files: [],
    diagnostics,
    formatDiagnostics,
    writeOut() {
      return Promise.reject(new Error('Failed to emit type definitions'));
    },
  };
}

/**
 * @internal
 */
export function flatDts(
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

