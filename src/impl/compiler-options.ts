import path from 'path';
import ts from 'typescript';
import type { FlatDts } from '../api';

/**
 * @internal
 */
const MANDATORY_COMPILER_OPTIONS: ts.CompilerOptions = {
  // Avoid extra work
  checkJs: false,
  // Ensure ".d.ts" modules are generated
  declaration: true,
  // Prevent output to declaration directory
  declarationDir: undefined,
  // Source maps unsupported
  declarationMap: false,
  // Skip ".js" generation
  emitDeclarationOnly: true,
  // Single file emission is impossible with this flag set
  isolatedModules: false,
  // Generate single file
  module: ts.ModuleKind.None,
  // Always emit
  noEmit: false,
  // Skip code generation when error occurs
  noEmitOnError: true,
  // Ensure TS2742 errors are visible
  preserveSymlinks: true,
  // Ignore errors in library type definitions
  skipLibCheck: true,
  // Always strip internal exports
  stripInternal: true,
};

/**
 * @internal
 */
export function readCompilerOptions(
    {
      tsconfig = 'tsconfig.json',
      compilerOptions = {},
    }: FlatDts.Options,
): {
  readonly compilerOptions: ts.CompilerOptions;
  readonly files: readonly string[];
  readonly errors: ts.Diagnostic[];
} {
  compilerOptions = { ...compilerOptions, ...MANDATORY_COMPILER_OPTIONS };

  let dirName = path.dirname(tsconfig);
  const configPath = ts.findConfigFile(dirName, ts.sys.fileExists, tsconfig);

  if (!configPath) {
    return { compilerOptions, files: [], errors: [] };
  }

  dirName = path.dirname(configPath);

  const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);

  if (error) {
    return { compilerOptions, files: [], errors: [error] };
  }

  const { options, errors, fileNames: files } = ts.parseJsonConfigFileContent(config, ts.sys, dirName);

  return {
    compilerOptions: {
      ...options,
      ...compilerOptions,
    },
    files,
    errors,
  };
}
