import ts from 'typescript';
import type { FlatDts } from '../api';

/**
 * @internal
 */
export class DtsSource {

  readonly eol: string;

  constructor(
      readonly source: ts.SourceFile,
      readonly dtsOptions: FlatDts.Options,
      readonly compilerOptions: ts.CompilerOptions,
  ) {
    this.eol = eolString(compilerOptions);
  }

  createPrinter(): ts.Printer {
    return ts.createPrinter({
      newLine: this.compilerOptions.newLine,
    });
  }

}

/**
 * @internal
 */
function eolString({ newLine }: ts.CompilerOptions): string {
  switch (newLine) {
  case ts.NewLineKind.LineFeed:
    return '\n';
  case ts.NewLineKind.CarriageReturnLineFeed:
    return '\r\n';
  default:
    return ts.sys.newLine;
  }
}
