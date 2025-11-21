import * as ts from 'typescript';
import { MatchExpression, MatchExpressionKind } from "./model";
import { RuleVisitor } from "./rules_new";

const ruleVisitor = new RuleVisitor();


export function matchRule(expr: MatchExpression): ts.Expression {
    switch (expr.kind) {
        case MatchExpressionKind.SpecialMatch:
            return ruleVisitor.visit(expr);
        case MatchExpressionKind.PostfixExpression:
            return ruleVisitor.visit(expr);
        case MatchExpressionKind.PrefixExpression:
            return preRule(expr);
        default:
            return atomRule(expr);
    }
}

export function preRule(expr: MatchExpression): ts.Expression {
    if (expr.kind === MatchExpressionKind.PrefixExpression) {
        return ruleVisitor.visit(expr);
    }
    return atomRule(expr);
}

export function atomRule(expr: MatchExpression): ts.Expression {
    switch (expr.kind) {
        case MatchExpressionKind.RuleReference:
        case MatchExpressionKind.EOFMatch:
        case MatchExpressionKind.SubExpression:
            return ruleVisitor.visit(expr);
        case MatchExpressionKind.RegexLiteral:
            return ruleVisitor.visit(expr);
        case MatchExpressionKind.SpecialMatch:
            return ruleVisitor.visit(expr);
        default:
            throw new Error(`Unknown atom rule type: ${expr.kind}`);
    }
}
