import type ts from 'typescript';
import type { FlatDts } from '../api';
import { DtsMapper } from './dts-mapper';
import { DtsPrinter } from './dts-printer';
import type { DtsSource } from './dts-source';

export class SourceMapDtsPrinter extends DtsPrinter<DtsSource.WithMap> {

  private readonly _nodes: ts.Node[] = [];

  print(node: ts.Node): this {
    this._nodes.push(node);
    return super.print(node);
  }

  toFiles(name: string): readonly FlatDts.File[] {

    const dts = this.createFile(name);
    const sourceMap = this._createSourceMapFile(dts);
    const { setup } = this.source;

    return [
      this.createFile(
          dts.path,
          `${dts.content}//# sourceMappingURL=${setup.basename(sourceMap.path)}${setup.eol}`,
      ),
      sourceMap,
    ];
  }

  private _createSourceMapFile(dtsFile: FlatDts.File): FlatDts.File {
    return this.createFile(
        `${dtsFile.path}.map`,
        new DtsMapper(this.source, dtsFile).map(this._nodes).toString(),
    );
  }

}
