import { BasicSourceMapConsumer, SourceMapConsumer } from 'source-map';
import ts from 'typescript';
import type { DtsSetup } from './dts-setup';

/**
 * @internal
 */
export class DtsSourceMap {

  static async create(file: ts.SourceMapSource, setup: DtsSetup): Promise<DtsSourceMap> {
    return new DtsSourceMap(
        file,
        await new SourceMapConsumer(JSON.parse(file.text), setup.sourceURL(file.fileName).href),
        setup,
    );
  }

  private constructor(
      readonly file: ts.SourceMapSource,
      readonly consumer: BasicSourceMapConsumer,
      readonly setup: DtsSetup,
  ) {}

  originalRange(node: ts.Node): DtsLocationRange | undefined {

    const sourceFile = node.getSourceFile();

    if (!sourceFile) {
      return;
    }

    const { pos, end } = ts.getSourceMapRange(node);
    const startLoc = this._sourceLocation(sourceFile, pos);

    if (!startLoc) {
      return;
    }

    const endLoc = this._sourceLocation(sourceFile, end);

    if (!endLoc) {
      return;
    }

    return [startLoc, endLoc];
  }

  destroy(): void {
    this.consumer.destroy();
  }

  private _sourceLocation(sourceFile: ts.SourceFile, pos: number): DtsLocation | undefined {
    if (pos < 0) {
      return;
    }

    const startLoc = sourceFile.getLineAndCharacterOfPosition(pos);
    const { source, line, column } = this.consumer.originalPositionFor({
      line: startLoc.line + 1,
      column: startLoc.character,
    });

    if (source == null || line == null || column == null) {
      return;
    }

    return { source, line: line - 1, col: column };
  }

}

/**
 * @internal
 */
export type DtsLocationRange = readonly [DtsLocation, DtsLocation];

/**
 * @internal
 */
export interface DtsLocation {
  readonly source: string;
  readonly line: number;
  readonly col: number;
}
