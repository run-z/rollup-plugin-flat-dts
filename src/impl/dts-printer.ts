import ts from 'typescript';
import type { DtsSource } from './dts-source';

/**
 * @internal
 */
export class DtsPrinter {

  private readonly _printer: ts.Printer;
  private _out = '';

  constructor(private readonly _source: DtsSource) {
    this._printer = ts.createPrinter(
        {
          newLine: _source.setup.compilerOptions.newLine,
        },
    );
  }

  print(node: ts.Node): this {
    this._out += this._printer.printNode(ts.EmitHint.Unspecified, node, this._source.source);
    return this;
  }

  text(text: string): this {
    this._out += text;
    return this;
  }

  nl(): this {
    return this.text(this._source.setup.eol);
  }

  toString(): string {
    return this._out;
  }

}
