import { parse } from "../meta";
import { Generator } from "../gen";
import { getRuleFromGram } from "../util";
import { callsRuleLeft } from "../leftrec";

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
    ];
    for(const tc of tcs) {
        const res = parse(tc.inp);
        expect(res.err).toBeNull();
        expect(res.ast).not.toBeNull();
        const g = new Generator(tc.inp);
        const gram = g.AST2Gram(res.ast!);
        const rule = getRuleFromGram(gram, "test");
        expect(rule).not.toBeNull();
        expect(callsRuleLeft(rule!.name, rule!.rule, gram, new Set()));
    }
});
