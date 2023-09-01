# Flatten `.d.ts` Files

[![NPM][npm-image]][npm-url]
[![Build Status][build-status-img]][build-status-link]
[![Code Quality][quality-img]][quality-link]
[![GitHub Project][github-image]][github-url]
[![API Documentation][api-docs-image]][api documentation]

[npm-image]: https://img.shields.io/npm/v/rollup-plugin-flat-dts.svg?logo=npm
[npm-url]: https://www.npmjs.com/package/rollup-plugin-flat-dts
[build-status-img]: https://github.com/run-z/rollup-plugin-flat-dts/workflows/Build/badge.svg
[build-status-link]: https://github.com/run-z/rollup-plugin-flat-dts/actions?query=workflow:Build
[quality-img]: https://app.codacy.com/project/badge/Grade/387d9672b1c546cda630bf3cb04d5cd2
[quality-link]: https://www.codacy.com/gh/run-z/rollup-plugin-flat-dts/dashboard?utm_source=github.com&utm_medium=referral&utm_content=run-z/rollup-plugin-flat-dts&utm_campaign=Badge_Grade
[github-image]: https://img.shields.io/static/v1?logo=github&label=GitHub&message=project&color=informational
[github-url]: https://github.com/run-z/rollup-plugin-flat-dts
[api-docs-image]: https://img.shields.io/static/v1?logo=typescript&label=API&message=docs&color=informational
[api documentation]: https://run-z.github.io/rollup-plugin-flat-dts

## Example Configuration

Add the following `rollup.config.js`:

```javascript
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import flatDts from 'rollup-plugin-flat-dts';
import sourcemaps from 'rollup-plugin-sourcemaps';
import ts from 'rollup-plugin-typescript2';

export default {
  input: './src/index.ts',
  plugins: [commonjs(), ts(), nodeResolve(), sourcemaps()],
  output: {
    format: 'esm',
    sourcemap: true,
    file: 'dist/index.js',
    plugins: [flatDts()],
  },
};
```

Then the command `rollup --config ./rollup.config.js` would transpile TypeScript files from `src/` directory
to `dist/index.js`, and generate `dist/index.d.ts` with flattened type definitions.

## Limitations

This plugin flattens type definitions instead of merging them. This applies severe limitations to the source code:

1. Every export in every TypeScript file considered exported from the package (i.e. part of public API).

   Mark internal exports (internal API) with `@internal` jsdoc tag to prevent this, or declare internal modules with
   `internal` option.

