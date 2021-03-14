import { promises as fs } from 'fs';
import { dirname } from 'path';
import type ts from 'typescript';
import type { FlatDts } from '../api';
import type { DtsSource } from './dts-source';

/**
 * @internal
 */
export abstract class DtsPrinter<TSource extends DtsSource = DtsSource> {

  constructor(readonly source: TSource) {
  }

  abstract print(node: ts.Node): this;

  abstract text(text: string): this;

  nl(): this {
    return this.text(this.source.setup.eol);
  }

  abstract toFiles(name: string): readonly FlatDts.File[];

  protected createDtsFile(path: string, content: string): FlatDts.File {
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
