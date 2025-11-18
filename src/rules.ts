import { matchType } from "./types";
import { assertValidRegex, escapeBackticks } from "./util";
import * as model from "./model";

export function matchRule(expr: model.MatchExpression): string {
    switch (expr.kind) {
        case model.MatchExpressionKind.SpecialMatch:
            return "this.mark()";
        case model.MatchExpressionKind.PostfixExpression: {
            const innerRule = preRule(expr.expression);
            switch (expr.op.kind) {
                case model.PostfixOpKind.Range:
                    return `this.loop<${matchType(expr.expression)}>(() => ${innerRule}, ${expr.op.min}, ${expr.op.max ?? -1})`;
                case model.PostfixOpKind.Star:
                    return `this.loop<${matchType(expr.expression)}>(() => ${innerRule}, 0, -1)`;
                case model.PostfixOpKind.Plus:
                    return `this.loopPlus<${matchType(expr.expression)}>(() => ${innerRule})`;
                case model.PostfixOpKind.Optional:
                    return innerRule; // Optionality handled by type system, no change in rule generation
            }
            break;
        }
        case model.MatchExpressionKind.PrefixExpression:
            return preRule(expr);
        default:
            return atomRule(expr);
    }
}

export function preRule(expr: model.MatchExpression): string {
    if (expr.kind === model.MatchExpressionKind.PrefixExpression) {
        if (expr.operator === "&")
            return `this.noConsume<${matchType(expr.expression)}>(() => ${atomRule(expr.expression)})`;
        if (expr.operator === "!")
            return `this.negate(() => ${atomRule(expr.expression)})`;
    }
    return atomRule(expr);
}

export function atomRule(expr: model.MatchExpression): string {
    switch (expr.kind) {
        case model.MatchExpressionKind.RuleReference:
            return `this.match${expr.name}($$dpth + 1, $$cr)`;
        case model.MatchExpressionKind.EOFMatch:
            return 'this.match$EOF($$cr)';
        case model.MatchExpressionKind.RegexLiteral: {
            assertValidRegex(expr.value);
            const reg = "(?:" + expr.value + ")";
            return `this.regexAccept(String.raw\`${escapeBackticks(reg)}\`, "${expr.mods}", $$dpth + 1, $$cr)`;
        }
        case model.MatchExpressionKind.SubExpression:
            return `this.match${expr.name}($$dpth + 1, $$cr)`;
        case model.MatchExpressionKind.SpecialMatch:
            return `this.mark()`;
        default:
            throw new Error(`Unknown atom rule type: ${expr.kind}`);
    }
}
