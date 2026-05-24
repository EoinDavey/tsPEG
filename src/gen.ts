import { Parser, PosInfo, SyntaxErr }  from "./parser.gen";
import { expandTemplate } from "./template";
import { Block, writeBlock } from "./util";
import { BannedNamesChecker, Checker, NoKeywords, NoRuleNameCollisionChecker, RulesExistChecker } from "./checks";
import { matchType } from "./types";
import { matchRule } from "./rules";
import { getRulesToMarkForBoundedRecursion } from "./leftrec";
import { ModelBuilder } from './builder';
import { EOFMatch, Grammar, MatchExpression, MatchExpressionKind, MatchSequence, PostfixExpression, PostfixOpKind, Rule } from "./model";
import { ExpansionVisitor } from "./expansionvisitor";
import { SimpleVisitor } from "./simplevisitor";
import * as ts from 'typescript';
import {
    createBlock,
    createClassDeclaration,
    createConstructor,
    createEnumDeclaration,
    createEnumMember,
    createInterfaceDeclaration,
    createLiteralTypeNode,
    createNumericLiteral,
    createParameter,
    createPropertyAssignment,
    createPropertyDeclaration,
    createPropertySignature,
    createReturnStatement,
    createStringLiteral,
    createTypeAliasDeclaration,
    createUnionTypeNode,
    printNodes,
} from "./codegen";

// addScope adds a prefix that uses illegal characters to
// ensure namespace separation wrt generated vs user supplied IDs
function addScope(id: string): string {
    return "$scope$" + id;
}

function memoName(id: string): string {
    return addScope(id + "$memo");
}

/**
 * Extracts the name and TypeScript type of all named matches in a MatchSequence.
 * This is the model-aware equivalent of the old `getNamedTypes` function.
 * @param sequence The MatchSequence from the semantic model.
 * @returns An array of tuples, where each tuple is [matchName, typeAsString].
 */
function getNamedTypesFromModel(sequence: MatchSequence): [string, string][] {
    const types: [string, string][] = [];
    for (const match of sequence.matches) {
        if (match.name === null) {
            continue;
        }
        const type = matchType(match.expression);
        types.push([match.name, type]);
    }
    return types;
}

function buildAstKindsByName(astKinds: string[], numEnums: boolean): ReadonlyMap<string, string> {
    const astKindsByName = new Map<string, string>();
    astKinds.forEach((kind, index) => {
        astKindsByName.set(kind, numEnums ? String(index) : `"${kind}"`);
    });
    return astKindsByName;
}

export function getMatchedSubstr(t: {start: PosInfo, end: PosInfo}, inputStr: string): string {
    return inputStr.substring(t.start.overallPos, t.end.overallPos);
}

// We use a class so we can do an instanceof check
export class SyntaxErrs {
    constructor(public errs: SyntaxErr[]) {
    }
}

export class Generator {
    public readonly model: Grammar;
    // Whether to use strings or numbers for AST kinds
    private numEnums: boolean;
    // Whether to use an enum or a union of string/number constants for AST kinds
    private erasableSyntax: boolean;
    private enableMemos: boolean;
    private regexFlags: string;
    private includeGrammar: boolean;

    private input: string;
    private checkers: Checker[] = [];
    private header: string | null;
    private boundedRecRules: Set<string>;
    private readonly astKinds: string[];
    private readonly astKindsByName: ReadonlyMap<string, string>;

    public constructor(input: string, numEnums = false, enableMemos = false, regexFlags = "", includeGrammar = true, erasableSyntax = false) {
        this.input = input;
        this.numEnums = numEnums;
        this.erasableSyntax = erasableSyntax;
        this.enableMemos = enableMemos;
        this.regexFlags = regexFlags;
        this.includeGrammar = includeGrammar;
        const p = new Parser(this.input);
        const res = p.parse();
        if (res.errs.length > 0)
            throw new SyntaxErrs(res.errs);
        if (!res.ast)
            throw new Error("No AST found");
        this.header = res.ast.header?.content ?? null;
        const modelBuilder = new ModelBuilder(this.input);
        this.model = modelBuilder.build(res.ast);
        this.astKinds = this.getExpandedRules().flatMap(rule => rule.definition.alternatives.map(alt => alt.name));
        if(this.usesEOFInModel())
            this.astKinds.push("$EOF");
        this.boundedRecRules = getRulesToMarkForBoundedRecursion(this.model);
        this.astKindsByName = buildAstKindsByName(this.astKinds, this.numEnums);
    }

