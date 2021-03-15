import ts from 'typescript';

/**
 * @internal
 */
export class DtsNodeChildren extends Set<ts.Node> {

  constructor(node: ts.Node) {
    super();

    ts.forEachChild(node, child => this.add(child));

    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (node.kind) {
    case ts.SyntaxKind.ModuleDeclaration:
      this._addModuleDecl(node as ts.ModuleDeclaration);
      break;
    case ts.SyntaxKind.ModuleBlock:
      this._addModuleBlock(node as ts.ModuleBlock);
      break;
    case ts.SyntaxKind.ClassExpression:
    case ts.SyntaxKind.ClassDeclaration:
    case ts.SyntaxKind.InterfaceDeclaration:
      this._addInterfaceDecl(node as ts.InterfaceDeclaration);
      break;
    case ts.SyntaxKind.TypeAliasDeclaration:
      this._addTypeAliasDecl(node as ts.TypeAliasDeclaration);
      break;
    case ts.SyntaxKind.EnumDeclaration:
      this._addEnumDecl(node as ts.EnumDeclaration);
      break;
    case ts.SyntaxKind.EnumMember:
      this._addEnumMember(node as ts.EnumMember);
      break;
    case ts.SyntaxKind.CallSignature:
    case ts.SyntaxKind.Constructor:
    case ts.SyntaxKind.ConstructSignature:
    case ts.SyntaxKind.ConstructorType:
    case ts.SyntaxKind.MethodSignature:
    case ts.SyntaxKind.MethodDeclaration:
    case ts.SyntaxKind.IndexSignature:
    case ts.SyntaxKind.FunctionType:
    case ts.SyntaxKind.JSDocFunctionType:
    case ts.SyntaxKind.FunctionDeclaration:
    case ts.SyntaxKind.GetAccessor:
    case ts.SyntaxKind.SetAccessor:
    case ts.SyntaxKind.FunctionExpression:
    case ts.SyntaxKind.ArrowFunction:
      this._addFunctionDecl(node as ts.SignatureDeclarationBase);
      break;
    case ts.SyntaxKind.QualifiedName:
      this._addQualifiedName(node as ts.QualifiedName);
      break;
    case ts.SyntaxKind.ComputedPropertyName:
      this._addComputedPropertyName(node as ts.ComputedPropertyName);
      break;
    case ts.SyntaxKind.TypeParameter:
      this._addTypeParameterDecl(node as ts.TypeParameterDeclaration);
      break;
    case ts.SyntaxKind.VariableDeclaration:
      this._addVariableDecl(node as ts.VariableDeclaration);
      break;
    case ts.SyntaxKind.Parameter:
      this._addParameterDecl(node as ts.ParameterDeclaration);
      break;
    case ts.SyntaxKind.BindingElement:
      this._addBindingElement(node as ts.BindingElement);
      break;
    case ts.SyntaxKind.PropertySignature:
      this._addPropertySignature(node as ts.PropertySignature);
      break;
    case ts.SyntaxKind.PropertyDeclaration:
      this._addPropertyDecl(node as ts.PropertyDeclaration);
      break;
    case ts.SyntaxKind.ObjectBindingPattern:
    case ts.SyntaxKind.ArrayBindingPattern:
      this._addBindingPattern(node as ts.BindingPattern);
      break;
    case ts.SyntaxKind.TypeReference:
      this._addTypeReference(node as ts.TypeReferenceNode);
      break;
    case ts.SyntaxKind.TypePredicate:
      this._addTypePredicate(node as ts.TypePredicateNode);
      break;
    case ts.SyntaxKind.TypeQuery:
      this._addTypeQuery(node as ts.TypeQueryNode);
      break;
    case ts.SyntaxKind.TypeLiteral:
      this._addTypeLiteral(node as ts.TypeLiteralNode);
      break;
    case ts.SyntaxKind.TupleType:
      this._addTupleType(node as ts.TupleTypeNode);
      break;
    case ts.SyntaxKind.NamedTupleMember:
      this._addNamedTupleMember(node as ts.NamedTupleMember);
      break;
    case ts.SyntaxKind.OptionalType:
      this._addOptionalType(node as ts.OptionalTypeNode);
      break;
    case ts.SyntaxKind.RestType:
      this._addRestType(node as ts.RestTypeNode);
      break;
    case ts.SyntaxKind.UnionType:
    case ts.SyntaxKind.IntersectionType:
      this._addUnionOrIntersectionType(node as ts.UnionOrIntersectionTypeNode);
      break;
    case ts.SyntaxKind.ConditionalType:
      this._addConditionalType(node as ts.ConditionalTypeNode);
      break;
    case ts.SyntaxKind.InferType:
      this._addInferType(node as ts.InferTypeNode);
      break;
    case ts.SyntaxKind.ParenthesizedType:
      this._addParenthesizedType(node as ts.ParenthesizedTypeNode);
      break;
    case ts.SyntaxKind.TypeOperator:
      this._addTypeOperator(node as ts.TypeOperatorNode);
      break;
    case ts.SyntaxKind.IndexedAccessType:
      this._addIndexedAccessType(node as ts.IndexedAccessTypeNode);
      break;
    case ts.SyntaxKind.MappedType:
      this._addMappedType(node as ts.MappedTypeNode);
      break;
    case ts.SyntaxKind.LiteralType:
      this._addLiteralType(node as ts.LiteralTypeNode);
      break;
    case ts.SyntaxKind.TemplateLiteralType:
      this._addTemplateLiteralType(node as ts.TemplateLiteralTypeNode);
      break;
    case ts.SyntaxKind.TemplateLiteralTypeSpan:
      this._addTemplateLiteralTypeSpan(node as ts.TemplateLiteralTypeSpan);
      break;
    case ts.SyntaxKind.ImportDeclaration:
      this._addImportDecl(node as ts.ImportDeclaration);
      break;
    case ts.SyntaxKind.ImportClause:
      this._addImportClause(node as ts.ImportClause);
      break;
    case ts.SyntaxKind.ExportDeclaration:
      this._addExportDecl(node as ts.ExportDeclaration);
      break;
    case ts.SyntaxKind.NamespaceImport:
    case ts.SyntaxKind.NamespaceExport:
    case ts.SyntaxKind.NamespaceExportDeclaration:
      this._addNamedDecl(node as ts.NamedDeclaration);
      break;
    case ts.SyntaxKind.NamedImports:
    case ts.SyntaxKind.NamedExports:
      this._addNamedImportsOrExports(node as ts.NamedImportsOrExports);
      break;
    case ts.SyntaxKind.ImportSpecifier:
    case ts.SyntaxKind.ExportSpecifier:
      this._addImportOrExportSpecifier(node as ts.ImportOrExportSpecifier);
      break;
    case ts.SyntaxKind.ImportEqualsDeclaration:
      this._addImportEqualsDecl(node as ts.ImportEqualsDeclaration);
      break;
    case ts.SyntaxKind.ExternalModuleReference:
      this._addExternalModuleRef(node as ts.ExternalModuleReference);
      break;
    case ts.SyntaxKind.ExportAssignment:
      this._addExportAssignment(node as ts.ExportAssignment);
      break;
    }
  }

