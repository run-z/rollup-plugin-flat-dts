import { resolve } from 'node:path';
import ts from 'typescript';
import type { FlatDts } from '../api';
import { createFlatDts } from './create-flat-dts';
import { DtsContent } from './dts-content';
import type { DtsSource } from './dts-source';
import { ModuleIndex } from './module-index';
import type { ModuleInfo } from './module-info';
import { allTransformed, noneTransformed, TopLevelStatement, Transformed } from './transformed';

export class DtsTransformer {

  private readonly _index: ModuleIndex;

  constructor(private readonly _source: DtsSource) {
    this._index = new ModuleIndex(_source);
  }

  async transform(initialDiagnostics: readonly ts.Diagnostic[]): Promise<FlatDts> {

    const topLevel = await this._transform();
    const diagnostics: ts.Diagnostic[] = initialDiagnostics.slice();
    const files = this._emitFiles(topLevel, diagnostics);

    return createFlatDts(files, diagnostics);
  }

  private _emitFiles(
      statements: readonly Transformed<TopLevelStatement[]>[],
      diagnostics: ts.Diagnostic[],
  ): readonly FlatDts.File[] {

    const contentByPath = new Map<string, DtsContent>();

    for (const { to: topLevel, dia, refs } of statements) {
      if (dia) {
        diagnostics.push(...dia);
      }

      for (const [info, statement] of topLevel) {
        if (info.file) {

          const key = resolve(info.file);
          let dtsContent = contentByPath.get(key);

          if (!dtsContent) {
            dtsContent = new DtsContent(this._source, info);
            contentByPath.set(key, dtsContent);
          }

          dtsContent.refer(refs).append(statement);
        }
      }
    }

    return [...contentByPath.values()].flatMap(content => content.toFiles());
  }

  private async _transform(): Promise<Transformed<TopLevelStatement[]>[]> {
    return Promise.all(
        this._source.source.statements.map(
            statement => this._topLevel(statement),
        ),
    );
  }

  private async _topLevel(statement: ts.Statement): Promise<Transformed<TopLevelStatement[]>> {
    if (statement.kind === ts.SyntaxKind.ModuleDeclaration) {
      return this._topLevelModuleDecl(statement as ts.ModuleDeclaration);
    }

    return { to: [[await this._index.main(), statement]] };
  }

  private async _topLevelModuleDecl(
      decl: ts.ModuleDeclaration,
  ): Promise<Transformed<TopLevelStatement[]>> {
    if (ts.isMemberName(decl.name)) {
      return { to: [[await this._index.main(), decl]] };
    }

    const moduleName = decl.name.text;
    const target = await this._index.byName(moduleName);

    if (target.isExternal) {
      // External module remains as is.
      return { to: [[await this._index.main(), decl]] };
    }
    if (target.isInternal) {
      // Remove internal module declarations.
      return noneTransformed();
    }

    // Rename the module.
    const { to: [body], dia, refs } = await this._moduleBody(target, decl);

    return {
      to: body
          ? [[
            target,
            ts.factory.updateModuleDeclaration(
                decl,
                decl.decorators,
                decl.modifiers,
                ts.factory.createStringLiteral(target.declareAs),
                body,
            ),
          ]]
          : [],
      dia,
      refs,
    };
  }

  private async _moduleBody(
      enclosing: ModuleInfo,
      decl: ts.ModuleDeclaration,
  ): Promise<Transformed<[ts.ModuleBody]>> {

    const { body } = decl;

    if (!isBodyBlock(body)) {
      return noneTransformed();
    }

    const { to: statements, dia, refs }: Transformed<ts.Statement[]> = await allTransformed(body.statements.map(
        statement => this._statement(enclosing, statement),
    ));

    if (!statements.length) {
      return noneTransformed();
    }

    return {
      to: [ts.factory.updateModuleBlock(body, statements)],
      dia,
      refs,
    };
  }

  private async _statement(
      enclosing: ModuleInfo,
      statement: ts.Statement,
  ): Promise<Transformed<ts.Statement[]>> {
    switch (statement.kind) {
    case ts.SyntaxKind.ImportDeclaration:
      return this._import(enclosing, statement as ts.ImportDeclaration);
    case ts.SyntaxKind.ExportDeclaration:
      return this._export(enclosing, statement as ts.ExportDeclaration);
    case ts.SyntaxKind.ModuleDeclaration:
      return this._innerModuleDecl(enclosing, statement as ts.ModuleDeclaration);
    default:
      return { to: [statement] };
    }
  }

