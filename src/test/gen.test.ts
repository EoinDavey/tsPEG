import { MATCH, Parser, parse } from "../meta";
import { Generator } from "../gen";
import { getRuleFromGram, writeBlock } from "../util";

test("Parser Test", () => {
    interface TestCase { inp: string, expmatches?: string[];  }
    const tcs : TestCase[] = [
        {
            inp: "rule := 'regex'",
        },
        {
            inp: String.raw`rule := 'string \' with \' quote \' inside \' \' \''`,
        },
        {
            inp: String.raw`rule := 'string with \`backticks\`'`,
        },
        {
            inp: "rule := 'regex1' | 'regex2' | 'regex3'",
        },
        {
            inp: "rule := named='regex1' | 'regex2' | named_again  =  'regex3'",
        },
        {
            inp: "rule := named=rule_ref | 'regex'",
        },
        {
            inp: "rule := named=rule_ref | 'regex' | pos=@",
        },
        {
            inp: `rule := named=rule_ref
            .property = type { some property }`,
        },
        {
            inp: `rule_one := named=rule_ref
            rule_two := 'regex1'
            rule_three := rule_one | capture=rule_two`,
        },
        {
            inp: `rule1_:= named=rule_ref
            rule1 := 'regex1'
            rule3 := rule_one | capture=rule_two`,
        },
        {
            inp: `---
            HEADER SECTION ANYTHING HERE
            ---
            rule_one := 'regex'
            rule_two := rule_one .test = boolean { return true; }`,
        },
        {
            inp: `---HEADER---
            rule_one := named=rule_ref
                      .property = type { return function(); }
                      | unnamed
                      .prop = boolean { return true; }
            rule_two := 'regex1'
            rule_three := rule_one | capture=rule_two`,
        },
        {
            inp: `// Comment here
            // Comment here
            rule_one := named=rule_ref
            // Comment here
                      .property = type { return function(); } // Comment here too
            // Comment here
                      | unnamed
            // Comment here
                      .prop = boolean { return true; }
            // Comment here
            rule_two := 'regex1'
            // Comment here
            rule_three := rule_one | capture=rule_two`,
        },
        {
            inp: "rule :=",
            expmatches: ["[a-zA-Z_][a-zA-Z0-9_]*", "\\&|!", "\\'", "{", "@"],
        },
        {
            inp: "rule := 'unterminated",
            expmatches: ["\\'"],
        },
        {
            inp: "rule := 'unmatched-op' | ",
            expmatches: ["[a-zA-Z_][a-zA-Z0-9_]*", "\\&|!", "\\'", "{", "@"],
        },
        {
            inp: "rule := 'can\\'t repeat @ special rule' @*",
            expmatches: ["[a-zA-Z_][a-zA-Z0-9_]*", "\\&|!", "\\'", "{", "@", "\\.", "\\|"],
        },
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
            rulenames: ["rule"],
        },
        {
            inp: "rule_one := 'a' ruletwo := 'b' rule_____three := 'c'",
            rulenames: ["rule_one", "ruletwo", "rule_____three"],
        },
        {
            inp: "rule := { 'subrule' }?",
            rulenames: ["rule", "rule_$0"],
        },
        {
            inp: "rule := { 'subrule1' }? { 'subrule' | 'two' }+",
            rulenames: ["rule", "rule_$0", "rule_$1"],
        },
        {
            inp: "rule := { sub rule { subsub rule 'zero' } { subsubrule_one }? } { sub rule 'two' @ { sub sub rule } }",
            rulenames: ["rule", "rule_$0", "rule_$0_$0", "rule_$0_$1", "rule_$1", "rule_$1_$0"],
        },
    ];
    for(const tc of tcs) {
        const res = parse(tc.inp);
        expect(res.err).toBeNull();
        expect(res.ast).not.toBeNull();
        const gen = new Generator(tc.inp);
        const names : string[] = res.ast!.rules.map(x => gen.extractRules(x.rule.list, x.name))
            .reduce((x, y) => x.concat(y))
            .map(x => x.name);
        expect(names.sort()).toEqual(tc.rulenames.sort());
    }
});