  private _add(...nodes: (ts.Node | (readonly ts.Node[]) | undefined)[]): void {
    nodes.forEach(node => {
      if (node) {
        if (isNodeArray(node)) {
          node.forEach(n => this.add(n));
        } else {
          this.add(node);
        }
      }
    });
  }

  private _addNamedDecl({ name }: ts.NamedDeclaration): void {
    this._add(name);
  }

  private _addModuleDecl({ name, body }: ts.ModuleDeclaration): void {
    this._add(name, body);
  }

  private _addModuleBlock({ statements }: ts.ModuleBlock): void {
    this._add(...statements);
  }

  private _addInterfaceDecl(
      {
        name,
        typeParameters,
        heritageClauses,
        members,
      }: ts.InterfaceDeclaration | ts.ClassLikeDeclarationBase,
  ): void {
    this._add(name, typeParameters, heritageClauses, members);
  }

  private _addTypeAliasDecl({ name, typeParameters, type }: ts.TypeAliasDeclaration): void {
    this._add(name, typeParameters, type);
  }

  private _addEnumDecl({ name, members }: ts.EnumDeclaration): void {
    this.add(name);
    this._add(members);
  }

  private _addEnumMember({ name, initializer }: ts.EnumMember): void {
    this._add(name, initializer);
  }

  private _addFunctionDecl({ name, typeParameters, parameters, type }: ts.SignatureDeclarationBase): void {
    this._add(name, typeParameters, parameters, type);
  }

  private _addQualifiedName({ left, right }: ts.QualifiedName): void {
    this._add(left, right);
  }

  private _addComputedPropertyName({ expression }: ts.ComputedPropertyName): void {
    this._add(expression);
  }

  private _addTypeParameterDecl({ name, constraint, default: dft, expression }: ts.TypeParameterDeclaration): void {
    this._add(name, constraint, dft, expression);
  }

  private _addVariableDecl({ name, exclamationToken, type, initializer }: ts.VariableDeclaration): void {
    this._add(name, exclamationToken, type, initializer);
  }

