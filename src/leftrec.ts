import { CheckError } from "./checks";
import { Grammar, MatchDisjunction, MatchExpression, MatchExpressionKind, MatchSequence, PostfixOpKind, RegexLiteral, Rule, SubExpression } from './model';


/*
 * As there are cyclic dependencies between rules we use the concept of a context
 * to compute which rules are nullable, a context is a set of items we currently consider
 * nullable, we then incrementally update this context until we reach a fixed point
 */

// The context for nullability analysis is a set containing either:
// - The name of a nullable rule (string)
// - The object instance of a nullable SubExpression
// - The object instance of a nullable RegexLiteral
type NullableCache = Set<string | SubExpression | RegexLiteral>;

export function getNullableCache(grammar: Grammar): NullableCache {
    const nullable: NullableCache = new Set();
    let changed = true;

    while (changed) {
        const oldSize = nullable.size;
        for (const rule of grammar.rules) {
            if (nullable.has(rule.name)) {
                continue;
            }
            if (isDisjunctionNullable(rule.definition, nullable)) {
                nullable.add(rule.name);
            }
        }
        changed = nullable.size !== oldSize;
    }
    return nullable;
}

function isDisjunctionNullable(disjunction: MatchDisjunction, context: NullableCache): boolean {
    return disjunction.alternatives.some(alt => isSequenceNullable(alt, context));
}

function isSequenceNullable(sequence: MatchSequence, context: NullableCache): boolean {
    return sequence.matches.every(spec => isExpressionNullable(spec.expression, context));
}

function isExpressionNullable(expr: MatchExpression, context: NullableCache): boolean {
    // Check the cache first for object-based keys
    if (expr.kind === MatchExpressionKind.SubExpression || expr.kind === MatchExpressionKind.RegexLiteral) {
        if (context.has(expr)) {
            return true;
        }
    }

    switch (expr.kind) {
        case MatchExpressionKind.RuleReference:
            return context.has(expr.name);

        case MatchExpressionKind.RegexLiteral:
            // Not in cache, so we need to evaluate it.
            try {
                if (new RegExp(expr.value).test('')) {
                    context.add(expr); // Add to cache if nullable
                    return true;
                }
                return false;
            } catch (e) {
                throw new CheckError(`Couldn't compile regex '${expr.value}': ${e}`, expr.pos);
            }

        case MatchExpressionKind.SubExpression:
            // Not in cache, so we need to evaluate it.
            if (isDisjunctionNullable(expr.disjunction, context)) {
                context.add(expr); // Add to cache if nullable
                return true;
            }
            return false;

        case MatchExpressionKind.PostfixExpression:
            if (expr.op.kind === PostfixOpKind.Optional || expr.op.kind === PostfixOpKind.Star) {
                return true;
            }
            if (expr.op.kind === PostfixOpKind.Range && expr.op.min === 0) {
                return true;
            }
            return isExpressionNullable(expr.expression, context);

        case MatchExpressionKind.PrefixExpression:
            if (expr.operator === '!') {
                if (isExpressionNullable(expr.expression, context)) {
                    throw new CheckError("Cannot negate a nullable expression", expr.pos);
                }
            }
            return true;

        case MatchExpressionKind.SpecialMatch:
        case MatchExpressionKind.EOFMatch:
            return false;
    }
}

