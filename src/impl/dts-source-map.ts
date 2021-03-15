import { SourceMapConsumer } from 'source-map';
import ts from 'typescript';
import type { DtsSetup } from './dts-setup';

/**
 * @internal
 */
export class DtsSourceMap {

  static async create(file: ts.SourceMapSource, setup: DtsSetup): Promise<DtsSourceMap> {
    return new DtsSourceMap(
        file,
        await new SourceMapConsumer(file.text, setup.sourceURL(file.fileName).href),
        setup,
    );
  }

  private constructor(
      readonly file: ts.SourceMapSource,
      readonly consumer: SourceMapConsumer,
      readonly setup: DtsSetup,
  ) {}

  originalRange(node: ts.Node, source: ts.SourceFile): DtsLocationRange | undefined {

    const { pos: mapStartPos, end: mapEndPos } = ts.getSourceMapRange(node);
    const srcStart = this._sourceLocation(source, mapStartPos);

    if (!srcStart) {
      return;
    }

    const srcEnd = this._sourceLocation(source, mapEndPos);

    if (!srcEnd) {
      return;
    }

    const startPos = node.getStart(source);
    const endPos = node.getEnd();

    const start = source.getLineAndCharacterOfPosition(startPos);
    const mapStart = source.getLineAndCharacterOfPosition(mapStartPos);

    const end = source.getLineAndCharacterOfPosition(endPos);
    const mapEnd = source.getLineAndCharacterOfPosition(mapEndPos);

    const text = node.getText(source);

    if (text.trim() === 'formatDiagnostics') {
      console.debug(srcStart, mapStart, start, srcEnd, end, mapEnd);
    }

    const startLineOffset = start.line - mapStart.line;
    const endLineOffset = mapEnd.line - end.line;

    return [
      {
        source: srcStart.source,
        line: srcStart.line + startLineOffset,
        col: srcStart.col + (startLineOffset ? 0 : (start.character - mapStart.character)),
      },
      {
        source: srcEnd.source,
        line: srcEnd.line - endLineOffset,
        col: srcEnd.col - (endLineOffset ? 0 : (mapEnd.character - end.character)),
      },
    ];
  }

  destroy(): void {
    this.consumer.destroy();
  }

  private _sourceLocation(sourceFile: ts.SourceFile, pos: number): DtsLocation | undefined {
    if (pos < 0) {
      return;
    }

    const location = sourceFile.getLineAndCharacterOfPosition(pos);
    const { source, line, column } = this.consumer.originalPositionFor({
      line: location.line + 1,
      column: location.character,
    });

    if (source == null || line == null || column == null) {
      return;
    }

    return {
      source: this.setup.relativePath(source),
      line: line - 1,
      col: column,
    };
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
