import ts from 'typescript';
import { DtsSource, DtsTransformer, emptyDts, readCompilerOptions } from '../impl';
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

  const { compilerOptions, files, errors } = readCompilerOptions(dtsOptions);
  const { file: dtsFile = 'index.d.ts' } = dtsOptions;

  delete compilerOptions.outDir;
  compilerOptions.outFile = dtsFile;

  let { target } = compilerOptions;

  if (!target) {
    // Set target to latest if absent
    compilerOptions.target = target = ts.ScriptTarget.Latest;
  }

  const program = ts.createProgram({
    rootNames: files,
    options: compilerOptions,
    host: ts.createCompilerHost(compilerOptions, true),
    configFileParsingDiagnostics: errors,
  });

  const { path, content, diagnostics } = await new Promise<EmittedDts>(resolve => {

    let path = dtsFile;
    let content: string | undefined;

    try {

      const { diagnostics } = program.emit(
          undefined /* all source files */,
          (file, text) => {
            path = file;
            content = text;
          },
          undefined /* cancellationToken */,
          true /* emitOnlyDtsFiles */,
      );

      resolve({ path, content, diagnostics });
    } catch (error) {
      resolve({
        path,
        content,
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

  if (content == null) {
    return emptyDts(diagnostics);
  }

  const src = ts.createSourceFile(path, content, target);
  const transformer = new DtsTransformer(new DtsSource(src, dtsOptions, compilerOptions));

  return transformer.transform(diagnostics);
}

/**
 * @internal
 */
interface EmittedDts {
  readonly path: string;
  readonly content?: string;
  readonly diagnostics: readonly ts.Diagnostic[];
}
