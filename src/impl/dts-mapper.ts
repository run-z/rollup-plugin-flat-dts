import { SourceMapGenerator } from 'source-map';
import ts from 'typescript';
import type { FlatDts } from '../api';
import { DtsNodeChildren } from './dts-node-children';
import type { DtsSource } from './dts-source';

/**
 * @internal
 */
export class DtsMapper {

  private readonly _genDts: ts.SourceFile;
  private readonly _generator: SourceMapGenerator;

  constructor(
      private readonly _source: DtsSource.WithMap,
      dtsFile: FlatDts.File,
  ) {

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

    const orgRange = this._source.map.originalRange(orgNode);
    const genStartPos = genNode.getStart(this._genDts);

    if (!orgRange || genStartPos < 0) {
      this._mapChildren(orgNode, genNode);
      return;
    }

    const [orgStart, orgEnd] = orgRange;
    const genStart = this._genDts.getLineAndCharacterOfPosition(genStartPos);

    this._generator.addMapping({
      generated: { line: genStart.line + 1, column: genStart.character },
      original: { line: orgStart.line + 1, column: orgStart.col },
      source: orgStart.source,
    });

    this._mapChildren(orgNode, genNode);

    const genEnd = this._genDts.getLineAndCharacterOfPosition(genNode.getEnd());

    this._generator.addMapping({
      generated: { line: genEnd.line + 1, column: genEnd.character },
      original: { line: orgEnd.line + 1, column: orgEnd.col },
      source: orgEnd.source,
    });
  }

  private _mapChildren(orgNode: ts.Node, genNode: ts.Node): void {
    this._mapNodes(new DtsNodeChildren(orgNode), new DtsNodeChildren(genNode));
  }

}


