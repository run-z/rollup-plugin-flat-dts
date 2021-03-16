import { Mapping, SourceMapGenerator } from 'source-map';
import ts from 'typescript';
import type { FlatDts } from '../api';
import { DtsNodeChildren } from './dts-node-children';
import type { DtsSource } from './dts-source';

export class DtsMapper {

  private readonly _genDts: ts.SourceFile;
  private readonly _generator: SourceMapGenerator;
  private readonly _line: Mapping[] = [];

  constructor(private readonly _source: DtsSource.WithMap, dtsFile: FlatDts.File) {

    const { setup } = _source;

    // Re-parse just generated `.d.ts`.
    this._genDts = ts.createSourceFile(
        dtsFile.path,
        dtsFile.content,
        setup.scriptTarget,
        false,
        ts.ScriptKind.TS,
    );

    this._generator = new SourceMapGenerator({
      sourceRoot: setup.pathToRoot(dtsFile.path),
      file: setup.basename(dtsFile.path),
    });
  }

  map(orgNodes: readonly ts.Node[]): string {
    this._mapNodes(orgNodes, this._genDts.statements);
    this._endLine();
    return this._generator.toString();
  }

  private _mapNodes(orgNodes: Iterable<ts.Node>, genNodes: Iterable<ts.Node>): void {
    // Assume the re-parsed AST has the same structure as an original one.

    const orgIt = orgNodes[Symbol.iterator]();
    const genIt = genNodes[Symbol.iterator]();

    for (;;) {

      const orgNext = orgIt.next();
      const genNext = genIt.next();

      if (orgNext.done || genNext.done) {
        break;
      }

      this._mapNode(orgNext.value, genNext.value);
    }
  }

  private _mapNode(orgNode: ts.Node, genNode: ts.Node): void {

    const orgRange = this._source.map.originalRange(orgNode, this._source.source);
    const genStartPos = genNode.getStart(this._genDts);

    if (!orgRange || genStartPos < 0) {
      this._mapChildren(orgNode, genNode);
      return;
    }

    const [orgStart, orgEnd] = orgRange;
    const genStart = this._genDts.getLineAndCharacterOfPosition(genStartPos);

    this._addMapping({
      generated: { line: genStart.line + 1, column: genStart.character },
      original: { line: orgStart.line + 1, column: orgStart.col },
      source: orgStart.source,
    });

    this._mapChildren(orgNode, genNode);

    const genEnd = this._genDts.getLineAndCharacterOfPosition(genNode.getEnd());

    this._addMapping({
      generated: { line: genEnd.line + 1, column: genEnd.character },
      original: { line: orgEnd.line + 1, column: orgEnd.col },
      source: orgEnd.source,
    });
  }

  private _mapChildren(orgNode: ts.Node, genNode: ts.Node): void {
    this._mapNodes(new DtsNodeChildren(orgNode), new DtsNodeChildren(genNode));
  }

  private _addMapping(mapping: Mapping): void {

    const [prev] = this._line;

    if (prev
        && prev.source === mapping.source
        && prev.generated.line === mapping.generated.line
        && prev.original.line === mapping.original.line) {
      // Mapping from and to the same line
      this._line.push(mapping);
      return;
    }

    this._endLine();
    this._line.length = 0;
    this._line.push(mapping);
  }

  _endLine(): void {
    // Sort line mappings by column number
    this._line.sort(compareMappingColumns);

    const lastIdx = this._line.length - 1;

    this._line.forEach((mapping, i) => {
      if (i && i < lastIdx) {// Always record the first and the last mapping

        const prev = this._line[i - 1];
        const genOffset = mapping.generated.column - prev.generated.column;

        if (!genOffset) {
          // No need to record the same mapping twice.
          return;
        }
        /*
        // Disabled. It seems that spanning subsequent segments breaks IDE navigation.

        const orgOffset = mapping.original.column - prev.original.column;

        if (genOffset === orgOffset) {
          // The column offset remained the same.
          // Span with the previous mapping segment.
          return;
        }
        */
      }

      this._generator.addMapping(mapping);
    });
  }

}

function compareMappingColumns(
    { generated: { column: col1 } }: Mapping,
    { generated: { column: col2 } }: Mapping,
): number {
  return col1 - col2;
}