test("match type/rule test", () => {
    interface TestCase { match: string, expType: string, expRule?: string }
    const tcs : TestCase[] = [
        {
            match: "ruleReference",
            expType: "ruleReference",
            expRule: "this.matchruleReference($$dpth + 1, $$cr)",
        },
        {
            match: "ruleReference*",
            expType: "ruleReference[]",
            expRule: "this.loop<ruleReference>(() => this.matchruleReference($$dpth + 1, $$cr), true)",
        },
        {
            match: "ruleReference+",
            expType: "ruleReference[]",
            expRule: "this.loop<ruleReference>(() => this.matchruleReference($$dpth + 1, $$cr), false)",
        },
        {
            match: "ruleReference?",
            expType: "Nullable<ruleReference>",
            expRule: "this.matchruleReference($$dpth + 1, $$cr)",
        },
        {
            match: "!ruleReference",
            expType: "boolean",
            expRule: "this.negate(() => this.matchruleReference($$dpth + 1, $$cr))",
        },
        {
            match: "'regex'",
            expType: "string",
            expRule: "this.regexAccept(String.raw`(?:regex)`, $$dpth + 1, $$cr)",
        },
        {
            match: "'regex'+",
            expType: "string[]",
            expRule: "this.loop<string>(() => this.regexAccept(String.raw`(?:regex)`, $$dpth + 1, $$cr), false)",
        },
        {
            match: "&'regex'",
            expType: "string",
            expRule: "this.noConsume<string>(() => this.regexAccept(String.raw`(?:regex)`, $$dpth + 1, $$cr))",
        },
        {
            match: "@",
            expType: "PosInfo",
            expRule: "this.mark()",
        },
    ];
    for(const tc of tcs) {
        const p = new Parser(tc.match);
        const res = p.matchMATCH(0);
        expect(res).not.toBeNull();
        const m : MATCH = res!;
        const gen = new Generator(tc.match);
        const gotType = gen.matchType(m);
        expect(gotType).toEqual(tc.expType);
        if(tc.expRule) {
            const gotRule = gen.matchRule(m);
            expect(gotRule).toEqual(tc.expRule);
        }
    }
});

test("subrule type/rule test", () => {
    const inp = "rule := 'has' { subrule }";
    const expectedType = "rule_$0";
    const expectedRule = "this.matchrule_$0($$dpth + 1, $$cr)";

    const res = parse(inp);
    expect(res.err).toBeNull();
    expect(res.ast).not.toBeNull();

    const ast = res.ast!;
    const gen = new Generator(inp);
    gen.AST2Gram(ast);
    const subRef = ast.rules[0].rule.list[0].matches[1].rule;
    expect(gen.matchType(subRef)).toEqual(expectedType);
    expect(gen.matchRule(subRef)).toEqual(expectedRule);
});

test("writeKinds test", () => {
    interface TestCase { inp: string, writeKinds: string, numEnums: boolean }
    const tcs: TestCase[] = [
        {
            inp: "rule := 'regex'",
            writeKinds: `export enum ASTKinds {
    rule,
}`,
            numEnums: true,
        },
        {
            inp: `rule := 'regex' | rule reference
            rule_two := more | rule | { subrule }`,
            writeKinds: `export enum ASTKinds {
    rule_1,
    rule_2,
    rule_two_1,
    rule_two_2,
    rule_two_3,
    rule_two_$0,
}`,
            numEnums: true,
        },
        {
            inp: "rule := 'regex'",
            writeKinds: `export enum ASTKinds {
    rule = "rule",
}`,
            numEnums: false,
        },
        {
            inp: `rule := 'regex' | rule reference
            rule_two := more | rule | { subrule }`,
            writeKinds: `export enum ASTKinds {
    rule_1 = "rule_1",
    rule_2 = "rule_2",
    rule_two_1 = "rule_two_1",
    rule_two_2 = "rule_two_2",
    rule_two_3 = "rule_two_3",
    rule_two_$0 = "rule_two_$0",
}`,
            numEnums: false,
        },
    ];
    for(const tc of tcs) {
        const res = parse(tc.inp);
        expect(res.err).toBeNull();
        expect(res.ast).not.toBeNull();
        const g = new Generator(tc.inp, tc.numEnums);
        const gram = g.AST2Gram(res.ast!);
        const got = writeBlock(g.writeKinds(gram)).join("\n");
        expect(got).toEqual(tc.writeKinds);
    }
});