2. Default exports supported only at the top level and in entry points ([see below](#multiple-entries)).

3. Exported symbols should be unique across the code base.

4. Exports should not be renamed when re-exporting them.

   Aliasing is still possible.

## Project Structure

To adhere to these limitations the project structure could be like this:

1. An index file (`index.ts`) is present in each source directory with exported symbols.

   Index file re-exports all publicly available symbols from the same directory with statements like
   `export * from './file';`.

   Index file also re-export all symbols from nested directories with statements like `export * from './dir';`

2. All exported symbols that are not re-exported by index files considered part of internal API.

   Every such symbols has a jsdoc block containing `@internal` tag.

   Alternatively, the internal modules follow some naming convention. The `internal` option reflects this convention.
   E.g. `internal: ['**/impl/**', '**/*.impl']` would treat all `.impl.ts` source files and files in `impl/` directories
   as part of internal API.

3. Rollup entry points are index files.

## Configuration Options

`flatDts({})` accepts configuration object with the following properties:

- `tsconfig` - Either `tsconfig.json` file location relative to working directory, or parsed `tsconfig.json` contents.

  `tsconfig.json` by default.

- `compilerOptions` - TypeScript compiler options to apply.

  Override the options from `tsconfig`.

- `file` - Output `.d.ts` file name relative to output directory.

  `index.d.ts` by default.

- `moduleName` - The module name to replace flattened module declarations with.

  Defaults to package name extracted from `package.json`.

- `entries` - Module entries.

  A map of entry name declarations ([see below](#multiple-entries)).

- `lib` - Whether to add [triple-slash] directives to refer the libraries used.

  Allowed values:

  - `true` to add an entry for each referred library from `lib` compiler option,
  - `false` (the default) to not add any library references,
  - an explicit list of libraries to refer.

- `refs` - Whether to add file references.

  A file reference is added when one entry refers another one.

  `true` by default.

- `external` - External module names.

  An array of external module names and their [glob] patterns. These names won't be changed during flattening
  process.

  This is useful for external module augmentation.

- `internal` - Internal module names.

  An array of internal module names and their [glob] patterns. Internal module type definitions are excluded from
  generated `.d.ts` files.

[triple-slash]: https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html
[glob]: https://www.npmjs.com/package/micromatch

## Declaration Maps (Experimental)

When [declarationMap] compiler option enabled a declaration map file(s) (`.d.ts.map`) will be generated next to `.d.ts`
ones:

```javascript
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import flatDts from 'rollup-plugin-flat-dts';
import sourcemaps from 'rollup-plugin-sourcemaps';
import ts from 'rollup-plugin-typescript2';

export default {
  input: './src/index.ts',
  plugins: [commonjs(), ts(), nodeResolve(), sourcemaps()],
  output: {
    format: 'esm',
    sourcemap: true,
    file: 'dist/index.js',
    plugins: [
      flatDts({
        compilerOptions: {
          declarationMap: true /* Generate declaration maps */,
        },
      }),
    ],
  },
};
```

Declaration maps can be used by IDE to navigate to TypeScript source file instead of type declaration when both
available. This functionality relies on IDE heuristics, and declaration maps generated by this tool may not suit it
fully. So, don't be surprised if that does not work as expected.

[declarationmap]: https://www.typescriptlang.org/tsconfig#declarationMap

## Multiple Entries

By default, the generated `.d.ts` file contains `declare module` statements with the same `moduleName`.

If your package has additional [entry points] then you probably want to reflect this in type definition.
This can be achieved with `entries` option.

Here is an example configuration:

```javascript
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import flatDts from 'rollup-plugin-flat-dts';
import sourcemaps from 'rollup-plugin-sourcemaps';
import ts from 'rollup-plugin-typescript2';

export default {
  input: {
    main: './src/index.ts', // Main entry point
    node: './src/node/index.ts', // Node.js-specific API
    web: './src/browser/index.ts', // Browser-specific API
  },
  plugins: [commonjs(), ts(), nodeResolve(), sourcemaps()],
  output: {
    format: 'esm',
    sourcemap: true,
    dir: 'dist', // Place the output files to `dist` directory.
    entryFileNames: '[name].js', // Entry file names have `.js` extension.
    chunkFileNames: '_[name].js', // Chunks have underscore prefix.
    plugins: [
      flatDts({
        moduleName: 'my-package', // By default, exports belong to `my-package` module.
        entries: {
          node: {}, // All exports from `src/node` directory
          // belong to `my-package/node` sub-module.
          browser: {
            // All exports from `src/browser` directory
            as: 'web', // belong to `my-package/web` sub-module.
            // (Would be `my-package/browser` if omitted)
            lib: 'DOM', // Add `DOM` library reference.
            refs: false, // Do not add triple-slash file references to other entries.
            // Otherwise, a file reference will be added for each entry this one refers.
            file: 'web/index.d.ts', // Write type definitions to separate `.d.ts` file.
            // (Would be written to main `index.d.ts` if omitted)
          },
        },
      }),
    ],
  },
};
```

The `package.json` would contain the following then:

```json
{
  "name": "my-package",
  "type": "module",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/main.js",
    "./node": "./dist/node.js",
    "./web": "./dist/web.js"
  }
}
```

[entry points]: https://nodejs.org/dist/latest-v14.x/docs/api/packages.html#packages_package_entry_points

## Standalone Usage

The API is available standalone, without using Rollup:

```javascript
import { emitFlatDts } from 'rollup-plugin-flat-dts/api';

emitFlatDts({
  /* Type definition options */
})
  .then(flatDts => {
    if (flatDts.diagnostics.length) {
      console.error(flatDts.formatDiagnostics());
    }
    return flatDts.writeOut();
  })
  .catch(error => {
    console.error('Failed to generate type definitions', error);
    process.exit(1);
  });
```

## Algorithm Explained

The plugin algorithm is not very sophisticated, but simple and straightforward. This made it actually usable on my
projects, where [other tools] failed to generate valid type definitions.

The simplicity comes at a price. So, this plugin applies limitations on code base rather trying to resolve all
non-trivial cases.

So, here what this plugin is doing:

1. Generates single-file type definition by overriding original `tsconfig.json` options with the following:

   ```jsonc
   {
     // Avoid extra work
     "checkJs": false,
     // Ensure ".d.ts" modules are generated
     "declaration": true,
     // Prevent output to declaration directory
     "declarationDir": null,
     // Skip ".js" generation
     "emitDeclarationOnly": true,
     // Single file emission is impossible with this flag set
     "isolatedModules": false,
     // Generate single file
     // `System`, in contrast to `None`, permits the use of `import.meta`
     "module": "System",
     // When set to "Node16" or "NodeNext", or when unspecified
     // Otherwise, it conflicts with SystemJS
     "moduleResolution": "Node",
     // Always emit
     "noEmit": false,
     // Skip code generation when error occurs
     "noEmitOnError": true,
     // SystemJS does not support JSON module imports
     "resolveJsonModule": false,
     // Ignore errors in library type definitions
     "skipLibCheck": true,
     // Always strip internal exports
     "stripInternal": true,
     // Unsupported by SystemJS
     "verbatimModuleSyntax": false
   }
   ```

2. The generated file consists of `declare module "path/to/file" { ... }` statements. One such statement per each
   source file.

   The plugin replaces all `"path/to/file"` references with corresponding module name. I.e. either with
   `${packageName}`, or `${packageName}/${entry.as}` for matching entry point.

3. Updates all `import` and `export` statements and adjusts module references.

   Some imports and exports removed along the way. E.g. there is no point to import to the module from itself, unless
   the named import or export assigns an alias to the imported symbol.

4. Updates inner module declarations.

   Just like `2.`, but also expands declarations if inner module receives the same name as enclosing one.

5. Removes module declarations that became (or was originally) empty.

## Other Tools

[other tools]: #other-tools

- [rollup-plugin-dts] Does not support multiple entries, as far as I know.
- [@wessberg/rollup-plugin-ts] Is able to generate merged type definitions as well.
- [API extractor] Does not support multiple entries intentionally.

See more [here](https://github.com/timocov/dts-bundle-generator/discussions/68).

[rollup-plugin-dts]: https://www.npmjs.com/package/rollup-plugin-dts
[@wessberg/rollup-plugin-ts]: https://www.npmjs.com/package/@wessberg/rollup-plugin-ts
[api extractor]: https://api-extractor.com/
