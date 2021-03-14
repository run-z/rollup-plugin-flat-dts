import type ts from 'typescript';
import type { FlatDts } from '../api';
import { DtsPrinter } from './dts-printer';
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

  dtsFile(): FlatDts.File {

    const printer = new DtsPrinter(this.source);

    this.module.prelude(printer);
    this._prelude(printer);

    this._statements.forEach((statement, i) => {
      if (i) {
        printer.nl();
      }
      printer.print(statement).nl();
    });

    return dtsFile(this.module.file!, printer.toString());
  }

  private _prelude(printer: DtsPrinter): void {
    for (const ref of this._refs) {

      const path = this.module.pathTo(ref);

      if (path) {
        // No need to refer to itself.
        printer.text(`/// <reference path="${path}" />`).nl();
      }
    }
  }

}
