import { ASTKinds, ATOM, MATCH, PREOP } from "./parser.gen";
import * as model from "./model";

export function matchType(expr: MATCH): string {
    // Check if special rule
    if (expr.kind === ASTKinds.SPECIAL)
        return "PosInfo";
    if (expr.op === null)
        return preType(expr.pre);
    if (expr.op.kind === ASTKinds.RANGESPEC){
        return `${preType(expr.pre)}[]`;
    }
    if (expr.op.op === "?")
        return `Nullable<${preType(expr.pre)}>`;
    if (expr.op.op === '+')
        return `[${preType(expr.pre)}, ...${preType(expr.pre)}[]]`;
    return `${preType(expr.pre)}[]`;
}

export function preType(expr: PREOP): string {
    if (expr.op && expr.op === "!") { // Negation types return null if matched, true otherwise
        return "boolean";
    }
    return atomType(expr.at);
}

export function atomType(at: ATOM): string {
    if (at.kind === ASTKinds.ATOM_1)
        return at.name;
    if (at.kind === ASTKinds.ATOM_2)
        return "string";
    if(at.kind === ASTKinds.EOF)
        return '{kind: ASTKinds.$EOF}';
    const subname = at.name;
    if (subname)
        return subname;
    throw new Error("Unknown subrule");
}

export function matchTypeFromModel(m: model.MatchExpression): string {
    switch (m.kind) {
        case model.MatchExpressionKind.PrefixExpression:
            return preTypeFromModel(m);
        case model.MatchExpressionKind.PostfixExpression:
        {
            const innerType = matchTypeFromModel(m.expression);
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
            return atomTypeFromModel(m);
    }
}

export function preTypeFromModel(m: model.PrefixExpression): string {
    if (m.operator === '!') {
        return "boolean";
    }
    return matchTypeFromModel(m.expression);
}

export function atomTypeFromModel(m: model.MatchExpression): string {
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