    public addChecker(c: Checker): this {
        this.checkers.push(c);
        return this;
    }

    private usesEOFInModel(): boolean {
        const visitor = new class extends SimpleVisitor {
            public foundEOF = false;
            visitEOFMatch(_expr: EOFMatch){
                this.foundEOF = true;
            }
        };
        this.model.accept(visitor);
        return visitor.foundEOF;
    }

    private getExpandedRules(): Rule[] {
        const visitor = new ExpansionVisitor();
        this.model.accept(visitor);
        return visitor.rules;
    }

    public writeKinds(): ts.Statement[] {
        const astKindsStatements: ts.Statement[] = [];
        const kindMembers: ts.EnumMember[] = [];
        const typeUnionMembers: ts.TypeNode[] = [];
        const kindProperties: ts.PropertyAssignment[] = [];

        this.astKinds.forEach((kind, index) => {
            if (this.numEnums) {
                kindMembers.push(createEnumMember(kind, createNumericLiteral(index)));
                typeUnionMembers.push(createLiteralTypeNode(createNumericLiteral(index)));
                kindProperties.push(createPropertyAssignment(kind, createNumericLiteral(index)));
            } else {
                kindMembers.push(createEnumMember(kind, createStringLiteral(kind)));
                typeUnionMembers.push(createLiteralTypeNode(createStringLiteral(kind)));
                kindProperties.push(createPropertyAssignment(kind, createStringLiteral(kind)));
            }
        });

        if (this.erasableSyntax) {
            astKindsStatements.push(
                ts.factory.createVariableStatement(
                    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
                    ts.factory.createVariableDeclarationList(
                        [ts.factory.createVariableDeclaration(
                            "ASTKinds",
                            undefined,
                            undefined,
                            ts.factory.createAsExpression(
                                ts.factory.createObjectLiteralExpression(kindProperties, true),
                                ts.factory.createTypeReferenceNode("const"),
                            ),
                        )],
                        ts.NodeFlags.Const,
                    ),
                ),
                createTypeAliasDeclaration(
                    "ASTKinds",
                    createUnionTypeNode(typeUnionMembers),
                    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
                ),
            );
        } else {
            astKindsStatements.push(
                createEnumDeclaration(
                    "ASTKinds",
                    kindMembers,
                    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
                ),
            );
        }
        return astKindsStatements;
    }

    private memoRules(): Rule[] {
        const allRules = this.getExpandedRules();
        return this.enableMemos
            ? allRules
            : allRules
                .filter(rule => this.boundedRecRules.has(rule.name));
    }

    public writeMemos(): ts.PropertyDeclaration[] {
        return this.memoRules().map(rule =>
            createPropertyDeclaration(
                memoName(rule.name),
                ts.factory.createTypeReferenceNode("Map", [
                    ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
                    ts.factory.createTupleTypeNode([
                        ts.factory.createTypeReferenceNode("Nullable", [ts.factory.createTypeReferenceNode(rule.name)]),
                        ts.factory.createTypeReferenceNode("PosInfo"),
                    ]),
                ]),
                ts.factory.createNewExpression(
                    ts.factory.createIdentifier("Map"),
                    undefined,
                    [],
                ),
                [ts.factory.createModifier(ts.SyntaxKind.ProtectedKeyword)],
            ),
        );
    }

    public writeMemoClearFn(): ts.MethodDeclaration[] {
        const statements = this.memoRules().map(rule =>
            ts.factory.createExpressionStatement(
                ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(
                        ts.factory.createPropertyAccessExpression(
                            ts.factory.createThis(),
                            memoName(rule.name),
                        ),
                        "clear",
                    ),
                    undefined,
                    [],
                ),
            ),
        );

