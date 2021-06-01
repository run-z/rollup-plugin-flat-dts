import ts from 'typescript';
import { DtsSetup, DtsSource, DtsSourceFile, DtsTransformer, emptyFlatDts } from '../impl';
import type { FlatDts } from './flat-dts';

/**
 * Emits flat type definitions.
 *
 * Does not actually writes to `.d.ts` files.
 *
 * @param dtsOptions - Flattening options.
 *
 * @returns A promise resolved to flattened type definitions representation.
 */
export async function emitFlatDts(
    dtsOptions: FlatDts.Options = {},
): Promise<FlatDts> {

  const setup = new DtsSetup(dtsOptions);
  const { compilerOptions, files, errors } = setup;

  const program = ts.createProgram({
    rootNames: files,
    options: compilerOptions,
    host: ts.createCompilerHost(compilerOptions, true),
    configFileParsingDiagnostics: errors,
  });

  const { sources, diagnostics } = await new Promise<EmittedDts>(resolve => {

    const sources: DtsSourceFile[] = [];

    try {

      const { diagnostics } = program.emit(
          undefined /* all source files */,
          (path, content) => {
            sources.push({ path, content });
          },
          undefined /* cancellationToken */,
          true /* emitOnlyDtsFiles */,
      );

      resolve({ sources, diagnostics });
    } catch (error) {
      resolve({
        sources,
        diagnostics: [{
          category: ts.DiagnosticCategory.Error,
          code: 9999,
          file: undefined,
          start: undefined,
          length: undefined,
          messageText: error instanceof Error ? error.message : String(error),
        }],
      });
    }
  });

  const source = await DtsSource.create(sources, setup);

  if (!source) {
    return emptyFlatDts(diagnostics);
  }

  try {

    const transformer = new DtsTransformer(source);

    return transformer.transform(diagnostics);
  } finally {
    source.destroy();
  }
}

interface EmittedDts {

  readonly sources: readonly DtsSourceFile[];

  readonly diagnostics: readonly ts.Diagnostic[];

}
