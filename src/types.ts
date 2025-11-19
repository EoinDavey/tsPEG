import { MatchExpression, MatchExpressionKind, PostfixOpKind, PrefixExpression } from "./model";

export function matchType(m: MatchExpression): string {
    switch (m.kind) {
        case MatchExpressionKind.PrefixExpression:
            return preType(m);
        case MatchExpressionKind.PostfixExpression:
        {
            const innerType = matchType(m.expression);
            if (m.op.kind === PostfixOpKind.Range) {
                return `${innerType}[]`;
            }
            if (m.op.kind === PostfixOpKind.Optional) {
                return `Nullable<${innerType}>`;
            }
            if (m.op.kind === PostfixOpKind.Plus) {
                return `[${innerType}, ...${innerType}[]]`;
            }
            return `${innerType}[]`; // Star
        }
        default:
            return atomType(m);
    }
}

export function preType(m: PrefixExpression): string {
    if (m.operator === '!') {
        return "boolean";
    }
    return matchType(m.expression);
}

export function atomType(m: MatchExpression): string {
    switch (m.kind) {
        case MatchExpressionKind.RuleReference:
            return m.name;
        case MatchExpressionKind.RegexLiteral:
            return "string";
        case MatchExpressionKind.SubExpression:
            return m.name;
        case MatchExpressionKind.SpecialMatch:
            return "PosInfo";
        case MatchExpressionKind.EOFMatch:
            return '{kind: ASTKinds.$EOF}';
        default:
            throw new Error(`Unknown atom type: ${m.kind}`);
    }
}
