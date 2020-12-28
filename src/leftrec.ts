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
    return transitiveClosure(grph);
}

function transitiveClosure<A>(grph: Map<A, Set<A>>): Map<A, Set<A>> {
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

function cycleEq(a: string[], b: string[]): boolean {
    if(a.length !== b.length)
        return false;
    const bOffset = b.indexOf(a[0]);
    if(bOffset === -1)
        return false;
    for(let i = 0; i < a.length; ++i)
        if(a[i] !== b[(bOffset + i) % b.length])
            return false;
    return true;
}

function addCycle(cycles: string[][], cyc: string[]) {
    for(const c of cycles)
        if(cycleEq(c, cyc))
            return;
    cycles.push(cyc);
}

export function leftRecCycles(gram: Grammar, nullableAtoms: Set<ATOM>): string[][] {
    const cycles: string[][] = [];
    const grph = leftRecGraph(gram, nullableAtoms);

    const vis: Set<string> = new Set();
    const seq: string[] = [];

    const cycleRec = (cur: string, tgt: string) => {
        if(vis.has(cur)) {
            if(cur === tgt)
                addCycle(cycles, [...seq]);
            return;
        }
        const edges = grph.get(cur);
        if(edges === undefined)
            return;
        vis.add(cur);
        seq.push(cur);
        for(const k of edges)
            cycleRec(k, tgt);
        vis.delete(cur);
        seq.pop();
    };

    for(const g of gram) {
        vis.clear();
        cycleRec(g.name, g.name);
    }
    return cycles;
}

export function disjointCycleSets(cycles: string[][]): string[][][] {
    const p: Map<string[], string[]> = new Map();

    const find = (a: string[]): string[] => {
        const pa = p.get(a) ?? a;
        const res = pa === a ? a : find(pa);
        p.set(a, res);
        return res;
    };

    const union = (a: string[], b: string[]) => {
        p.set(find(a), find(b));
    };

    for(const a of cycles) {
        const sa = new Set(a);
        for(const b of cycles) {
            const sb = new Set(b);
            if([...a, ...b].filter(x => sa.has(x) && sb.has(x)).length !== 0)
                union(a, b);
        }
    }

    const sets: string[][][] = [];
    for(const a of cycles) {
        if(p.get(a) !== a)
            continue;
        const st: string[][] = [];
        for(const b of cycles)
            if(find(b) === a)
                st.push(b);
        sets.push(st);
    }

    return sets;
}

export function getRulesToMarkForBoundedRecursion(g: Grammar): Set<string> {
    const marked: Set<string> = new Set();

    const nullAtoms = nullableAtomSet(g);
    const cycles = leftRecCycles(g, nullAtoms);
    const sets = disjointCycleSets(cycles);

    for(const st of sets) {
        const allRulesSet: Set<string> = new Set(st.reduce((x, y) => x.concat(y)));
        const allRules = [...allRulesSet];
        const sz = allRules.length;
        // Check that left recursion sets are small enough to brute force
        // 2^18 == 262144
        if(sz > 18)
            throw new CheckError("Left recursion is too complex to solve");

        // Brute force all subsets
        const lim = 1 << sz;
        for(let subsetIdx = 0; subsetIdx < lim; ++subsetIdx) {
            // Check that each cycle in st has exactly one rule in subset
            const subst: Set<string> = new Set();
            for(let i = 0; i < sz; ++i)
                if((subsetIdx & (1 << i)) !== 0)
                    subst.add(allRules[i]);
            let success = true;
            for(const cyc of st) {
                const cnt = cyc.filter(x => subst.has(x)).length;
                if(cnt !== 1)
                    success = false;
            }
            if(!success)
                continue;

            // Assignment found for st
            for(const rule of subst)
                marked.add(rule);
            break;
        }
    }
    return marked;
}
