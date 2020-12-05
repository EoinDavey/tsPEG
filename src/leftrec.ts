import { Grammar, Rule, assertValidRegex, getRuleFromGram } from "./util";
import { ASTKinds, ATOM } from "./meta";
import { CheckError } from "./checks";

function ruleIsNullableInCtx(r: Rule, nullableAtoms: Set<ATOM>): boolean {
    for(const alt of r) {
        let allNullable = true;
        for(const matchspec of alt.matches) {
            const match = matchspec.rule;
            if(match.kind === ASTKinds.SPECIAL)
                continue;
            // match is a POSTOP

            // match is nullable if these are the postops
            if(match.op === "?" || match.op === "*")
                continue;
            const preop = match.pre;
            // Negations of nullables are invalid grammar expressions
            if(preop.op === "!" && nullableAtoms.has(preop.at))
                throw new CheckError("Cannot negate a nullable expression", preop.start);
            // Always nullable, doesn't match anything
            if(preop.op !== null)
                continue;
            if(!nullableAtoms.has(preop.at))
                allNullable = false;
        }
        if(allNullable)
            return true;
    }
    return false;
}

function updateNullableAtomsInRule(rule: Rule, gram: Grammar, nullableAtoms: Set<ATOM>) {
    for(const alt of rule) {
        for(const matchspec of alt.matches) {
            const match = matchspec.rule;
            if(match.kind === ASTKinds.SPECIAL)
                continue;
            const at = match.pre.at;
            // Already in
            if(nullableAtoms.has(at))
                continue;
            if(at.kind === ASTKinds.ATOM_1) {
                const rule = getRuleFromGram(gram, at.name);
                if(rule === null)
                    continue;
                if(ruleIsNullableInCtx(rule.rule, nullableAtoms))
                    nullableAtoms.add(at);
            }
            if(at.kind === ASTKinds.ATOM_2) {
                assertValidRegex(at.match.val, at.match.start);
                const reg = new RegExp(at.match.val);
                if(reg.test("")) // Is nullable
                    nullableAtoms.add(at);
            }
            if(at.kind === ASTKinds.ATOM_3) {
                if(ruleIsNullableInCtx(at.sub.list, nullableAtoms))
                    nullableAtoms.add(at);
            }
        }
    }
}

function nullableRules(gram: Grammar): string[] {
    // Inefficient approach but it doesn't matter
    const nullable: Set<ATOM> = new Set();
    for(;;) {
        const oldSize = nullable.size;
        for(const ruledef of gram)
            updateNullableAtomsInRule(ruledef.rule, gram, nullable);
        const newSize = nullable.size;
        if(newSize === oldSize)
            break;
    }
    const names: string[] = [];
    for(const ruledef of gram)
        if(ruleIsNullableInCtx(ruledef.rule, nullable))
            names.push(ruledef.name);
    return names;
}

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
