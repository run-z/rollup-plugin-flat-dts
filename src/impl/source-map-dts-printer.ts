import ts from 'typescript';
import type { FlatDts } from '../api';
import { DtsPrinter } from './dts-printer';
import type { DtsSource } from './dts-source';

/**
 * @internal
 */
export class SourceMapDtsPrinter extends DtsPrinter<DtsSource.WithMap> {

  private readonly _printer: ts.Printer;
  private _out = '';

  constructor(source: DtsSource.WithMap) {
    super(source);
    this._printer = ts.createPrinter(
        {
          newLine: source.setup.compilerOptions.newLine,
        },
    );
  }

  print(node: ts.Node): this {
    this.text(this._printer.printNode(ts.EmitHint.Unspecified, node, this.source.source));
    return this;
  }

  text(text: string): this {
    this._out += text;
    return this;
  }

  toFiles(name: string): readonly FlatDts.File[] {
    return [this.createDtsFile(name, this._out)];
  }

}
