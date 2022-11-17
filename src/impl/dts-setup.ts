import path from 'node:path';
import process from 'node:process';
import { pathToFileURL, URL } from 'node:url';
import ts, { type Diagnostic } from 'typescript';
import type { FlatDts } from '../api';

export class DtsSetup {

  readonly compilerOptions: Readonly<ts.CompilerOptions>;
  readonly files: readonly string[];
  readonly errors: readonly ts.Diagnostic[];
  readonly scriptTarget: ts.ScriptTarget;
  readonly eol: string;

  constructor(readonly dtsOptions: FlatDts.Options) {
    const { compilerOptions, files, errors } = parseDtsOptions(dtsOptions);

    this.compilerOptions = compilerOptions;
    this.files = files;
    this.errors = errors;

    this.scriptTarget = detectScriptTarget(compilerOptions);
    this.eol = detectEOL(compilerOptions);
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

    return href.slice(cwdHref.length);
  }

  basename(path: string): string {
    const idx = path.lastIndexOf('/');

    return idx < 0 ? path : path.slice(idx + 1);
  }

  pathToRoot(path: string): string {
    const cwd = this.root();
    const { href: cwdHref } = cwd;
    const { href } = new URL(path, cwd);

    if (!href.startsWith(cwdHref)) {
      return path;
    }

    let relative = href.slice(cwdHref.length);
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

      relative = relative.slice(0, idx);
    }

    return result;
  }

}

function parseDtsOptions(dtsOptions: FlatDts.Options): {
  readonly compilerOptions: Readonly<ts.CompilerOptions>;
  readonly files: readonly string[];
  readonly errors: readonly ts.Diagnostic[];
} {
  const { tsconfig = 'tsconfig.json', file: outFile = 'index.d.ts' } = dtsOptions;
  let { compilerOptions = {} } = dtsOptions;

  compilerOptions = {
    ...compilerOptions,
    ...MANDATORY_COMPILER_OPTIONS,
    outDir: undefined,
    outFile,
  };

  let dirName: string;
  let tsconfigFile: string | undefined;
  let tsconfigJson: unknown;

  if (typeof tsconfig !== 'string') {
    dirName = process.cwd();
    tsconfigJson = tsconfig;
  } else {
    dirName = path.dirname(tsconfig);
    tsconfigFile = path.basename(tsconfig);

    const configPath = ts.findConfigFile(dirName, ts.sys.fileExists, tsconfig);

    if (!configPath) {
      return { compilerOptions, files: [], errors: [] };
    }

    dirName = path.dirname(configPath);

    const {
      config,
      error,
    }: {
      readonly config?: unknown;
      readonly error?: Diagnostic;
    } = ts.readConfigFile(configPath, ts.sys.readFile);

    if (error) {
      return { compilerOptions, files: [], errors: [error] };
    }

    tsconfigJson = config;
  }

  const {
    options,
    errors,
    fileNames: files,
  } = ts.parseJsonConfigFileContent(tsconfigJson, ts.sys, dirName, undefined, tsconfigFile);

  return {
    compilerOptions: {
      ...options,
      ...compilerOptions,
    },
    files,
    errors,
  };
}

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

function detectScriptTarget(compilerOptions: ts.CompilerOptions): ts.ScriptTarget {
  let { target } = compilerOptions;

  if (!target) {
    // Set target to latest if absent
    compilerOptions.target = target = ts.ScriptTarget.Latest;
  }

  return target;
}

function detectEOL({ newLine }: ts.CompilerOptions): string {
  switch (newLine) {
    case ts.NewLineKind.LineFeed:
      return '\n';
    case ts.NewLineKind.CarriageReturnLineFeed:
      return '\r\n';
    default:
      return ts.sys.newLine;
  }
}