  private _addParameterDecl(
      {
        dotDotDotToken,
        name,
        questionToken,
        type,
        initializer,
      }: ts.ParameterDeclaration,
  ): void {
    this._add(dotDotDotToken, name, questionToken, type, initializer);
  }

  private _addBindingElement({ propertyName, dotDotDotToken, name, initializer }: ts.BindingElement): void {
    this._add(propertyName, dotDotDotToken, name, initializer);
  }

  private _addPropertySignature({ name, questionToken, type, initializer }: ts.PropertySignature): void {
    this._add(name, questionToken, type, initializer);
  }

  private _addPropertyDecl(
      {
        name,
        questionToken,
        exclamationToken,
        type,
        initializer,
      }: ts.PropertyDeclaration,
  ): void {
    this._add(name, questionToken, exclamationToken, type, initializer);
  }

  private _addBindingPattern({ parent, elements }: ts.BindingPattern): void {
    this._add(parent, ...elements);
  }

  private _addTypeReference({ typeName, typeArguments }: ts.TypeReferenceNode): void {
    this._add(typeName, typeArguments);
  }

  private _addTypePredicate({ assertsModifier, parameterName, type }: ts.TypePredicateNode): void {
    this._add(assertsModifier, parameterName, type);
  }

  private _addTypeQuery({ exprName }: ts.TypeQueryNode): void {
    this._add(exprName);
  }

  private _addTypeLiteral({ members }: ts.TypeLiteralNode): void {
    this._add(...members);
  }

  private _addTupleType({ elements }: ts.TupleTypeNode): void {
    this._add(...elements);
  }

  private _addNamedTupleMember({ dotDotDotToken, name, questionToken, type }: ts.NamedTupleMember): void {
    this._add(dotDotDotToken, name, questionToken, type);
  }

  private _addOptionalType({ type }: ts.OptionalTypeNode): void {
    this._add(type);
  }

  private _addRestType({ type }: ts.RestTypeNode): void {
    this._add(type);
  }

  private _addUnionOrIntersectionType({ types }: ts.UnionOrIntersectionTypeNode): void {
    this._add(...types);
  }

  private _addConditionalType({ checkType, extendsType, trueType, falseType }: ts.ConditionalTypeNode): void {
    this._add(checkType, extendsType, trueType, falseType);
  }

  private _addInferType({ typeParameter }: ts.InferTypeNode): void {
    this._add(typeParameter);
  }

  private _addParenthesizedType({ type }: ts.ParenthesizedTypeNode): void {
    this._add(type);
  }

  private _addTypeOperator({ type }: ts.TypeOperatorNode): void {
    this._add(type);
  }

  private _addIndexedAccessType({ objectType, indexType }: ts.IndexedAccessTypeNode): void {
    this._add(objectType, indexType);
  }

  private _addMappedType({ readonlyToken, typeParameter, nameType, questionToken, type }: ts.MappedTypeNode): void {
    this._add(readonlyToken, typeParameter, nameType, questionToken, type);
  }

  private _addLiteralType({ literal }: ts.LiteralTypeNode): void {
    this._add(literal);
  }

  private _addTemplateLiteralType({ head, templateSpans }: ts.TemplateLiteralTypeNode): void {
    this._add(head, ...templateSpans);
  }

  private _addTemplateLiteralTypeSpan({ type, literal }: ts.TemplateLiteralTypeSpan): void {
    this._add(type, literal);
  }

  private _addImportDecl({ importClause, moduleSpecifier }: ts.ImportDeclaration): void {
    this._add(importClause, moduleSpecifier);
  }

  private _addExportDecl({ exportClause, moduleSpecifier }: ts.ExportDeclaration): void {
    this._add(exportClause, moduleSpecifier);
  }

  private _addImportClause({ name, namedBindings }: ts.ImportClause): void {
    this._add(name, namedBindings);
  }

  private _addNamedImportsOrExports({ elements }: ts.NamedImportsOrExports): void {
    this._add(elements);
  }

  private _addImportOrExportSpecifier({ propertyName, name }: ts.ImportOrExportSpecifier): void {
    this._add(propertyName, name);
  }

  private _addImportEqualsDecl({ name, moduleReference }: ts.ImportEqualsDeclaration): void {
    this._add(name, moduleReference);
  }

  private _addExternalModuleRef({ expression }: ts.ExternalModuleReference): void {
    this.add(expression);
  }

  private _addExportAssignment({ expression }: ts.ExportAssignment): void {
    this.add(expression);
  }

}

function isNodeArray(node: ts.Node | (readonly ts.Node[]) | undefined): node is readonly ts.Node[] {
  return Array.isArray(node);
}
