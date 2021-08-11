import type * as ts from 'typescript';

/**
 * Flattened type definitions.
 */
export interface FlatDts {

  /**
   * An array of emitted `.d.ts` files.
   *
   * May be empty when emission failed.
   */
  readonly files: readonly FlatDts.File[];

  /**
   * Emission diagnostics.
   */
  readonly diagnostics: readonly ts.Diagnostic[];

  /**
   * Formats emission diagnostics.
   *
   * @returns A string containing formatted diagnostic messages.
   */
  formatDiagnostics(): string;

  /**
   * Writes all type definition files.
   *
   * @param rootDir - A root directory to place `.d.ts` files to. Defaults to working directory.
   *
   * @returns A promise resolved when all files written.
   */
  writeOut(rootDir: string): Promise<void>;

}

export namespace FlatDts {

  /**
   * Type definitions flattening options.
   *
   * Contains options for `rollup-plugin-flat-dts` plugin.
   *
   * Accepted by {@link emitFlatDts}.
   */
  export interface Options {

    /**
     * `tsconfig.json` file location relative to working directory.
     *
     * @defaultValue `"tsconfig.json"`
     */
    readonly tsconfig?: string | undefined;

    /**
     * TypeScript compiler options to apply.
     *
     * Override the options from {@link tsconfig}.
     */
    readonly compilerOptions?: ts.CompilerOptions | undefined;

    /**
     * Output `.d.ts` file name relative to output directory.
     *
     * @defaultValue `index.d.ts`
     */
    readonly file?: string | undefined;

    /**
     * The module name to replace flattened module declarations with.
     *
     * @defaultValue Package name extracted from `package.json` found in current directory.
     */
    readonly moduleName?: string | undefined;

    /**
     * Module entries.
     *
     * A map of entry name declarations. Each key is an original name of module entry as it present in non-flattened
     * `.d.ts` file, which is typically a relative path to original typescript file without `.ts` extension.
     */
    readonly entries?: {
      readonly [name: string]: EntryDecl | undefined;
    };

    /**
     * Whether to add [triple-slash](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html)
     * directives to refer the libraries used.
     *
     * Allowed values:
     * - `true` to add an entry for each referred library from `lib` compiler option,
     * - `false` (the default) to not add any library references,
     * - an explicit list of libraries to refer.
     *
     * @defaultValue `false`
     */
    readonly lib?: boolean | string | readonly string[] | undefined;

    /**
     * Whether to add file references.
     *
     * A file reference is added when one entry refers another one.
     *
     * @defaultValue `true`
     */
    readonly refs?: boolean | undefined;

    /**
     * External module names.
     *
     * An array of external module names and their [glob] patterns. These names won't be changed during flattening
     * process.
     *
     * This is useful for external module augmentation.
     *
     * [glob]: https://www.npmjs.com/package/micromatch
     */
    readonly external?: string | readonly string[] | undefined;

    /**
     * Internal module names.
     *
     * An array of internal module names and their [glob] patterns. Internal module type definitions are excluded from
     * generated `.d.ts` files.
     *
     * [glob]: https://www.npmjs.com/package/micromatch
     */
    readonly internal?: string | readonly string[] | undefined;

  }

  /**
   * Declaration of module entry.
   */
  export interface EntryDecl {

    /**
     * Final entry name.
     *
     * When specified, the original entry name is replaced with `<moduleName>/<as>`.
     *
     * @defaultValue The same as {@link name}.
     */
    readonly as?: string | undefined;

    /**
     * Whether to add [triple-slash](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html)
     * directives to refer the libraries used by this entry.
     *
     * Allowed values:
     * - `true` to add an entry for each referred library from `lib` compiler option,
     * - `false` (the default) to not add any library references,
     * - an explicit list of libraries to refer.
     *
     * @defaultValue Inherited from {@link Options.lib `lib` flattening option}.
     */
    readonly lib?: boolean | string | readonly string[] | undefined;

    /**
     * Output `.d.ts` file name relative to output directory.
     *
     * When omitted the contents are merged into main `.d.ts.` file.
     */
    readonly file?: string | undefined;

    /**
     * Whether to add file references.
     *
     * A file reference is added for each entry this one refers.
     *
     * @defaultValue Inherited from {@link Options.refs `refs` flattening option}.
     */
    readonly refs?: boolean | undefined;

  }

  /**
   * Emitted `.d.ts` file.
   *
   * The file is not actually written to the disk by {@link File.writeOut} call.
   */
  export interface File {

    /**
     * Emitted `.d.ts` file path.
     */
    readonly path: string;

    /**
     * Emitted `.d.ts` file contents.
     */
    readonly content: string;

    /**
     * Writes contents to this file.
     *
     * Creates the necessary directories.
     *
     * @param path - Target file path. Defaults to {@link name}.
     *
     * @returns A promise resolved when file written.
     */
    writeOut(path?: string): Promise<void>;

  }

}
