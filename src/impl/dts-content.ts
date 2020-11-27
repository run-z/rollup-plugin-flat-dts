import ts from 'typescript';
import type { FlatDts } from '../api';
import type { DtsSource } from './dts-source';
import { dtsFile } from './flat-dts.impl';
import type { ModuleInfo } from './module-info';

/**
 * @internal
 */
export class DtsContent {

  private readonly _refs = new Set<ModuleInfo>();
  private readonly _statements: ts.Statement[] = [];

  constructor(readonly source: DtsSource, readonly module: ModuleInfo) {
  }

  refer(refs: readonly ModuleInfo[] | undefined): this {
    if (refs) {
      refs.forEach(ref => this._refs.add(ref));
    }
    return this;
  }

  append(statement: ts.Statement): void {
    this._statements.push(statement);
  }

  dtsFile(printer: ts.Printer): FlatDts.File {

    const { source, eol } = this.source;
    const content = this._statements.reduce(
        (out, statement) => {
          if (out) {
            out += eol;
          } else {
            out = this._prelude();
          }

          return out + printer.printNode(ts.EmitHint.Unspecified, statement, source) + eol;
        },
        '',
    );

    return dtsFile(this.module.file!, content);
  }

  private _prelude(): string {

    const { eol } = this.source;
    let out = this.module.prelude();

    for (const ref of this._refs) {

      const path = this.module.pathTo(ref);

      if (path) {
        // No need to refer to itself.
        out += `/// <reference path="${path}" />${eol}`;
      }
    }

    return out;
  }

}
