import { parse } from "../meta";
import { Generator } from "../gen";
import { getRuleFromGram } from "../util";
import { callsRuleLeft, nullableAtomSet, ruleIsNullableInCtx } from "../leftrec";

test("test left recursion detection", () => {
    const tcs: {inp: string, hasLeftRec: boolean}[] = [
        { // no left recursion simple
            inp: "test := 'test'",
            hasLeftRec: false,
        },
        { // no left recursion, does recurse
            inp: "test := 'test' test",
            hasLeftRec: false,
        },
        { // direct left recursion in first alt
            inp: "test := test",
            hasLeftRec: true,
        },
        { // direct left recursion not first alt
            inp: "test := not_test | 'not_test' | test | not_test",
            hasLeftRec: true,
        },
        { // direct left recursion multiple match sequence
            inp: "test := test 'test'",
            hasLeftRec: true,
        },
        { // indirect left recursion
            inp: `
            test := other
            other := test`,
            hasLeftRec: true,
        },
        { // indirect left recursion, other rules also recurse
            inp: `
            test := other
            other := other | test`,
            hasLeftRec: true,
        },
        { // Nullable prefix, left recurses
            inp: "test := 'a?' test",
            hasLeftRec: true,
        },
        { // Nullable prefix, doesn't recurse
            inp: "test := 'a?' 'b'",
            hasLeftRec: false,
        },
        { // Long nullable prefix, recurses
            inp: `
            test := nullme nullme 'a*' nonnull? indirect
            nullme := '(optional)?' '(also optional)?'
            nonnull := 'not optional'
            indirect := nullme test`,
            hasLeftRec: true,
        },
    ];
    for(const tc of tcs) {
        const res = parse(tc.inp);
        expect(res.err).toBeNull();
        expect(res.ast).not.toBeNull();
        const g = new Generator(tc.inp);
        const gram = g.AST2Gram(res.ast!);
        const rule = getRuleFromGram(gram, "test");
        const nullAtoms = nullableAtomSet(gram);
        expect(rule).not.toBeNull();
        expect(callsRuleLeft(rule!.name, rule!.rule, gram, new Set(), nullAtoms)).toEqual(tc.hasLeftRec);
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
        const g = new Generator(tc.inp);
        const gram = g.AST2Gram(res.ast!);
        const atoms = nullableAtomSet(gram);
        for(const rule of tc.nullableRules)
            expect(ruleIsNullableInCtx(getRuleFromGram(gram, rule)!.rule, atoms)).toEqual(true);
    }
});
