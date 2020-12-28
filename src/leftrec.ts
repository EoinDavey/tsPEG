import { Grammar, Rule, assertValidRegex, getRuleFromGram } from "./util";
import { ASTKinds, ATOM, MATCH } from "./meta";
import { CheckError } from "./checks";

export function ruleIsNullableInCtx(r: Rule, nullableAtoms: Set<ATOM>): boolean {
    for(const alt of r) {
        let allNullable = true;
        for(const matchspec of alt.matches)
            if(!matchIsNullableInCtx(matchspec.rule, nullableAtoms))
                allNullable = false;
        if(allNullable)
            return true;
    }
    return false;
}

function matchIsNullableInCtx(match: MATCH, nullableAtoms: Set<ATOM>): boolean {
    if(match.kind === ASTKinds.SPECIAL)
        return true;
    // match is a POSTOP

    // match is nullable if these are the postops
    if(match.op === "?" || match.op === "*")
        return true;
    const preop = match.pre;
    // Negations of nullables are invalid grammar expressions
    if(preop.op === "!" && nullableAtoms.has(preop.at))
        throw new CheckError("Cannot negate a nullable expression", preop.start);
    // Always nullable, doesn't match anything
    if(preop.op !== null)
        return true;
    if(nullableAtoms.has(preop.at))
        return true;
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
                const namedRule = getRuleFromGram(gram, at.name);
                if(namedRule === null)
                    continue;
                if(ruleIsNullableInCtx(namedRule.rule, nullableAtoms))
                    nullableAtoms.add(at);
            }
            if(at.kind === ASTKinds.ATOM_2) {
                assertValidRegex(at.match.val, at.match.start);
                const reg = new RegExp(at.match.val);
                if(reg.test("")) // Is nullable
                    nullableAtoms.add(at);
            }
            if(at.kind === ASTKinds.ATOM_3 && ruleIsNullableInCtx(at.sub.list, nullableAtoms))
                nullableAtoms.add(at);
        }
    }
}

export function nullableAtomSet(gram: Grammar): Set<ATOM> {
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
    return nullable;
}

function leftRecEdges(r: Rule, nullableAtoms: Set<ATOM>): Set<string> {
    const out: Set<string> = new Set();
    for(const alt of r) {
        // Loop as long as matches are nullable
        for(const matchspec of alt.matches) {
            const mtch = matchspec.rule;
            // Pos matches don't need searching
            if(mtch.kind === ASTKinds.SPECIAL)
                continue;
            const at = mtch.pre.at;
            if((at.kind === ASTKinds.ATOM_1 || at.kind === ASTKinds.ATOM_3) && at.name !== null)
                out.add(at.name);
            // Break if no longer nullable
            if(!matchIsNullableInCtx(mtch, nullableAtoms))
                break;
        }
    }
    return out;
}

function leftRecGraph(gram: Grammar, nullableAtoms: Set<ATOM>): Map<string, Set<string>> {
    return new Map(gram.map(r => [r.name, leftRecEdges(r.rule, nullableAtoms)]));
}

function leftRecClosure(gram: Grammar, nullableAtoms: Set<ATOM>): Map<string, Set<string>> {
    const grph = leftRecGraph(gram, nullableAtoms);
    // Floyd Warshall transitive closure algorithm
    for(const [kName, kEdges] of grph.entries())
        for(const aEdges of grph.values())
            for(const bName of grph.keys())
                if(aEdges.has(kName) && kEdges.has(bName))
                    aEdges.add(bName);
    return grph;
}

export function leftRecRules(g: Grammar): Set<string> {
    const s: Set<string> = new Set();
    const nullAtoms = nullableAtomSet(g);
    const cls = leftRecClosure(g, nullAtoms);
    for(const [k, v] of cls.entries())
        if(v.has(k))
            s.add(k);
    return s;
}
