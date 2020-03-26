import { parse, SyntaxErr } from "../meta";

test("Parser Test", () => {
    interface TestCase { inp: string, expmatches?: string[];  }
    const tcs : TestCase[] = [
        {
            inp: "rule := 'regex'"
        },
        {
            inp: "rule := 'regex1' | 'regex2' | 'regex3'"
        },
        {
            inp: "rule := named='regex1' | 'regex2' | named_again='regex3'"
        },
        {
            inp: "rule := named=rule_ref | 'regex'"
        },
        {
            inp: "rule := named=rule_ref | 'regex' | pos=@"
        },
        {
            inp: `rule := named=rule_ref
            .property = type { some property }`,
        },
        {
            inp: `rule_one := named=rule_ref
            rule_two := 'regex1'
            rule_three := rule_one | capture=rule_two`
        },
        {
            inp: `---
            HEADER SECTION ANYTHING HERE
            ---
            rule_one := 'regex'
            rule_two := rule_one .test = boolean { return true; }`
        },
    ];
    for(const tc of tcs) {
        const res = parse(tc.inp);
        if (res.err !== null) {
            expect(tc.expmatches).not.toBeNull();
            expect(tc.expmatches).toEqual(res.err.expmatches);
            return;
        }
        if (tc.expmatches !== undefined) {
            expect(res.err).not.toBeNull();
            expect(tc.expmatches).toEqual(res.err!.expmatches);
            return;
        }
        expect(res.ast).not.toBeNull();
    }
});
