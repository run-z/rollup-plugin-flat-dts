import ts from 'typescript';
import type { DtsSetup } from './dts-setup';
import { DtsSourceMap } from './dts-source-map';

/**
 * @internal
 */
export class DtsSource {

  static async create(sources: readonly DtsSourceFile[], setup: DtsSetup): Promise<DtsSource | undefined> {

    let source: ts.SourceFile | undefined;
    let sourceMap: ts.SourceMapSource | undefined;

    for (const { path, content } of sources) {
      if (path.endsWith('.d.ts')) {
        source = ts.createSourceFile(path, content, setup.scriptTarget, true);
      } else if (path.endsWith('.d.ts.map')) {
        sourceMap = ts.createSourceMapSource(path, content);
      }
    }

    return source && new DtsSource(
        source,
        sourceMap && await DtsSourceMap.create(sourceMap, setup),
        setup,
    );
  }

  constructor(
      readonly source: ts.SourceFile,
      readonly map: DtsSourceMap | undefined,
      readonly setup: DtsSetup,
  ) {
  }

  createPrinter(): ts.Printer {
    return ts.createPrinter(
        {
          newLine: this.setup.compilerOptions.newLine,
        },
        this._printHandlers(),
    );
  }

  destroy(): void {
    this.map?.destroy();
  }

  private _printHandlers(): ts.PrintHandlers | undefined {

    const { map } = this;

    if (!map) {
      return;
    }

    const reportNode = (node: ts.Node): void => {

      const range = ts.getSourceMapRange(node);

      if (range.pos < 0 || range.pos >= range.end) {
        return;
      }

      const sourceFile = node.getSourceFile();

      if (!sourceFile) {
        return;
      }

      const dtsStart = sourceFile.getLineAndCharacterOfPosition(range.pos);
      const { source, line: startLine, column: startColumn } = map.consumer.originalPositionFor({
        line: dtsStart.line + 1,
        column: dtsStart.character,
      });

      if (source == null || startLine == null || startColumn == null) {
        return;
      }

      const dtsEnd = sourceFile.getLineAndCharacterOfPosition(range.end);
      const { line: endLine, column: endColumn } = map.consumer.originalPositionFor({
        line: dtsEnd.line + 1,
        column: dtsEnd.character,
      });

      if (endLine == null || endColumn == null) {
        return;
      }

      const tsSource = map.tsSource(source);
      const srcStart = tsSource.getPositionOfLineAndCharacter(startLine - 1, startColumn);
      const srcEnd = tsSource.getPositionOfLineAndCharacter(endLine - 1, endColumn);

      console.debug(
          node.getText(this.source),
          dtsStart,
          startLine,
          startColumn,
          dtsEnd,
          endLine,
          endColumn,
          '-> ' + source + ' "' + tsSource.text.substring(srcStart, srcEnd) + '"',
      );
    };

    return {
      substituteNode: (_hint, node) => {

        reportNode(node);

        return node;
      },
    };
  }

}

/**
 * @internal
 */
export interface DtsSourceFile {

  readonly path: string;

  readonly content: string;

}
