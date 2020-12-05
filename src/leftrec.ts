import { Grammar, Rule, getRuleFromGram } from "./util";
import { ASTKinds } from "./meta";

export function callsRuleLeft(nm: string, r: Rule, gram: Grammar, visited: Set<string>): boolean {
    if(visited.has(nm))
        return false;
    visited.add(nm);
    // Check if any alternative calls nm at left.
    for(const alt of r) {
        // Only check first match in alt.
        // TODO extend to allow nullable prefixes
        const mtch = alt.matches[0].rule;
        // Pos matches don't need searching
        if(mtch.kind === ASTKinds.SPECIAL)
            continue;
        const at = mtch.pre.at;
        if(at.kind === ASTKinds.ATOM_1) {
            const rule = getRuleFromGram(gram, at.name);
            if(rule && (rule.name === nm || callsRuleLeft(nm, rule.rule, gram, visited)))
                return true;
        } else if(at.kind === ASTKinds.ATOM_3) {
            if(callsRuleLeft(nm, at.sub.list, gram, visited))
                return true;
        }
    }
    return false;
}
