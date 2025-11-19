import { matchType } from "./types";
import { assertValidRegex, escapeBackticks } from "./util";
import { MatchExpression, MatchExpressionKind, PostfixOpKind } from "./model";

export function matchRule(expr: MatchExpression): string {
    switch (expr.kind) {
        case MatchExpressionKind.SpecialMatch:
            return "this.mark()";
        case MatchExpressionKind.PostfixExpression: {
            const innerRule = preRule(expr.expression);
            switch (expr.op.kind) {
                case PostfixOpKind.Range:
                    return `this.loop<${matchType(expr.expression)}>(() => ${innerRule}, ${expr.op.min}, ${expr.op.max ?? -1})`;
                case PostfixOpKind.Star:
                    return `this.loop<${matchType(expr.expression)}>(() => ${innerRule}, 0, -1)`;
                case PostfixOpKind.Plus:
                    return `this.loopPlus<${matchType(expr.expression)}>(() => ${innerRule})`;
                case PostfixOpKind.Optional:
                    return innerRule; // Optionality handled by type system, no change in rule generation
            }
            break;
        }
        case MatchExpressionKind.PrefixExpression:
            return preRule(expr);
        default:
            return atomRule(expr);
    }
}

export function preRule(expr: MatchExpression): string {
    if (expr.kind === MatchExpressionKind.PrefixExpression) {
        if (expr.operator === "&")
            return `this.noConsume<${matchType(expr.expression)}>(() => ${atomRule(expr.expression)})`;
        if (expr.operator === "!")
            return `this.negate(() => ${atomRule(expr.expression)})`;
    }
    return atomRule(expr);
}

export function atomRule(expr: MatchExpression): string {
    switch (expr.kind) {
        case MatchExpressionKind.RuleReference:
            return `this.match${expr.name}($$dpth + 1, $$cr)`;
        case MatchExpressionKind.EOFMatch:
            return 'this.match$EOF($$cr)';
        case MatchExpressionKind.RegexLiteral: {
            assertValidRegex(expr.value);
            const reg = "(?:" + expr.value + ")";
            return `this.regexAccept(String.raw\`${escapeBackticks(reg)}\`, "${expr.mods}", $$dpth + 1, $$cr)`;
        }
        case MatchExpressionKind.SubExpression:
            return `this.match${expr.name}($$dpth + 1, $$cr)`;
        case MatchExpressionKind.SpecialMatch:
            return `this.mark()`;
        default:
            throw new Error(`Unknown atom rule type: ${expr.kind}`);
    }
}
