import { parse } from "../meta";
import { Generator } from "../gen";
import { getRuleFromGram } from "../util";
import { disjointCycleSets, leftRecCycles, leftRecRules, nullableAtomSet,
    ruleIsNullableInCtx } from "../leftrec";

test("test left recursion detection", () => {
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
            inp: "test := not_test | 'not_test' | test | not_test",
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
            b := c
            c := d
            d := e
            e := test`,
            hasLeftRec: true,
            cycles: [["test", "b", "c", "d", "e"]],
        },
    ];
    for(const tc of tcs) {
        const res = parse(tc.inp);
        expect(res.err).toBeNull();
        expect(res.ast).not.toBeNull();
        const g = new Generator(tc.inp);
        const leftRecs = leftRecRules(g.gram);
        expect(leftRecs.has("test")).toEqual(tc.hasLeftRec);

        const atoms = nullableAtomSet(g.gram);
        const cycles = leftRecCycles(g.gram, atoms);
        expect(cycles.sort()).toEqual(tc.cycles.sort());
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
        const res = parse(tc.inp);
        expect(res.err).toBeNull();
        expect(res.ast).not.toBeNull();
        const gram = new Generator(tc.inp).gram;
        const atoms = nullableAtomSet(gram);
        for(const rule of tc.nullableRules)
            expect(ruleIsNullableInCtx(getRuleFromGram(gram, rule)!.rule, atoms)).toEqual(true);
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
