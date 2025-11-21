
import * as ts from 'typescript';
import * as model from './model';
import { createIdentifier, createPropertyAccess, createThis } from './codegen';
import { assertValidRegex, escapeBackticks } from './util';
import { matchType } from './types';
import { PostfixOpKind } from './model';

export class RuleVisitor implements model.Visitor<ts.Expression> {
    visit(_node: model.MatchExpression): ts.Expression {
        return _node.accept(this);
    }

    visitGrammar(_node: model.Grammar): ts.Expression {
        throw new Error('Method not implemented.');
    }

    visitRule(_node: model.Rule): ts.Expression {
        throw new Error('Method not implemented.');
    }

    visitMatchDisjunction(_node: model.MatchDisjunction): ts.Expression {
        throw new Error('Method not implemented.');
    }

    visitMatchSequence(_node: model.MatchSequence): ts.Expression {
        throw new Error('Method not implemented.');
    }

    visitMatchSpec(_node: model.MatchSpec): ts.Expression {
        throw new Error('Method not implemented.');
    }

    visitComputedAttribute(_node: model.ComputedAttribute): ts.Expression {
        throw new Error('Method not implemented.');
    }

    visitRuleReference(node: model.RuleReference): ts.Expression {
        return ts.factory.createCallExpression(
            createPropertyAccess(createThis(), `match${node.name}`),
            [],
            [createIdentifier('$$dpth + 1'), createIdentifier('$$cr')],
        );
    }

    visitSpecialMatch(_node: model.SpecialMatch): ts.Expression {
        return ts.factory.createCallExpression(
            createPropertyAccess(createThis(), 'mark'),
            [],
            [],
        );
    }

    visitPostfixExpression(node: model.PostfixExpression): ts.Expression {
        const inner = this.visit(node.expression);
        const innerType = matchType(node.expression);

        switch (node.op.kind) {
            case PostfixOpKind.Range:
                return ts.factory.createCallExpression(
                    createPropertyAccess(createThis(), 'loop'),
                    [ts.factory.createTypeReferenceNode(innerType)],
                    [
                        ts.factory.createArrowFunction(
                            undefined,
                            undefined,
                            [],
                            undefined,
                            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                            inner,
                        ),
                        ts.factory.createNumericLiteral(node.op.min),
                        node.op.max !== undefined
                            ? ts.factory.createNumericLiteral(node.op.max)
                            : ts.factory.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, ts.factory.createNumericLiteral(1)),
                    ],
                );
            case PostfixOpKind.Star:
                return ts.factory.createCallExpression(
                    createPropertyAccess(createThis(), 'loop'),
                    [ts.factory.createTypeReferenceNode(innerType)],
                    [
                        ts.factory.createArrowFunction(
                            undefined,
                            undefined,
                            [],
                            undefined,
                            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                            inner,
                        ),
                        ts.factory.createNumericLiteral(0),
                        ts.factory.createPrefixUnaryExpression(ts.SyntaxKind.MinusToken, ts.factory.createNumericLiteral(1)),
                    ],
                );
            case PostfixOpKind.Plus:
                return ts.factory.createCallExpression(
                    createPropertyAccess(createThis(), 'loopPlus'),
                    [ts.factory.createTypeReferenceNode(innerType)],
                    [
                        ts.factory.createArrowFunction(
                            undefined,
                            undefined,
                            [],
                            undefined,
                            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                            inner,
                        ),
                    ],
                );
            case PostfixOpKind.Optional:
                return inner; // Optionality handled by type system, no change in rule generation
        }
    }

    visitPrefixExpression(node: model.PrefixExpression): ts.Expression {
        const inner = this.visit(node.expression);

        if (node.operator === "&") {
            return ts.factory.createCallExpression(
                createPropertyAccess(createThis(), 'noConsume'),
                [ts.factory.createTypeReferenceNode(matchType(node.expression))],
                [ts.factory.createArrowFunction(
                    undefined,
                    undefined,
                    [],
                    undefined,
                    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                    inner,
                )],
            );
        }
        
        return ts.factory.createCallExpression(
            createPropertyAccess(createThis(), 'negate'),
            [],
            [ts.factory.createArrowFunction(
                undefined,
                undefined,
                [],
                undefined,
                ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                inner,
            )],
        );
    }

    visitEOFMatch(_node: model.EOFMatch): ts.Expression {
        return ts.factory.createCallExpression(
            createPropertyAccess(createThis(), 'match$EOF'),
            [],
            [createIdentifier('$$cr')],
        );
    }

    visitRegexLiteral(node: model.RegexLiteral): ts.Expression {
        assertValidRegex(node.value);
        const reg = "(?:" + node.value + ")";
        const templateContent = escapeBackticks(reg);
        return ts.factory.createCallExpression(
            createPropertyAccess(createThis(), 'regexAccept'),
            [],
            [
                ts.factory.createTaggedTemplateExpression(
                    createPropertyAccess(createIdentifier('String'), 'raw'),
                    undefined, // No type arguments
                    ts.factory.createNoSubstitutionTemplateLiteral(templateContent, templateContent),
                ),
                ts.factory.createStringLiteral(node.mods),
                createIdentifier('$$dpth + 1'),
                createIdentifier('$$cr'),
            ],
        );
    }

    visitSubExpression(node: model.SubExpression): ts.Expression {
        return ts.factory.createCallExpression(
            createPropertyAccess(createThis(), `match${node.name}`),
            [],
            [createIdentifier('$$dpth + 1'), createIdentifier('$$cr')],
        );
    }
}
