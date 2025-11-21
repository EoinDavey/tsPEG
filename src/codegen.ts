import * as ts from 'typescript';

/**
 * Prints an array of AST nodes to a string.
 */
export function printNodes(nodes: ts.Node[]): string {
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const sourceFile = ts.createSourceFile(
        'parser.ts',
        '',
        ts.ScriptTarget.Latest,
        false,
        ts.ScriptKind.TS,
    );

    const nodeList = ts.factory.createNodeArray(nodes);
    return printer.printList(ts.ListFormat.MultiLine, nodeList, sourceFile);
}

/**
 * Prints a single AST node to a string. Useful for shimming during migration.
 */
export function printNode(node: ts.Node): string {
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const sourceFile = ts.createSourceFile(
        'temp.ts',
        '',
        ts.ScriptTarget.Latest,
        false,
        ts.ScriptKind.TS,
    );
    return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
}

export function createIdentifier(name: string): ts.Identifier {
    return ts.factory.createIdentifier(name);
}

export function createPropertyAccess(
    obj: ts.Expression,
    prop: string,
): ts.PropertyAccessExpression {
    return ts.factory.createPropertyAccessExpression(obj, prop);
}

export function createThis(): ts.ThisExpression {
    return ts.factory.createThis();
}

export function createEnumDeclaration(
    name: string,
    members: ts.EnumMember[],
    modifiers?: ts.Modifier[],
): ts.EnumDeclaration {
    return ts.factory.createEnumDeclaration(modifiers, name, members);
}

export function createEnumMember(
    name: string,
    initializer?: ts.Expression,
): ts.EnumMember {
    return ts.factory.createEnumMember(name, initializer);
}

export function createVariableStatement(
    variableName: string,
    initializer: ts.Expression,
    modifiers?: ts.Modifier[],
): ts.VariableStatement {
    return ts.factory.createVariableStatement(
        modifiers,
        ts.factory.createVariableDeclarationList(
            [ts.factory.createVariableDeclaration(variableName, undefined, undefined, initializer)],
            ts.NodeFlags.Const,
        ),
    );
}

export function createTypeAliasDeclaration(
    name: string,
    type: ts.TypeNode,
    modifiers?: ts.Modifier[],
): ts.TypeAliasDeclaration {
    return ts.factory.createTypeAliasDeclaration(modifiers, name, undefined, type);
}

export function createStringLiteral(text: string): ts.StringLiteral {
    return ts.factory.createStringLiteral(text);
}

export function createNumericLiteral(value: number): ts.NumericLiteral {
    return ts.factory.createNumericLiteral(value);
}

export function createAsExpression(
    expression: ts.Expression,
    type: ts.TypeNode,
): ts.AsExpression {
    return ts.factory.createAsExpression(expression, type);
}

export function createTypeReferenceNode(typeName: string | ts.Identifier, typeArguments?: ts.TypeNode[]): ts.TypeReferenceNode {
    return ts.factory.createTypeReferenceNode(typeName, typeArguments);
}

export function createLiteralTypeNode(literal: ts.LiteralExpression): ts.LiteralTypeNode {
    return ts.factory.createLiteralTypeNode(literal);
}

export function createUnionTypeNode(types: ts.TypeNode[]): ts.UnionTypeNode {
    return ts.factory.createUnionTypeNode(types);
}

export function createPropertyAssignment(name: string, initializer: ts.Expression): ts.PropertyAssignment {
    return ts.factory.createPropertyAssignment(name, initializer);
}

