import type ts from 'typescript';
import type { FlatDts } from '../api';
import type { DtsPrinter } from './dts-printer';
import type { DtsSource } from './dts-source';
import type { ModuleInfo } from './module-info';
import { SimpleDtsPrinter } from './simple-dts-printer';
import { SourceMapDtsPrinter } from './source-map-dts-printer';

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

  toFiles(): readonly FlatDts.File[] {

    const printer = this.source.hasMap()
        ? new SourceMapDtsPrinter(this.source)
        : new SimpleDtsPrinter(this.source);

    this.module.prelude(printer);
    this._prelude(printer);

    this._statements.forEach((statement, i) => {
      if (i) {
        printer.nl();
      }
      printer.print(statement).nl();
    });

    return printer.toFiles(this.module.file!);
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
