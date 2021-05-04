import { promises as fs } from 'fs';
import path from 'path';
import type { FlatDts } from '../api';
import type { DtsPrinter } from './dts-printer';
import type { DtsSource } from './dts-source';

const noReferredLibs: ReadonlySet<string> = (/*#__PURE__*/ new Set());

export class ModuleInfo {

  static async main(source: DtsSource): Promise<ModuleInfo> {

    const {
      source: {
        fileName: file,
      },
      setup: {
        dtsOptions: {
          moduleName = await packageName(),
          lib,
          refs = true,
        },
      },
    } = source;

    return new ModuleInfo(
        source,
        moduleName,
        {
          file,
          libs: referredLibs(source, lib),
          refs,
        },
    );
  }

  static external(source: DtsSource, name: string): ModuleInfo {
    return new ModuleInfo(source, name, 'external');
  }

  static internal(source: DtsSource, name: string): ModuleInfo {
    return new ModuleInfo(source, name, 'internal');
  }

  readonly isExternal: boolean;
  readonly isInternal: boolean;
  readonly file: string | undefined;
  readonly refs: boolean;
  private readonly _libs: ReadonlySet<string>;

  private constructor(
      readonly source: DtsSource,
      readonly declareAs: string,
      kind:
          | 'internal'
          | 'external'
          | {
        file: string;
        libs: ReadonlySet<string>;
        refs: boolean;
      },
  ) {
    if (typeof kind === 'string') {
      this.isExternal = kind === 'external';
      this.isInternal = !this.isExternal;
      this.file = undefined;
      this.refs = false;
      this._libs = noReferredLibs;
    } else {
      this.isExternal = false;
      this.isInternal = false;
      this.file = kind.file;
      this.refs = kind.refs;
      this._libs = kind.libs;
    }
  }

  prelude(printer: DtsPrinter): void {
    for (const lib of this._libs) {
      printer.text(`/// <reference lib="${lib}" />`).nl();
    }
  }

  nested(name: string, decl: FlatDts.EntryDecl): ModuleInfo {

    let { as: declareAs = name } = decl;

    if (this.declareAs) {
      declareAs = `${this.declareAs}/${declareAs}`;
    }
    if (declareAs) {
      // Nested entry name.
      return new ModuleInfo(
          this.source,
          declareAs,
          {
            file: decl.file ?? this.file!,
            libs: referredLibs(this.source, decl.lib, this._libs),
            refs: decl.refs ?? this.refs,
          },
      );
    }

    return this;
  }

  pathTo({ file: to }: ModuleInfo): string | undefined {

    const from = this.file;

    if (!from || !to || from === to) {
      return;
    }

    const relativePath = path.relative(path.dirname(from), to);

    return relativePath.split(path.sep).map(encodeURIComponent).join(path.sep);
  }

}

async function packageName(): Promise<string> {

  const packageJson = await fs.readFile('package.json', { encoding: 'utf-8' });
  const { name } = JSON.parse(packageJson) as { name?: string };

  if (!name) {
    throw new Error(
        'Can not detect module name automatically. '
        + 'Consider to set `flatDts({ moduleName: \'<MODULE>\' })` option explicitly',
    );
  }

  return name;
}

function referredLibs(
    source: DtsSource,
    lib: FlatDts.Options['lib'],
    defaultLibs = noReferredLibs,
): ReadonlySet<string> {
  if (lib === true) {
    lib = source.setup.compilerOptions.lib;
  }
  if (lib == null) {
    return defaultLibs;
  }

  const result = new Set<string>();

  if (typeof lib === 'string') {
    result.add(referredLib(lib));
  } else if (lib !== false) {
    for (const name of lib) {
      result.add(referredLib(name));
    }
  }

  return result;
}

function referredLib(name: string): string {
  return name.endsWith('.d.ts') && name.startsWith('lib.') ? name.slice(4, -5) : name;
}

