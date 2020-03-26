import { ASTKinds, MATCH, parse, Parser, SyntaxErr } from "../meta";
import { Generator } from "../gen";

test("Parser Test", () => {
    interface TestCase { inp: string, expmatches?: string[];  }
    const tcs : TestCase[] = [
        {
            inp: "rule := 'regex'"
        },
        {
            inp: String.raw`rule := 'string \' with \' quote \' inside \' \' \''`
        },
        {
            inp: "rule := 'regex1' | 'regex2' | 'regex3'"
        },
        {
            inp: "rule := named='regex1' | 'regex2' | named_again  =  'regex3'"
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
        {
            inp: `---HEADER---
            rule_one := named=rule_ref
                      .property = type { return function(); }
                      | unnamed
                      .prop = boolean { return true; }
            rule_two := 'regex1'
            rule_three := rule_one | capture=rule_two`
        },
        {
            inp: "rule :=",
            expmatches: ["[a-zA-Z_]+", "\\&|!", "\\'", "{", "@"]
        },
        {
            inp: "rule := 'unterminated",
            expmatches: ["\\'"]
        },
        {
            inp: "rule := 'unmatched-op' | ",
            expmatches: ["[a-zA-Z_]+", "\\&|!", "\\'", "{", "@"]
        },
        {
            inp: "rule := 'can\\'t repeat @ special rule' @*",
            expmatches: ["[a-zA-Z_]+", "\\&|!", "\\'", "{", "@", "\\.", "\\|"]
        }
    ];
    for(const tc of tcs) {
        const res = parse(tc.inp);
        if (res.err !== null) {
            expect(tc.expmatches).not.toBeUndefined();
            expect(tc.expmatches!.sort()).toEqual(res.err.expmatches.sort());
            continue;
        }
        if (tc.expmatches !== undefined) {
            expect(res.err).not.toBeNull();
            expect(tc.expmatches.sort()).toEqual(res.err!.expmatches.sort());
            continue;
        }
        expect(res.ast).not.toBeNull();
    }
});

test("extractRule test", () => {
    interface TestCase { inp: string, rulenames: string[];  }
    const tcs : TestCase[] = [
        {
            inp: "rule := 'a'",
            rulenames: ["rule"]
        },
        {
            inp: "rule_one := 'a' ruletwo := 'b' rule_____three := 'c'",
            rulenames: ["rule_one", "ruletwo", "rule_____three"]
        },
        {
            inp: "rule := { 'subrule' }?",
            rulenames: ["rule", "rule_$0"]
        },
        {
            inp: "rule := { 'subrule1' }? { 'subrule' | 'two' }+",
            rulenames: ["rule", "rule_$0", "rule_$1"]
        },
        {
            inp: "rule := { sub rule { subsub rule 'zero' } { subsubrule_one }? } { sub rule 'two' @ { sub sub rule } }",
            rulenames: ["rule", "rule_$0", "rule_$0_$0", "rule_$0_$1", "rule_$1", "rule_$1_$0"]
        }
    ];
    for(const tc of tcs) {
        const res = parse(tc.inp);
        expect(res.err).toBeNull();
        expect(res.ast).not.toBeNull();
        const gen = new Generator();
        const names : string[] = res.ast!.rules.map(x => gen.extractRules(x.rule.list, x.name))
            .reduce((x, y) => x.concat(y))
            .map(x => x.name);
        expect(names.sort()).toEqual(tc.rulenames.sort());
    }
});

test("match type test", () => {
    interface TestCase { match: string, expType: string;  }
    const tcs : TestCase[] = [
        {
            match: "ruleReference",
            expType: "ruleReference"
        },
        {
            match: "ruleReference*",
            expType: "ruleReference[]"
        },
        {
            match: "ruleReference+",
            expType: "ruleReference[]"
        },
        {
            match: "ruleReference?",
            expType: "Nullable<ruleReference>"
        },
        {
            match: "!ruleReference",
            expType: "boolean"
        },
        {
            match: "'regex'",
            expType: "string"
        },
        {
            match: "'regex'+",
            expType: "string[]"
        },
        {
            match: "&'regex'",
            expType: "string"
        },
        {
            match: "@",
            expType: "PosInfo"
        }
    ];
    for(const tc of tcs) {
        const p = new Parser(tc.match);
        const res = p.matchMATCH(0);
        expect(res).not.toBeNull();
        const m : MATCH = res!;
        const gen = new Generator();
        const gotType = gen.matchType(m);
        expect(gotType).toEqual(tc.expType);
    }
});

test("subrule type test", () => {
    const inp = "rule := 'has' { subrule }";
    const expectedType = "rule_$0";
    const res = parse(inp);
    expect(res.err).toBeNull();
    expect(res.ast).not.toBeNull();
    const ast = res.ast!;
    const gen = new Generator();
    gen.AST2Gram(ast);
    const subRef = ast.rules[0].rule.list[0].matches[1].rule;
    expect(gen.matchType(subRef)).toEqual(expectedType);
})
