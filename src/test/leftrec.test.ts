import { parse } from "../parser.gen";
import { ModelBuilder } from "../builder";
import { disjointCycleSets, getNullableCache, getRulesToMarkForBoundedRecursion, leftRecCycles, leftRecRules } from "../leftrec";
import { Grammar } from "../model";

// Helper to build the model from a grammar string
function buildModel(inp: string): Grammar {
    const res = parse(inp);
    expect(res.errs).toEqual([]);
    expect(res.ast).not.toBeNull();
    const builder = new ModelBuilder(inp);
    return builder.build(res.ast!);
}

describe("test left recursion detection", () => {
    const tcs: {inp: string, hasLeftRec: boolean, cycles: string[][]}[] = [
        { // no left recursion simple
            inp: "test := 'test'",
            hasLeftRec: false,
            cycles: [],
        },
        { // no left recursion, does recurse
            inp: "test := 'test' test",
            hasLeftRec: false,
            cycles: [],
        },
        { // direct left recursion in first alt
            inp: "test := test",
            hasLeftRec: true,
            cycles: [["test"]],
        },
        { // direct left recursion not first alt
            inp: "test := not_test | { 'not_test' | test | not_test }",
            hasLeftRec: true,
            cycles: [["test"]],
        },
        { // direct left recursion multiple match sequence
            inp: "test := test 'test'",
            hasLeftRec: true,
            cycles: [["test"]],
        },
        { // indirect left recursion
            inp: `
            test := other
            other := test`,
            hasLeftRec: true,
            cycles: [["test", "other"]],
        },
        { // indirect left recursion, other rules also recurse
            inp: `
            test := other
            other := other | test`,
            hasLeftRec: true,
            cycles: [["other"], ["test", "other"]],
        },
        { // Nullable prefix, left recurses
            inp: "test := 'a?' test",
            hasLeftRec: true,
            cycles: [["test"]],
        },
        { // Nullable prefix, doesn't recurse
            inp: "test := 'a?' 'b'",
            hasLeftRec: false,
            cycles: [],
        },
        { // Long nullable prefix, recurses
            inp: `
            test := nullme nullme 'a*' nonnull? indirect
            nullme := '(optional)?' '(also optional)?'
            nonnull := 'not optional'
            indirect := nullme test`,
            hasLeftRec: true,
            cycles: [["test", "indirect"]],
        },
        { // Multi stage indirect left recurse
            inp: `
            test := b
            b := { c }
            c := d
            d := e
            e := { f }
            f := g
            g := { h }
            h := test`,
            hasLeftRec: true,
            cycles: [["test", "b", "c", "d", "e", "f", "g", "h"]],
        },
    ];
    for(const tc of tcs) {
        test(`inp: ${tc.inp}`, () => {
            const model = buildModel(tc.inp);
            const leftRecs = leftRecRules(model);
            expect(leftRecs.has("test")).toEqual(tc.hasLeftRec);

            const nullableCache = getNullableCache(model);
            const cycles = leftRecCycles(model, nullableCache);
            expect(cycles.sort()).toEqual(tc.cycles.sort());

            // Ensure only one rule per cycle is marked
            const marked = getRulesToMarkForBoundedRecursion(model);
            for(const cyc of cycles) {
                const cnt = cyc.filter((x: string) => marked.has(x)).length;
                expect(cnt).toEqual(1);
            }
        });
    }
});

test("test nullable rule detection", () => {
    const tcs: {inp: string, nullableRules: string[]}[] = [
        {
            inp: "test := ''",
            nullableRules: ["test"],
        },
        {
            inp: "test := 'a?'",
            nullableRules: ["test"],
        },
        {
            inp: "test := 'a'",
            nullableRules: [],
        },
        {
            inp: "test := 'a'?",
            nullableRules: ["test"],
        },
        {
            inp: "test := 'a'*",
            nullableRules: ["test"],
        },
        {
            inp: `
            a := 'a*'
            b := 'b*'
            c := a | b
            d := a b c`,
            nullableRules: ["a", "b", "c", "d"],
        },
        {
            inp: `
            a := 'a*'
            b := a | 'b'
            c := 'c'`,
            nullableRules: ["a", "b"],
        },
        {
            inp: `
            a := a | ''`,
            nullableRules: ["a"],
        },
    ];
    for(const tc of tcs) {
        const model = buildModel(tc.inp);
        const nullableCache = getNullableCache(model);
        const nullableRuleNames = Array.from(nullableCache).filter((item): item is string => typeof item === 'string');
        expect(nullableRuleNames.sort()).toEqual(tc.nullableRules.sort());
    }
});

test("test disjointCycleSets", () => {
    const tcs: {cycles: string[][], sets: string[][][]}[] = [
        {
            cycles: [["a", "b"], ["b", "c"], ["c", "d"]],
            sets: [[["a", "b"], ["b", "c"], ["c", "d"]]],
        },
        {
            cycles: [["a", "b"], ["c", "d"], ["e", "f"]],
            sets: [[["a", "b"]], [["c", "d"]], [["e", "f"]]],
        },
        {
            cycles: [["a", "b", "c"], ["b", "d"], ["e", "f"]],
            sets: [[["a", "b", "c"], ["b", "d"]], [["e", "f"]]],
        },
        {
            cycles: [["a", "b", "c"], ["b", "c"], ["b", "d"], ["e", "f"], ["e"]],
            sets: [[["a", "b", "c"], ["b", "c"], ["b", "d"]], [["e", "f"], ["e"]]],
        },
    ];
    for(const tc of tcs) {
        const sets = disjointCycleSets(tc.cycles);
        expect(sets.sort()).toEqual(tc.sets.sort());
    }
});