  private async _import(
      enclosing: ModuleInfo,
      statement: ts.ImportDeclaration,
  ): Promise<Transformed<[ts.ImportDeclaration]>> {

    const { moduleSpecifier } = statement;

    if (moduleSpecifier.kind !== ts.SyntaxKind.StringLiteral) {
      // Invalid syntax?
      return { to: [statement] };
    }

    const { text: from } = moduleSpecifier as ts.StringLiteral;
    const fromModule = await this._index.byName(from);

    if (fromModule.declareAs !== enclosing.declareAs) {
      // Import from another module.

      if (fromModule.isInternal) {
        // Drop import from internal module.
        return noneTransformed();
      }

      // Replace module reference.
      return {
        to: [ts.factory.updateImportDeclaration(
            statement,
            statement.decorators,
            statement.modifiers,
            statement.importClause,
            ts.factory.createStringLiteral(fromModule.declareAs),
            statement.assertClause,
        )],
        refs: [fromModule],
      };
    }

    // Import from the same module.
    const { importClause } = statement;

    if (!importClause) {
      // No import clause. Remove the import.
      return noneTransformed();
    }

    const { name } = importClause;
    let { namedBindings } = importClause;

    if (namedBindings && namedBindings.kind === ts.SyntaxKind.NamedImports) {
      // Preserve aliased imports only.

      const elements = namedBindings.elements.filter(spec => !!spec.propertyName);

      if (elements.length) {
        namedBindings = ts.factory.updateNamedImports(namedBindings, elements);
      } else {
        namedBindings = undefined;
      }
    }

    if (!name && !namedBindings) {
      // No need in import statement.
      return noneTransformed();
    }

    return {
      to: [
        ts.factory.updateImportDeclaration(
            statement,
            statement.decorators,
            statement.modifiers,
            ts.factory.updateImportClause(
                importClause,
                importClause.isTypeOnly,
                name,
                namedBindings,
            ),
            ts.factory.createStringLiteral(enclosing.declareAs),
            statement.assertClause,
        ),
      ],
      dia: name ? [this._diagnostics(statement, 'Unsupported default import')] : undefined,
    };
  }

  private async _export(
      enclosing: ModuleInfo,
      statement: ts.ExportDeclaration,
  ): Promise<Transformed<[ts.ExportDeclaration]>> {

    const { moduleSpecifier } = statement;

    if (!moduleSpecifier) {
      // No module specifier.
      // The export remains as is.
      return { to: [statement] };
    }
    if (moduleSpecifier.kind !== ts.SyntaxKind.StringLiteral) {
      // Invalid syntax?
      return { to: [statement] };
    }

    const { text: from } = moduleSpecifier as ts.StringLiteral;
    const fromModule = await this._index.byName(from);

    if (fromModule.declareAs !== enclosing.declareAs) {
      // Export from another module.

      if (fromModule.isInternal) {
        // Drop export from internal module.
        return noneTransformed();
      }

      // Replace module reference.
      return {
        to: [ts.factory.updateExportDeclaration(
            statement,
            statement.decorators,
            statement.modifiers,
            statement.isTypeOnly,
            statement.exportClause,
            ts.factory.createStringLiteral(fromModule.declareAs),
            statement.assertClause,
        )],
        refs: [fromModule],
      };
    }

    // Export from the same module.
    const { exportClause } = statement;

    if (!exportClause) {
      // No need to re-export.
      return noneTransformed();
    }

    if (exportClause.kind === ts.SyntaxKind.NamedExports) {
      // Preserve aliased exports only.

      const elements = exportClause.elements.filter(spec => !!spec.propertyName);

      if (!elements.length) {
        return noneTransformed();
      }

      return {
        to: [ts.factory.updateExportDeclaration(
            statement,
            statement.decorators,
            statement.modifiers,
            statement.isTypeOnly,
            ts.factory.updateNamedExports(exportClause, elements),
            undefined,
            statement.assertClause,
        )],
      };
    }

    // Namespace export.
    // Remains as is, but this would break the `.d.ts`.
    return {
      to: [statement],
      dia: [this._diagnostics(statement, 'Unsupported default export')],
    };
  }

  private async _innerModuleDecl(
      enclosing: ModuleInfo,
      decl: ts.ModuleDeclaration,
  ): Promise<Transformed<ts.Statement[]>> {
    if (ts.isMemberName(decl.name)) {
      return { to: [decl] };
    }

    const moduleName = decl.name.text;
    const target = await this._index.byName(moduleName);

    if (target.isExternal) {
      return { to: [decl] };
    }
    if (target.isInternal) {
      return noneTransformed();
    }

    if (target === enclosing) {
      // No need to re-declare the module within itself.

      const { body } = decl;

      if (!isBodyBlock(body)) {
        return noneTransformed();
      }

      // Expand module body.
      return allTransformed(body.statements.map(
          statement => this._statement(enclosing, statement),
      ));
    }

    // Rename the module.
    const { to: [body], dia, refs } = await this._moduleBody(target, decl);

    return {
      to: body
          ? [ts.factory.updateModuleDeclaration(
              decl,
              decl.decorators,
              decl.modifiers,
              ts.factory.createStringLiteral(target.declareAs),
              body,
          )]
          : [],
      dia,
      refs,
    };
  }

  private _diagnostics(node: ts.Node, messageText: string): ts.DiagnosticWithLocation {

    const { source } = this._source;
    const start = node.getStart(source);
    const end = node.getEnd();

    return {
      category: ts.DiagnosticCategory.Error,
      code: 9999,
      file: source,
      start: start,
      length: end - start,
      messageText,
    };
  }

}

function isBodyBlock(body: ts.ModuleDeclaration['body']): body is ts.ModuleBlock {
  return !!body && ts.isModuleBlock(body);
}