// leftRecEdges returns a set of Rule names that a given Rule calls "on the left"
// (with a given nullable atoms context).
function leftRecEdges(rule: Rule, nullableCache: NullableCache): Set<string> {
    const edges = new Set<string>();

    function findEdgesInDisjunction(disjunction: MatchDisjunction) {
        for (const alt of disjunction.alternatives) {
            findEdgesInSequence(alt);
        }
    }

    function findEdgesInSequence(sequence: MatchSequence) {
        for (const match of sequence.matches) {
            findEdgesInExpr(match.expression);
            if (!isExpressionNullable(match.expression, nullableCache)) {
                break; // Stop after the first non-nullable expression
            }
        }
    }

    function findEdgesInExpr(expression: MatchExpression) {
        switch (expression.kind) {
            case MatchExpressionKind.RuleReference:
                edges.add(expression.name);
                break;
            case MatchExpressionKind.SubExpression:
                findEdgesInDisjunction(expression.disjunction);
                break;
            case MatchExpressionKind.PostfixExpression:
                findEdgesInExpr(expression.expression);
                break;
            // Prefix, literals, and other terminal-like matches don't contribute to left-recursion edges.
            case MatchExpressionKind.PrefixExpression:
            case MatchExpressionKind.RegexLiteral:
            case MatchExpressionKind.SpecialMatch:
            case MatchExpressionKind.EOFMatch:
                break;
        }
    }

    findEdgesInDisjunction(rule.definition);
    return edges;
}

// leftRecGraph returns a graph object containing all direct left recursion edges.
// (with a given nullable atoms context).
function leftRecGraph(grammar: Grammar, nullableCache: NullableCache): Map<string, Set<string>> {
    return new Map(grammar.rules.map(r => [r.name, leftRecEdges(r, nullableCache)]));
}

// leftRecClosure uses the left recursion graph to extend direct rule references to a graph
// with all indirect references.
function leftRecClosure(gram: Grammar, nullableCache: NullableCache): Map<string, Set<string>> {
    const grph = leftRecGraph(gram, nullableCache);
    return transitiveClosure(grph);
}

// transitiveClosure implements Floyd Warshall algorithm
function transitiveClosure<A>(grph: Map<A, Set<A>>): Map<A, Set<A>> {
    for(const [kName, kEdges] of grph.entries())
        for(const aEdges of grph.values())
            for(const bName of grph.keys())
                if(aEdges.has(kName) && kEdges.has(bName))
                    aEdges.add(bName);
    return grph;
}

// leftRecRules returns all left recursive rules within a grammar.
export function leftRecRules(g: Grammar): Set<string> {
    const s: Set<string> = new Set();
    const nullableCache = getNullableCache(g);
    const cls = leftRecClosure(g, nullableCache);
    for(const [k, v] of cls.entries())
        if(v.has(k))
            s.add(k);
    return s;
}

// cycleEq checks if two cycles are equal (two equivalent cycles
// can be shifted around by some amount).
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

// addCycle adds a cycle to the cycles list if it's not present.
function addCycle(cycles: string[][], cyc: string[]) {
    for(const c of cycles)
        if(cycleEq(c, cyc))
            return;
    cycles.push(cyc);
}

// leftRecCycles returns all left recursion cycles in a given grammar
// (within a given nullable atom context).
export function leftRecCycles(gram: Grammar, nullableCache: NullableCache): string[][] {
    const cycles: string[][] = [];
    const grph = leftRecGraph(gram, nullableCache);

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

    for(const g of gram.rules) {
        vis.clear();
        cycleRec(g.name, g.name);
    }
    return cycles;
}

// disjointCycleSets uses UFDS algorithm to compute disjoint sets of
// left recursive cycles, this is to break the marking of single elements down
// into simpler subproblems if possible.
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

// getRulesToMarkForBoundedRecursion takes a grammar and returns a Set of rule names
// that should be computed with bounded recursion memoisation.
// Bounded recursion memoisation logic is used to support left recursion, however it
// only works if exactly one rule in each left recursion cycle implements it.
// This function brute forces the assignment of marked rules to find a suitable
// assignment.
export function getRulesToMarkForBoundedRecursion(grammar: Grammar): Set<string> {
    const marked: Set<string> = new Set();

    const nullableCache = getNullableCache(grammar);
    const cycles = leftRecCycles(grammar, nullableCache);
    const sets = disjointCycleSets(cycles);

    // Loop over all subproblems (disjoint sets of cycles)
    for(const st of sets) {
        // All rules used in the set
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

            // Check that all cycles have exactly one marked rule.
            const success = st.every(cyc => cyc.filter(x => subst.has(x)).length === 1);

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
