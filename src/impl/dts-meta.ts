import ts from 'typescript';

export class DtsMeta {
  private readonly _declaredModules: ReadonlySet<string>;

  constructor(source: ts.SourceFile) {
    const declaredModules = new Set<string>();

    for (const statement of source.statements) {
      if (statement.kind === ts.SyntaxKind.ModuleDeclaration) {
        const { name } = statement as ts.ModuleDeclaration;

        if (!ts.isMemberName(name)) {
          declaredModules.add(name.text);
        }
      }
    }

    this._declaredModules = declaredModules;
  }

  isModuleDeclared(name: string): boolean {
    return this._declaredModules.has(name);
  }
}
