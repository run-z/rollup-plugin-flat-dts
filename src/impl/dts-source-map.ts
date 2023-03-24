import { SourceMapConsumer } from 'source-map';
import type ts from 'typescript';
import type { DtsSetup } from './dts-setup';

export class DtsSourceMap {

  static async create(path: string, content: string, setup: DtsSetup): Promise<DtsSourceMap> {
    return new DtsSourceMap(
      await new SourceMapConsumer(content, setup.sourceURL(path).href),
      setup,
    );
  }

  private constructor(readonly map: SourceMapConsumer, readonly setup: DtsSetup) {}

  originalRange(node: ts.Node, source: ts.SourceFile): DtsLocationRange | undefined {
    if (!(node.pos >= 0) || !(node.end >= 0)) {
      return;
    }

    const startPos = node.getStart(source);
    const endPos = node.getEnd();

    if (startPos < 0 || endPos < 0) {
      return;
    }

    const srcStart = this._sourceLocation(source, startPos);

    if (!srcStart) {
      return;
    }

    const srcEnd = this._sourceLocation(source, endPos);

    if (!srcEnd) {
      return;
    }

    return [srcStart, srcEnd];
  }

  destroy(): void {
    this.map.destroy();
  }

  private _sourceLocation(sourceFile: ts.SourceFile, pos: number): DtsLocation | undefined {
    if (pos < 0) {
      return;
    }

    const location = sourceFile.getLineAndCharacterOfPosition(pos);
    const { source, line, column } = this.map.originalPositionFor({
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

export type DtsLocationRange = readonly [DtsLocation, DtsLocation];

export interface DtsLocation {
  readonly source: string;
  readonly line: number;
  readonly col: number;
}
