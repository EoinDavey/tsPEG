import * as model from "./model";

export function matchType(m: model.MatchExpression): string {
    switch (m.kind) {
        case model.MatchExpressionKind.PrefixExpression:
            return preType(m);
        case model.MatchExpressionKind.PostfixExpression:
        {
            const innerType = matchType(m.expression);
            if (m.op.kind === model.PostfixOpKind.Range) {
                return `${innerType}[]`;
            }
            if (m.op.kind === model.PostfixOpKind.Optional) {
                return `Nullable<${innerType}>`;
            }
            if (m.op.kind === model.PostfixOpKind.Plus) {
                return `[${innerType}, ...${innerType}[]]`;
            }
            return `${innerType}[]`; // Star
        }
        default:
            return atomType(m);
    }
}

export function preType(m: model.PrefixExpression): string {
    if (m.operator === '!') {
        return "boolean";
    }
    return matchType(m.expression);
}

export function atomType(m: model.MatchExpression): string {
    switch (m.kind) {
        case model.MatchExpressionKind.RuleReference:
            return m.name;
        case model.MatchExpressionKind.RegexLiteral:
            return "string";
        case model.MatchExpressionKind.SubExpression:
            return m.name;
        case model.MatchExpressionKind.SpecialMatch:
            return "PosInfo";
        case model.MatchExpressionKind.EOFMatch:
            return '{kind: ASTKinds.$EOF}';
        default:
            throw new Error(`Unknown atom type: ${m.kind}`);
    }
}
