import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import ts from 'typescript';
import type { FlatDts } from '../api';
import type { DtsSource } from './dts-source';

export abstract class DtsPrinter<TSource extends DtsSource = DtsSource> {

  private readonly _printer: ts.Printer;
  private _out = '';

  constructor(readonly source: TSource) {
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

  nl(): this {
    return this.text(this.source.setup.eol);
  }

  abstract toFiles(name: string): readonly FlatDts.File[];

  protected createFile(path: string, content = this._out): FlatDts.File {
    return {
      path,
      content,
      async writeOut(filePath = path) {
        await fs.mkdir(dirname(filePath), { recursive: true });

        return fs.writeFile(filePath, content);
      },
    };
  }

}
