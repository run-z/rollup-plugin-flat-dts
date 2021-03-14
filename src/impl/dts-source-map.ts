import fs from 'fs';
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

  private readonly _tsSources = new Map<string, ts.SourceFile>();

  private constructor(
      readonly file: ts.SourceMapSource,
      readonly consumer: SourceMapConsumer,
      readonly setup: DtsSetup,
  ) {}

  tsSource(file: string): ts.SourceFile {

    let source = this._tsSources.get(file);

    if (!source) {
      source = ts.createSourceFile(
          file,
          fs.readFileSync(this.setup.sourceURL(file)).toString(),
          this.setup.scriptTarget,
      );
      this._tsSources.set(file, source);
    }

    return source;
  }

  destroy(): void {
    this.consumer.destroy();
  }

}
