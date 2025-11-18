import { matchTypeFromModel } from "./types";
import { assertValidRegex, escapeBackticks } from "./util";
import * as model from "./model";

export function matchRuleFromModel(expr: model.MatchExpression): string {
    switch (expr.kind) {
        case model.MatchExpressionKind.SpecialMatch:
            return "this.mark()";
        case model.MatchExpressionKind.PostfixExpression: {
            const innerRule = preRuleFromModel(expr.expression);
            switch (expr.op.kind) {
                case model.PostfixOpKind.Range:
                    return `this.loop<${matchTypeFromModel(expr.expression)}>(() => ${innerRule}, ${expr.op.min}, ${expr.op.max ?? -1})`;
                case model.PostfixOpKind.Star:
                    return `this.loop<${matchTypeFromModel(expr.expression)}>(() => ${innerRule}, 0, -1)`;
                case model.PostfixOpKind.Plus:
                    return `this.loopPlus<${matchTypeFromModel(expr.expression)}>(() => ${innerRule})`;
                case model.PostfixOpKind.Optional:
                    return innerRule; // Optionality handled by type system, no change in rule generation
            }
            break;
        }
        case model.MatchExpressionKind.PrefixExpression:
            return preRuleFromModel(expr);
        default:
            return atomRuleFromModel(expr);
    }
}

export function preRuleFromModel(expr: model.MatchExpression): string {
    if (expr.kind === model.MatchExpressionKind.PrefixExpression) {
        if (expr.operator === "&")
            return `this.noConsume<${matchTypeFromModel(expr.expression)}>(() => ${atomRuleFromModel(expr.expression)})`;
        if (expr.operator === "!")
            return `this.negate(() => ${atomRuleFromModel(expr.expression)})`;
    }
    return atomRuleFromModel(expr);
}

export function atomRuleFromModel(expr: model.MatchExpression): string {
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
