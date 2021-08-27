import path from 'path';
import ts from 'typescript';
import { pathToFileURL, URL } from 'url';
import type { FlatDts } from '../api';

const MANDATORY_COMPILER_OPTIONS: ts.CompilerOptions = {
  // Avoid extra work
  checkJs: false,
  // Ensure ".d.ts" modules are generated
  declaration: true,
  // Prevent output to declaration directory
  declarationDir: undefined!,
  // Skip ".js" generation
  emitDeclarationOnly: true,
  // Single file emission is impossible with this flag set
  isolatedModules: false,
  // Generate single file
  // `System`, in contrast to `None`, permits the use of `import.meta`
  module: ts.ModuleKind.System,
  // Always emit
  noEmit: false,
  // Skip code generation when error occurs
  noEmitOnError: true,
  // Ignore errors in library type definitions
  skipLibCheck: true,
  // Always strip internal exports
  stripInternal: true,
};

export class DtsSetup {

  readonly compilerOptions: Readonly<ts.CompilerOptions>;
  readonly files: readonly string[];
  readonly errors: readonly ts.Diagnostic[];
  readonly scriptTarget: ts.ScriptTarget;
  readonly eol: string;

  constructor(readonly dtsOptions: FlatDts.Options) {

    const { tsconfig = 'tsconfig.json', file: dtsFile = 'index.d.ts' } = dtsOptions;
    let { compilerOptions = {} } = dtsOptions;

    compilerOptions = { ...compilerOptions, ...MANDATORY_COMPILER_OPTIONS };

    delete compilerOptions.outDir;
    compilerOptions.outFile = dtsFile;
    this.scriptTarget = scriptTarget(compilerOptions);

    this.eol = eolString(compilerOptions);

    let dirName = path.dirname(tsconfig);
    const configPath = ts.findConfigFile(dirName, ts.sys.fileExists, tsconfig);

    if (!configPath) {
      this.compilerOptions = compilerOptions;
      this.files = [];
      this.errors = [];
    } else {

      dirName = path.dirname(configPath);

      const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);

      if (error) {
        this.compilerOptions = compilerOptions;
        this.files = [];
        this.errors = [error];
      } else {

        const { options, errors, fileNames: files } = ts.parseJsonConfigFileContent(config, ts.sys, dirName);

        this.compilerOptions = {
          ...options,
          ...compilerOptions,
        };
        this.files = files;
        this.errors = errors;
      }
    }
  }

  sourceURL(path: string): URL {
    return new URL(path, this.root());
  }

  root(): URL {
    return pathToFileURL('./');
  }

  relativePath(path: string): string {

    const cwd = this.root();
    const { href: cwdHref } = cwd;
    const { href } = new URL(path, cwd);

    if (!href.startsWith(cwdHref)) {
      return path;
    }

    return href.substr(cwdHref.length);
  }

  basename(path: string): string {

    const idx = path.lastIndexOf('/');

    return idx < 0 ? path : path.substr(idx + 1);
  }

  pathToRoot(path: string): string {

    const cwd = this.root();
    const { href: cwdHref } = cwd;
    const { href } = new URL(path, cwd);

    if (!href.startsWith(cwdHref)) {
      return path;
    }

    let relative = href.substr(cwdHref.length);
    let result = '';

    for (;;) {

      const idx = relative.lastIndexOf('/');

      if (idx < 0) {
        break;
      }

      if (result) {
        result += '/..';
      } else {
        result = '..';
      }

      relative = relative.substr(0, idx);
    }

    return result;
  }

}

function scriptTarget(compilerOptions: ts.CompilerOptions): ts.ScriptTarget {

  let { target } = compilerOptions;

  if (!target) {
    // Set target to latest if absent
    compilerOptions.target = target = ts.ScriptTarget.Latest;
  }

  return target;
}

function eolString({ newLine }: ts.CompilerOptions): string {
  switch (newLine) {
  case ts.NewLineKind.LineFeed:
    return '\n';
  case ts.NewLineKind.CarriageReturnLineFeed:
    return '\r\n';
  default:
    return ts.sys.newLine;
  }
}
