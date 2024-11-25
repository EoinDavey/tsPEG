import { ASTKinds, ATOM, MATCH, PREOP } from "./meta";

export function matchType(expr: MATCH): string {
    // Check if special rule
    if (expr.kind === ASTKinds.SPECIAL)
        return expr.op === "@" ? "PosInfo" : "unknown";
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