        return [ts.factory.createMethodDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
            undefined,
            "clearMemos",
            undefined,
            undefined,
            [],
            ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
            createBlock(statements, true),
        )];
    }

    public writeChoice(name: string, sequence: MatchSequence): ts.Statement[] {
        const type = sequence.getType();

        if (type === 'alias') {
            const expressionType = matchType(sequence.matches[0].expression);
            return [createTypeAliasDeclaration(
                name,
                ts.factory.createTypeReferenceNode(expressionType),
                [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            )];
        }

        const namedTypes = getNamedTypesFromModel(sequence);

        if (type === 'class') {
            return [createClassDeclaration(
                name,
                [
                    createPropertyDeclaration(
                        "kind",
                        ts.factory.createTypeReferenceNode(this.astKindsType(name)),
                        ts.factory.createPropertyAccessExpression(
                            ts.factory.createIdentifier("ASTKinds"),
                            name,
                        ),
                        [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
                    ),
                    ...namedTypes.map((x) => createPropertyDeclaration(
                        x[0],
                        ts.factory.createTypeReferenceNode(x[1]),
                        undefined,
                        [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
                    )),
                    ...sequence.attributes.map((attr) => createPropertyDeclaration(
                        attr.name,
                        ts.factory.createTypeReferenceNode(attr.type),
                        undefined,
                        [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
                    )),
                    createConstructor(
                        namedTypes.map((x) => createParameter(
                            x[0],
                            ts.factory.createTypeReferenceNode(x[1]),
                        )),
                        createBlock([
                            ...namedTypes.map((x) => ts.factory.createExpressionStatement(
                                ts.factory.createBinaryExpression(
                                    ts.factory.createPropertyAccessExpression(
                                        ts.factory.createThis(),
                                        x[0],
                                    ),
                                    ts.SyntaxKind.EqualsToken,
                                    ts.factory.createIdentifier(x[0]),
                                ),
                            )),
                            ...sequence.attributes.map(attr => {
                                const functionWrapper = `function temp() { ${attr.code} }`;
                                const sourceFile = ts.createSourceFile('temp.ts', functionWrapper, ts.ScriptTarget.Latest, false);
                                const fnDecl = sourceFile.statements[0] as ts.FunctionDeclaration;
                                if (!fnDecl.body) {
                                    throw new Error(`Computed property has no body: ${attr.code}`);
                                }
                                const bodyStmts = Array.from(fnDecl.body.statements);

                                return ts.factory.createExpressionStatement(
                                    ts.factory.createBinaryExpression(
                                        ts.factory.createPropertyAccessExpression(
                                            ts.factory.createThis(),
                                            attr.name,
                                        ),
                                        ts.SyntaxKind.EqualsToken,
                                        ts.factory.createCallExpression(
                                            ts.factory.createArrowFunction(
                                                undefined,
                                                undefined,
                                                [],
                                                ts.factory.createTypeReferenceNode(attr.type),
                                                ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                                                ts.factory.createBlock(bodyStmts, true),
                                            ),
                                            undefined,
                                            [],
                                        ),
                                    ),
                                );
                            }),
                        ], true),
                    ),
                ],
                [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            )];
        }

        // The remaining case is 'interface'
        return [createInterfaceDeclaration(
            name,
            [
                createPropertySignature(
                    "kind",
                    ts.factory.createTypeReferenceNode(this.astKindsType(name)),
                ),
                ...namedTypes.map((x) => createPropertySignature(
                    x[0],
                    ts.factory.createTypeReferenceNode(x[1]),
                )),
            ],
            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        )];
    }

    public writeRuleClasses(): ts.Statement[] {
        const expandedRules = this.getExpandedRules();
        const allStatements: ts.Statement[] = [];

        for (const rule of expandedRules) {
            const alternatives = rule.definition.alternatives;

            // Generate union type if needed
            if (alternatives.length > 1) {
                const unionNames = alternatives.map(alt => alt.name);
                allStatements.push(createTypeAliasDeclaration(
                    rule.name,
                    ts.factory.createUnionTypeNode(
                        unionNames.map(name => ts.factory.createTypeReferenceNode(name)),
                    ),
                    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
                ));
            }

            // Generate the interface/class/alias for each alternative
            for (const alternative of alternatives) {
                allStatements.push(...this.writeChoice(alternative.name, alternative));
            }
        }
        return allStatements;
    }

    public writeParseIfStmt(sequence: MatchSequence): ts.Expression[] {
        const checks: ts.Expression[] = [];
        for (const match of sequence.matches) {
            const expr = match.expression;
            const rn = matchRule(expr);
            const isOptional = expr.kind === MatchExpressionKind.PostfixExpression &&
                               (expr as PostfixExpression).op.kind === PostfixOpKind.Optional;

            if (match.name) {
                const assignment = ts.factory.createBinaryExpression(
                    ts.factory.createIdentifier(addScope(match.name)),
                    ts.SyntaxKind.EqualsToken,
                    rn,
                );
                if (isOptional) {
                    checks.push(ts.factory.createBinaryExpression(
                        ts.factory.createParenthesizedExpression(assignment),
                        ts.SyntaxKind.BarBarToken,
                        ts.factory.createTrue(),
                    ));
                } else {
                    checks.push(ts.factory.createBinaryExpression(
                        assignment,
                        ts.SyntaxKind.ExclamationEqualsEqualsToken,
                        ts.factory.createNull(),
                    ));
                }
            } else {
                if (isOptional) {
                    checks.push(ts.factory.createBinaryExpression(
                        rn,
                        ts.SyntaxKind.BarBarToken,
                        ts.factory.createTrue(),
                    ));
                } else {
                    checks.push(ts.factory.createBinaryExpression(
                        rn,
                        ts.SyntaxKind.ExclamationEqualsEqualsToken,
                        ts.factory.createNull(),
                    ));
                }
            }
        }
        return checks;
    }

    public writeRuleAliasFnBody(expr: MatchExpression): ts.Statement[] {
        return [
            createReturnStatement(matchRule(expr)),
        ];
    }

    public writeChoiceParseFn(name: string, sequence: MatchSequence, memo = false): ts.MethodDeclaration[] {
        let body: ts.Statement[];

        if (memo) {
            body = [createReturnStatement(
                ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "memoise"),
                    undefined,
                    [
                        ts.factory.createArrowFunction(
                            undefined,
                            undefined,
                            [],
                            undefined,
                            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                            createBlock(this.writeChoiceParseFnBody(name, sequence), true),
                        ),
                        ts.factory.createPropertyAccessExpression(ts.factory.createThis(), memoName(name)),
                    ],
                ),
            )];
        } else {
            body = this.writeChoiceParseFnBody(name, sequence);
        }

        return [ts.factory.createMethodDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
            undefined,
            `match${name}`,
            undefined,
            undefined,
            [
                createParameter("$$dpth", ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)),
                createParameter("$$cr", ts.factory.createTypeReferenceNode("ErrorTracker"), undefined, true),
            ],
            ts.factory.createTypeReferenceNode("Nullable", [ts.factory.createTypeReferenceNode(name)]),
            createBlock(body, true),
        )];
    }

    public writeChoiceParseFnBody(name: string, sequence: MatchSequence): ts.Statement[] {
        const namedTypes = getNamedTypesFromModel(sequence);
        const type = sequence.getType();

        if (type === 'alias') {
            return this.writeRuleAliasFnBody(sequence.matches[0].expression);
        }

        const ifStmtCondition = this.writeParseIfStmt(sequence).reduce(
            (acc, expr) => ts.factory.createBinaryExpression(acc, ts.SyntaxKind.AmpersandAmpersandToken, expr),
            ts.factory.createTrue(),
        );

        const resAssignment = ts.factory.createBinaryExpression(
            ts.factory.createIdentifier("$$res"),
            ts.SyntaxKind.EqualsToken,
            type === 'class'
                ? ts.factory.createNewExpression(
                    ts.factory.createIdentifier(name),
                    undefined,
                    namedTypes.map(x => ts.factory.createIdentifier(addScope(x[0]))),
                )
                : ts.factory.createObjectLiteralExpression([
                    ts.factory.createPropertyAssignment("kind", ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier("ASTKinds"), name)),
                    ...namedTypes.map(x => ts.factory.createPropertyAssignment(x[0], ts.factory.createIdentifier(addScope(x[0])))),
                ]),
        );

        return [createReturnStatement(
            ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "run"),
                [ts.factory.createTypeReferenceNode(name)],
                [
                    ts.factory.createIdentifier("$$dpth"),
                    ts.factory.createArrowFunction(
                        undefined,
                        undefined,
                        [],
                        undefined,
                        ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                        createBlock([
                            ...namedTypes.map(x => ts.factory.createVariableStatement(
                                undefined,
                                [ts.factory.createVariableDeclaration(
                                    addScope(x[0]),
                                    undefined,
                                    ts.factory.createTypeReferenceNode("Nullable", [ts.factory.createTypeReferenceNode(x[1])]),
                                )],
                            )),
                            ts.factory.createVariableStatement(
                                undefined,
                                [ts.factory.createVariableDeclaration(
                                    "$$res",
                                    undefined,
                                    ts.factory.createTypeReferenceNode("Nullable", [ts.factory.createTypeReferenceNode(name)]),
                                    ts.factory.createNull(),
                                )],
                            ),
                            ts.factory.createIfStatement(ifStmtCondition, createBlock([
                                ts.factory.createExpressionStatement(resAssignment),
                            ])),
                            createReturnStatement(ts.factory.createIdentifier("$$res")),
                        ], true),
                    ),
                ],
            ),
        )];
    }

    private writeLeftRecRuleParseFn(name: string, body: ts.Statement[]): ts.MethodDeclaration[] {
        const memo = memoName(name);
        const posVar = addScope("pos");
        const oldMemoSafe = addScope("oldMemoSafe");

        return [ts.factory.createMethodDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
            undefined,
            `match${name}`,
            undefined,
            undefined,
            [
                createParameter("$$dpth", ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)),
                createParameter("$$cr", ts.factory.createTypeReferenceNode("ErrorTracker"), undefined, true),
            ],
            ts.factory.createTypeReferenceNode("Nullable", [ts.factory.createTypeReferenceNode(name)]),
            createBlock([
                ts.factory.createVariableStatement(
                    [ts.factory.createModifier(ts.SyntaxKind.ConstKeyword)],
                    [ts.factory.createVariableDeclaration(
                        "fn",
                        undefined,
                        undefined,
                        ts.factory.createArrowFunction(
                            undefined,
                            undefined,
                            [],
                            undefined,
                            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                            createBlock(body, true),
                        ),
                    )],
                ),
                ts.factory.createVariableStatement(
                    [ts.factory.createModifier(ts.SyntaxKind.ConstKeyword)],
                    [ts.factory.createVariableDeclaration(
                        posVar,
                        undefined,
                        undefined,
                        ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "mark"),
                            undefined,
                            [],
                        ),
                    )],
                ),
                ts.factory.createVariableStatement(
                    [ts.factory.createModifier(ts.SyntaxKind.ConstKeyword)],
                    [ts.factory.createVariableDeclaration(
                        "memo",
                        undefined,
                        undefined,
                        ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(
                                ts.factory.createPropertyAccessExpression(ts.factory.createThis(), memo),
                                "get",
                            ),
                            undefined,
                            [ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(posVar), "overallPos")],
                        ),
                    )],
                ),
                ts.factory.createIfStatement(
                    ts.factory.createBinaryExpression(
                        ts.factory.createIdentifier("memo"),
                        ts.SyntaxKind.ExclamationEqualsEqualsToken,
                        ts.factory.createIdentifier("undefined"),
                    ),
                    createBlock([
                        ts.factory.createExpressionStatement(ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "reset"),
                            undefined,
                            [ts.factory.createElementAccessExpression(ts.factory.createIdentifier("memo"), 1)],
                        )),
                        createReturnStatement(ts.factory.createElementAccessExpression(ts.factory.createIdentifier("memo"), 0)),
                    ]),
                ),
                ts.factory.createVariableStatement(
                    [ts.factory.createModifier(ts.SyntaxKind.ConstKeyword)],
                    [ts.factory.createVariableDeclaration(
                        oldMemoSafe,
                        undefined,
                        undefined,
                        ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "memoSafe"),
                    )],
                ),
                ts.factory.createExpressionStatement(ts.factory.createBinaryExpression(
                    ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "memoSafe"),
                    ts.SyntaxKind.EqualsToken,
                    ts.factory.createFalse(),
                )),
                ts.factory.createExpressionStatement(ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(
                        ts.factory.createPropertyAccessExpression(ts.factory.createThis(), memo),
                        "set",
                    ),
                    undefined,
                    [
                        ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(posVar), "overallPos"),
                        ts.factory.createArrayLiteralExpression([ts.factory.createNull(), ts.factory.createIdentifier(posVar)]),
                    ],
                )),
                ts.factory.createVariableStatement(
                    undefined,
                    ts.factory.createVariableDeclarationList([
                        ts.factory.createVariableDeclaration(
                            "lastRes",
                            undefined,
                            ts.factory.createTypeReferenceNode("Nullable", [ts.factory.createTypeReferenceNode(name)]),
                            ts.factory.createNull(),
                        )
                    ], ts.NodeFlags.Let),
                ),
                ts.factory.createVariableStatement(
                    undefined,
                    ts.factory.createVariableDeclarationList([
                        ts.factory.createVariableDeclaration(
                            "lastPos",
                            undefined,
                            ts.factory.createTypeReferenceNode("PosInfo"),
                            ts.factory.createIdentifier(posVar),
                        )
                    ], ts.NodeFlags.Let),
                ),
                ts.factory.createForStatement(
                    undefined,
                    ts.factory.createTrue(),
                    undefined,
                    createBlock([
                        ts.factory.createExpressionStatement(ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "reset"),
                            undefined,
                            [ts.factory.createIdentifier(posVar)],
                        )),
                        ts.factory.createVariableStatement(
                            [ts.factory.createModifier(ts.SyntaxKind.ConstKeyword)],
                            [ts.factory.createVariableDeclaration(
                                "res",
                                undefined,
                                undefined,
                                ts.factory.createCallExpression(ts.factory.createIdentifier("fn"), undefined, []),
                            )],
                        ),
                        ts.factory.createVariableStatement(
                            [ts.factory.createModifier(ts.SyntaxKind.ConstKeyword)],
                            [ts.factory.createVariableDeclaration(
                                "end",
                                undefined,
                                undefined,
                                ts.factory.createCallExpression(
                                    ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "mark"),
                                    undefined,
                                    [],
                                ),
                            )],
                        ),
                        ts.factory.createIfStatement(
                            ts.factory.createBinaryExpression(
                                ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier("end"), "overallPos"),
                                ts.SyntaxKind.LessThanEqualsToken,
                                ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier("lastPos"), "overallPos"),
                            ),
                            ts.factory.createBlock([ts.factory.createBreakStatement()]),
                        ),
                        ts.factory.createExpressionStatement(ts.factory.createBinaryExpression(
                            ts.factory.createIdentifier("lastRes"),
                            ts.SyntaxKind.EqualsToken,
                            ts.factory.createIdentifier("res"),
                        )),
                        ts.factory.createExpressionStatement(ts.factory.createBinaryExpression(
                            ts.factory.createIdentifier("lastPos"),
                            ts.SyntaxKind.EqualsToken,
                            ts.factory.createIdentifier("end"),
                        )),
                        ts.factory.createExpressionStatement(ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(
                                ts.factory.createPropertyAccessExpression(ts.factory.createThis(), memo),
                                "set",
                            ),
                            undefined,
                            [
                                ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier(posVar), "overallPos"),
                                ts.factory.createArrayLiteralExpression([
                                    ts.factory.createIdentifier("lastRes"),
                                    ts.factory.createIdentifier("lastPos"),
                                ]),
                            ],
                        )),
                    ], true),
                ),
                ts.factory.createExpressionStatement(ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "reset"),
                    undefined,
                    [ts.factory.createIdentifier("lastPos")],
                )),
                ts.factory.createExpressionStatement(ts.factory.createBinaryExpression(
                    ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "memoSafe"),
                    ts.SyntaxKind.EqualsToken,
                    ts.factory.createIdentifier(oldMemoSafe),
                )),
                createReturnStatement(ts.factory.createIdentifier("lastRes")),
            ], true),
        )];
    }

    public writeRuleParseFns(rule: Rule): ts.MethodDeclaration[] {
        const nm = rule.name;
        const nms = rule.definition.alternatives.map(alt => alt.name);

        if(this.boundedRecRules.has(nm)) {
            if(nms.length === 1) {
                // Only 1, skip the union
                const body = this.writeChoiceParseFnBody(nms[0], rule.definition.alternatives[0]);
                if(nm !== nms[0])
                    throw `${nm} != ${nms[0]}`;
                return this.writeLeftRecRuleParseFn(nm, body);
            }
            const body = this.writeUnionParseBody(nm, nms);
            const fn = this.writeLeftRecRuleParseFn(nm, body);
            const choiceFns = nms.flatMap((name, i) =>
                this.writeChoiceParseFn(name, rule.definition.alternatives[i]));

            return [...fn, ...choiceFns];
        }
        if(rule.definition.alternatives.length <= 1)
            return this.writeChoiceParseFn(nm, rule.definition.alternatives[0], this.enableMemos);

        const union = this.writeUnionParseFn(nm, nms, this.enableMemos);
        const choiceFns = nms.flatMap((name, i) =>
            this.writeChoiceParseFn(name, rule.definition.alternatives[i]));
        return [...union, ...choiceFns];
    }

    public writeUnionParseFn(name: string, alts: string[], memo = false): ts.MethodDeclaration[] {
        let body: ts.Statement[];
        if (memo) {
            body = [createReturnStatement(
                ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "memoise"),
                    undefined,
                    [
                        ts.factory.createArrowFunction(
                            undefined,
                            undefined,
                            [],
                            undefined,
                            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                            createBlock(this.writeUnionParseBody(name, alts), true),
                        ),
                        ts.factory.createPropertyAccessExpression(ts.factory.createThis(), memoName(name)),
                    ],
                ),
            )];
        } else {
            body = this.writeUnionParseBody(name, alts);
        }

        return [ts.factory.createMethodDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
            undefined,
            `match${name}`,
            undefined,
            undefined,
            [
                createParameter("$$dpth", ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)),
                createParameter("$$cr", ts.factory.createTypeReferenceNode("ErrorTracker"), undefined, true),
            ],
            ts.factory.createTypeReferenceNode("Nullable", [ts.factory.createTypeReferenceNode(name)]),
            createBlock(body, true),
        )];
    }

    public writeUnionParseBody(name: string, alts: string[]): ts.Statement[] {
        return [createReturnStatement(
            ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "choice"),
                [ts.factory.createTypeReferenceNode(name)],
                [ts.factory.createArrayLiteralExpression(
                    alts.map(x => ts.factory.createArrowFunction(
                        undefined,
                        undefined,
                        [],
                        undefined,
                        ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                        ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(ts.factory.createThis(), `match${x}`),
                            undefined,
                            [
                                ts.factory.createBinaryExpression(
                                    ts.factory.createIdentifier("$$dpth"),
                                    ts.SyntaxKind.PlusToken,
                                    ts.factory.createNumericLiteral(1),
                                ),
                                ts.factory.createIdentifier("$$cr"),
                            ],
                        ),
                    )),
                )],
            ),
        )];
    }

    public writeAllRuleParseFns(): ts.MethodDeclaration[] {
        const rules = this.getExpandedRules();
        const fns: ts.MethodDeclaration[] = [];
        for (const rule of rules)
            fns.push(...this.writeRuleParseFns(rule));
        const S: string = rules[0].name;

        const testMethod = ts.factory.createMethodDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
            undefined,
            "test",
            undefined,
            undefined,
            [],
            ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
            createBlock([
                ts.factory.createVariableStatement(
                    undefined,
                    ts.factory.createVariableDeclarationList([ts.factory.createVariableDeclaration(
                        "mrk",
                        undefined,
                        undefined,
                        ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "mark"),
                            undefined,
                            [],
                        ),
                    )], ts.NodeFlags.Const),
                ),
                ts.factory.createVariableStatement(
                    undefined,
                    ts.factory.createVariableDeclarationList([ts.factory.createVariableDeclaration(
                        "res",
                        undefined,
                        undefined,
                        ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(ts.factory.createThis(), `match${S}`),
                            undefined,
                            [ts.factory.createNumericLiteral(0)],
                        ),
                    )], ts.NodeFlags.Const),
                ),
                ts.factory.createVariableStatement(
                    undefined,
                    ts.factory.createVariableDeclarationList([ts.factory.createVariableDeclaration(
                        "ans",
                        undefined,
                        undefined,
                        ts.factory.createBinaryExpression(
                            ts.factory.createIdentifier("res"),
                            ts.SyntaxKind.ExclamationEqualsEqualsToken,
                            ts.factory.createNull(),
                        ),
                    )], ts.NodeFlags.Const),
                ),
                ts.factory.createExpressionStatement(ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "reset"),
                    undefined,
                    [ts.factory.createIdentifier("mrk")],
                )),
                createReturnStatement(ts.factory.createIdentifier("ans")),
            ], true),
        );

        const parseMethod = ts.factory.createMethodDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
            undefined,
            "parse",
            undefined,
            undefined,
            [],
            ts.factory.createTypeReferenceNode("ParseResult"),
            createBlock([
                ts.factory.createVariableStatement(
                    undefined,
                    ts.factory.createVariableDeclarationList([ts.factory.createVariableDeclaration(
                        "mrk",
                        undefined,
                        undefined,
                        ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "mark"),
                            undefined,
                            [],
                        ),
                    )], ts.NodeFlags.Const),
                ),
                ts.factory.createVariableStatement(
                    undefined,
                    ts.factory.createVariableDeclarationList([ts.factory.createVariableDeclaration(
                        "res",
                        undefined,
                        undefined,
                        ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(ts.factory.createThis(), `match${S}`),
                            undefined,
                            [ts.factory.createNumericLiteral(0)],
                        ),
                    )], ts.NodeFlags.Const),
                ),
                ts.factory.createIfStatement(
                    ts.factory.createIdentifier("res"),
                    createBlock([
                        createReturnStatement(ts.factory.createObjectLiteralExpression([
                            ts.factory.createPropertyAssignment("ast", ts.factory.createIdentifier("res")),
                            ts.factory.createPropertyAssignment("errs", ts.factory.createArrayLiteralExpression([])),
                        ])),
                    ]),
                ),
                ts.factory.createExpressionStatement(ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "reset"),
                    undefined,
                    [ts.factory.createIdentifier("mrk")],
                )),
                ts.factory.createVariableStatement(
                    undefined,
                    ts.factory.createVariableDeclarationList([ts.factory.createVariableDeclaration(
                        "rec",
                        undefined,
                        undefined,
                        ts.factory.createNewExpression(ts.factory.createIdentifier("ErrorTracker"), undefined, []),
                    )], ts.NodeFlags.Const),
                ),
                ts.factory.createExpressionStatement(ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "clearMemos"),
                    undefined,
                    [],
                )),
                ts.factory.createExpressionStatement(ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(ts.factory.createThis(), `match${S}`),
                    undefined,
                    [ts.factory.createNumericLiteral(0), ts.factory.createIdentifier("rec")],
                )),
                ts.factory.createVariableStatement(
                    undefined,
                    ts.factory.createVariableDeclarationList([ts.factory.createVariableDeclaration(
                        "err",
                        undefined,
                        undefined,
                        ts.factory.createCallExpression(
                            ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier("rec"), "getErr"),
                            undefined,
                            [],
                        ),
                    )], ts.NodeFlags.Const),
                ),
                createReturnStatement(ts.factory.createObjectLiteralExpression([
                    ts.factory.createPropertyAssignment("ast", ts.factory.createIdentifier("res")),
                    ts.factory.createPropertyAssignment("errs", ts.factory.createConditionalExpression(
                        ts.factory.createBinaryExpression(
                            ts.factory.createIdentifier("err"),
                            ts.SyntaxKind.ExclamationEqualsEqualsToken,
                            ts.factory.createNull(),
                        ),
                        ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                        ts.factory.createArrayLiteralExpression([ts.factory.createIdentifier("err")]),
                        ts.factory.createToken(ts.SyntaxKind.ColonToken),
                        ts.factory.createArrayLiteralExpression([]),
                    )),
                ])),
            ], true),
        );

        return [...fns, testMethod, parseMethod];
    }

    public writeParseResultInterface(): ts.Statement[] {
        const startname = this.model.rules[0].name;
        return [createInterfaceDeclaration(
            "ParseResult",
            [
                createPropertySignature(
                    "ast",
                    ts.factory.createTypeReferenceNode("Nullable", [ts.factory.createTypeReferenceNode(startname)]),
                ),
                createPropertySignature(
                    "errs",
                    ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode("SyntaxErr")),
                ),
            ],
            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        )];
    }

    public generate(): string {
        // TODO Support throwing more checks than one.
        for (const checker of this.checkers) {
            const err = checker.Check(this.model, this.input);
            if (err)
                throw err;
        }
        const hdr: Block = this.header ? [this.header] : [];
        const parseBlock = expandTemplate({
            inputStr: this.input,
            header: hdr,
            memos: [printNodes(this.writeMemos())],
            memoClearFn: [printNodes(this.writeMemoClearFn())],
            kinds: [printNodes(this.writeKinds())],
            regexFlags: this.regexFlags,
            ruleClasses: [printNodes(this.writeRuleClasses())],
            ruleParseFns: [printNodes(this.writeAllRuleParseFns())],
            parseResult: [printNodes(this.writeParseResultInterface())],
            usesEOF: this.usesEOFInModel(),
            eofType: this.erasableSyntax ? this.astKindsType("$EOF") : `ASTKinds.$EOF`,
            includeGrammar: this.includeGrammar,
        });
        return writeBlock(parseBlock).join("\n");
    }

    private astKindsType(name: string): string {
        if (this.erasableSyntax) {
            return this.astKindsByName.get(name) ?? "never"; 
        }
        return `ASTKinds.${name}`;
    }
}

export function buildParser(s: string, numEnums: boolean, enableMemos: boolean, regexFlags: string, includeGrammar = true, erasableSyntax = false): string {
    const gen = new Generator(s, numEnums, enableMemos, regexFlags, includeGrammar, erasableSyntax)
        .addChecker(BannedNamesChecker)
        .addChecker(RulesExistChecker)
        .addChecker(NoRuleNameCollisionChecker)
        .addChecker(NoKeywords);
    return gen.generate();
}
