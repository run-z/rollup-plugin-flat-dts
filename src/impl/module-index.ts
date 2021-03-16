import type { FlatDts } from '../api';
import { DtsMeta } from './dts-meta';
import type { DtsSource } from './dts-source';
import { ModuleInfo } from './module-info';
import { moduleMatcher } from './module-matcher';

export class ModuleIndex {

  private readonly _meta: DtsMeta;
  private readonly _isInternal: (name: string) => boolean;
  private readonly _isExternal: (name: string) => boolean;
  private readonly _names: readonly string[];
  private readonly _declarations: ReadonlyMap<string, FlatDts.EntryDecl>;
  private readonly _byName = new Map<string, Promise<ModuleInfo>>();

  constructor(private readonly _source: DtsSource) {

    const { source, setup: { dtsOptions } } = _source;
    const { entries = {} } = dtsOptions;

    this._meta = new DtsMeta(source);

    const names: string[] = [];
    const declarations = new Map<string, FlatDts.EntryDecl>();

    for (const [name, decl] of Object.entries(entries)) {
      if (decl) {
        declarations.set(name, decl);
        names.push(name);
      }
    }

    // Longest first.
    names.sort((first, second) => second.length - first.length);

    this._names = names;
    this._declarations = declarations;
    this._isInternal = moduleMatcher(dtsOptions.internal);
    this._isExternal = moduleMatcher(dtsOptions.external);
  }

  byName(name: string): Promise<ModuleInfo> {

    const found = this._byName.get(name);

    if (found) {
      // Already cached.
      return found;
    }
    if (this._isExternal(name)) {
      // External module.
      return this._put(name, ModuleInfo.external(this._source, name));
    }
    if (this._isInternal(name)) {
      // External module.
      return this._put(name, ModuleInfo.internal(this._source, name));
    }

    const decl = this._declarations.get(name);

    if (decl) {
      // Entry declared.
      return this._put(name, this.main().then(main => main.nested(name, decl)));
    }
    if (!this._meta.isModuleDeclared(name)) {
      // No such module declaration in `.d.ts` file.
      // Mark it external.
      return this._put(name, ModuleInfo.external(this._source, name));
    }

    const matchingName = this._names.find(n => n === name || name.startsWith(n + '/'));

    if (matchingName) {
      // Use matching module.
      return this._put(name, this.byName(matchingName));
    }

    // No matching module found.
    // Return the main entry.
    return this.main();
  }

  main(): Promise<ModuleInfo> {

    const main = ModuleInfo.main(this._source);

    return (this.main = () => main)();
  }

  private _put(name: string, info: ModuleInfo | PromiseLike<ModuleInfo>): Promise<ModuleInfo> {

    const result = Promise.resolve(info);

    this._byName.set(name, result);

    return result;
  }

}
