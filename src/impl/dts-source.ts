import ts from 'typescript';
import type { DtsSetup } from './dts-setup';
import { DtsSourceMap } from './dts-source-map';

export class DtsSource {

  static async create(sources: readonly DtsSourceFile[], setup: DtsSetup): Promise<DtsSource | undefined> {

    let source: ts.SourceFile | undefined;
    let sourceMap: { path: string; content: string } | undefined;

    for (const { path, content } of sources) {
      if (path.endsWith('.d.ts')) {
        source = ts.createSourceFile(path, content, setup.scriptTarget, true);
      } else if (path.endsWith('.d.ts.map')) {
        sourceMap = { path, content };
      }
    }

    return source && new DtsSource(
        source,
        sourceMap && await DtsSourceMap.create(sourceMap.path, sourceMap.content, setup),
        setup,
    );
  }

  constructor(
      readonly source: ts.SourceFile,
      readonly map: DtsSourceMap | undefined,
      readonly setup: DtsSetup,
  ) {
  }

  destroy(): void {
    this.map?.destroy();
  }

  hasMap(): this is DtsSource.WithMap {
    return !!this.map;
  }

}

export namespace DtsSource {

  export interface WithMap extends DtsSource {

    readonly map: DtsSourceMap;

  }

}

export interface DtsSourceFile {

  readonly path: string;

  readonly content: string;

}