test("writeRuleClasses Test", () => {
    interface TestCase { inp: string, ruleClasses: string }
    const tcs: TestCase[] = [
        {
            inp: "rule := 'regex'",
            ruleClasses: "export type rule = string;",
        },
        {
            inp: "rule := name='named regex'",
            ruleClasses: `export interface rule {
    kind: ASTKinds.rule;
    name: string;
}`,
        },
        {
            inp: "rule := name='named regex' .computed = number { return 0; }",
            ruleClasses: `export class rule {
    public kind: ASTKinds.rule = ASTKinds.rule;
    public name: string;
    public computed: number;
    constructor(name: string){
        this.name = name;
        this.computed = ((): number => {
        return 0;
        })();
    }
}`,
        },
        // Test complex type names and code section
        {
            inp: `rule := 'a'
            .computed = (x: number, y: string) => number | boolean {
            if(true) {
                return 0;
            }
            }`,
            ruleClasses: `export class rule {
    public kind: ASTKinds.rule = ASTKinds.rule;
    public computed: (x: number, y: string) => number | boolean;
    constructor(){
        this.computed = ((): (x: number, y: string) => number | boolean => {
        if(true) {
                return 0;
            }
        })();
    }
}`,
        },
        {
            inp: `rule := 'a'
            .computed = <Generic extends Something>(x: Array<Generic>) => number {
            if(nest) {
                for(;;) {
                }
                for(;;) {
                    if(nested) {}
                }
            }
            }`,
            ruleClasses: `export class rule {
    public kind: ASTKinds.rule = ASTKinds.rule;
    public computed: <Generic extends Something>(x: Array<Generic>) => number;
    constructor(){
        this.computed = ((): <Generic extends Something>(x: Array<Generic>) => number => {
        if(nest) {
                for(;;) {
                }
                for(;;) {
                    if(nested) {}
                }
            }
        })();
    }
}`,
        },
        {
            inp: `rule := 'a' .computed = A.B.C<Generic>[][] { return "string with {} }}}{{}}"; }`,
            ruleClasses: `export class rule {
    public kind: ASTKinds.rule = ASTKinds.rule;
    public computed: A.B.C<Generic>[][];
    constructor(){
        this.computed = ((): A.B.C<Generic>[][] => {
        return "string with {} }}}{{}}";
        })();
    }
}`,
        },
        {
            inp: `rule := 'a'
            .computed = (req: number, opt?: boolean, ...rest: A.B<K>[]) => test { return \`}}}{{{}}{{\`; }`,
            ruleClasses: `export class rule {
    public kind: ASTKinds.rule = ASTKinds.rule;
    public computed: (req: number, opt?: boolean, ...rest: A.B<K>[]) => test;
    constructor(){
        this.computed = ((): (req: number, opt?: boolean, ...rest: A.B<K>[]) => test => {
        return \`}}}{{{}}{{\`;
        })();
    }
}`,
        },
        {
            inp: `rule := 'a' .computed = [number, bool, new () => void] {}`,
            ruleClasses: `export class rule {
    public kind: ASTKinds.rule = ASTKinds.rule;
    public computed: [number, bool, new () => void];
    constructor(){
        this.computed = ((): [number, bool, new () => void] => {
        })();
    }
}`,
        },
        {
            inp: `rule := 'a' .computed = (a: (typeof a)[]) => (new () => void) {}`,
            ruleClasses: `export class rule {
    public kind: ASTKinds.rule = ASTKinds.rule;
    public computed: (a: (typeof a)[]) => (new () => void);
    constructor(){
        this.computed = ((): (a: (typeof a)[]) => (new () => void) => {
        })();
    }
}`,
        },
        {
            inp: `rule := 'a' .computed = {a: number; b: boolean} {}`,
            ruleClasses: `export class rule {
    public kind: ASTKinds.rule = ASTKinds.rule;
    public computed: {a: number; b: boolean};
    constructor(){
        this.computed = ((): {a: number; b: boolean} => {
        })();
    }
}`,
        },
        {
            inp: `rule := 'a' .computed = {a: number; b: {nested: () => void};}[] {}`,
            ruleClasses: `export class rule {
    public kind: ASTKinds.rule = ASTKinds.rule;
    public computed: {a: number; b: {nested: () => void};}[];
    constructor(){
        this.computed = ((): {a: number; b: {nested: () => void};}[] => {
        })();
    }
}`,
        },
        {
            inp: `rule := 'a' .computed = { a(x: number): void } {}`,
            ruleClasses: `export class rule {
    public kind: ASTKinds.rule = ASTKinds.rule;
    public computed: { a(x: number): void };
    constructor(){
        this.computed = ((): { a(x: number): void } => {
        })();
    }
}`,
        },
        {
            inp: `rule := 'a' .computed = { [x: string]: void } {}`,
            ruleClasses: `export class rule {
    public kind: ASTKinds.rule = ASTKinds.rule;
    public computed: { [x: string]: void };
    constructor(){
        this.computed = ((): { [x: string]: void } => {
        })();
    }
}`,
        },
        {
            inp: `rule := 'a' .computed = { "test": test } {}`,
            ruleClasses: `export class rule {
    public kind: ASTKinds.rule = ASTKinds.rule;
    public computed: { "test": test };
    constructor(){
        this.computed = ((): { "test": test } => {
        })();
    }
}`,
        },
    ];
    for(const tc of tcs) {
        const res = parse(tc.inp);
        expect(res.err).toBeNull();
        expect(res.ast).not.toBeNull();
        const g = new Generator(tc.inp);
        const gram = g.AST2Gram(res.ast!);
        const got = writeBlock(g.writeRuleClasses(gram)).join("\n");
        expect(got).toEqual(tc.ruleClasses);
    }
});

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
        expect(g.callsRuleLeft(rule!.name, rule!.rule, gram, new Set()));
    }
});
