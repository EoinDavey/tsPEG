import { TS_TYPE, ALT, ASTKinds, ATOM, GRAM, MATCHSPEC, Parser, PosInfo, MATCH, PREOP, RULE, RULEDEF, STRLIT } from "./meta";

import { expandTemplate } from "./template";

import { unescapeSeqs, Block, indentBlock, writeBlock } from "./util";

type Rule = ALT[];
type Grammar = Ruledef[];
interface Ruledef {
    name: string;
    rule: Rule;
}

function hasAttrs(alt: ALT): boolean {
    return alt.attrs.length > 0;
}

// addScope adds a prefix that uses illegal characters to
// ensure namespace separation wrt generated vs user supplied IDs
function addScope(id: string): string {
    return "$scope$" + id;
}

export function getMatchedSubstr(t: {start: PosInfo, end: PosInfo}, inputStr: string): string {
    return inputStr.substring(t.start.overallPos, t.end.overallPos);
}

export class Generator {
    private subRules: Map<ATOM, string> = new Map();
    private numEnums: boolean;
    private input: string;

    public constructor(input: string, numEnums: boolean = false) {
        this.input = input;
        this.numEnums = numEnums;
    }

    public AST2Gram(g: GRAM): Grammar {
        const gram = g.rules.map((def) => this.extractRules(def.rule.list, def.name));
        return gram.reduce((x, y) => x.concat(y));
    }

    // extractRule does a traversal of the AST assigning names to
    // subrules and storing them in this.subRules. It takes subrules and assigns
    // them their own Ruledef in the grammar, effectively flattening the
    // structure of the grammar.
    public extractRules(rule: Rule, name: string): Ruledef[] {
        let cnt = 0;
        const rules = [{name, rule}];
        for (const alt of rule) {
            for (const match of alt.matches) {
                // Check if special rule
                if(match.rule.kind === ASTKinds.SPECIAL)
                    continue;
                // Check if not a subrule
                const at = match.rule.pre.at;
                if (at === null || at.kind !== ASTKinds.ATOM_3) {
                    continue;
                }
                const subrule = at.sub;
                const nm = `${name}_$${cnt}`;
                this.subRules.set(at, nm);
                const rdfs = this.extractRules(subrule.list, nm);
                rules.push(...rdfs);
                ++cnt;
            }
        }
        return rules;
    }

    public preType(expr: PREOP): string {
        if (expr.op && expr.op === "!") { // Negation types return null if matched, true otherwise
            return "boolean";
        }
        return this.atomType(expr.at);
    }

    public preRule(expr: PREOP): string {
        if (expr.op && expr.op === "&") {
            return `this.noConsume<${this.atomType(expr.at)}>(() => ${this.atomRule(expr.at)})`;
        }
        if (expr.op && expr.op === "!") {
            return `this.negate(() => ${this.atomRule(expr.at)})`;
        }
        return this.atomRule(expr.at);
    }

    public matchType(expr: MATCH): string {
        // Check if special rule
        if (expr.kind === ASTKinds.SPECIAL)
            return "PosInfo";
        if (expr.op) {
            if (expr.op === "?") {
                return `Nullable<${this.preType(expr.pre)}>`;
            }
            return `${this.preType(expr.pre)}[]`;
        }
        return this.preType(expr.pre);
    }

    public matchRule(expr: MATCH): string {
        // Check if special rule
        if (expr.kind === ASTKinds.SPECIAL) {
            return "this.mark()";
        }
        if (expr.op && expr.op !== "?") {
                return `this.loop<${this.preType(expr.pre)}>(() => ${this.preRule(expr.pre)}, ${expr.op === "+" ? "false" : "true"})`;
        }
        return this.preRule(expr.pre);
    }

    public atomRule(at: ATOM): string {
        if (at.kind === ASTKinds.ATOM_1) {
            return `this.match${at.name}($$dpth + 1, $$cr)`;
        }
        if (at.kind === ASTKinds.ATOM_2) {
            // Regex match
            const mtch = at.match;
            const reg = "(?:" + mtch.val + ")";
            try {
                // Ensure the original regex is valid
                let _ = new RegExp(mtch.val);
                // Ensure the RegExp wrapped in brackets is valid
                _  = new RegExp(reg);
            } catch (err) {
                throw new Error(`Couldnt' compile regex ${mtch.val} at line ${mtch.start.line}:${mtch.start.offset} : ${err}`);
            }
            return `this.regexAccept(String.raw\`${reg}\`, $$dpth + 1, $$cr)`;
        }
        const subname = this.subRules.get(at);
        if (subname) {
            return `this.match${subname}($$dpth + 1, $$cr)`;
        }
        return "ERR";
    }

    public atomType(at: ATOM): string {
        if (at.kind === ASTKinds.ATOM_1) {
            return at.name;
        }
        if (at.kind === ASTKinds.ATOM_2) {
            return "string";
        }
        const subname = this.subRules.get(at);
        if (subname) {
            return subname;
        }
        throw new Error("Unknown subrule");
    }

    public writeKinds(gram: Grammar): Block {
        const astKinds = [];
        for (const ruledef of gram) {
            const nm = ruledef.name;
            for (let i = 0; i < ruledef.rule.length; i++) {
                const md = ruledef.rule.length === 1 ? "" : `_${i + 1}`;
                astKinds.push(nm + md);
            }
        }
        return [
            "export enum ASTKinds {",
            this.numEnums
                ? astKinds.map(x => `${x},`)
                : astKinds.map(x => `${x} = "${x}",`),
            "}",
        ];
    }

    public writeChoice(name: string, alt: ALT): Block {
        const namedTypes: [string, string][] = [];
        for (const match of alt.matches) {
            if (match.named) {
                const at = match.rule;
                namedTypes.push([match.named.name, this.matchType(at)]);
            }
        }
        // Rules with no named matches, no attrs and only one match are rule aliases
        if (namedTypes.length === 0 && alt.matches.length === 1 && !hasAttrs(alt)) {
            const at = alt.matches[0].rule;
            return [`export type ${name} = ${this.matchType(at)};`];
        }
        // If we have computed properties, then we need a class, not an interface.
        if (hasAttrs(alt)) {
            return [
                `export class ${name} {`,
                [
                    `public kind: ASTKinds.${name} = ASTKinds.${name};`,
                    ...namedTypes.map((x) => `public ${x[0]}: ${x[1]};`),
                    ...alt.attrs.map((x) => `public ${x.name}: ${getMatchedSubstr(x.type, this.input)};`),
                     `constructor(${namedTypes.map((x) => `${x[0]}: ${x[1]}`).join(", ")}){`,
                    namedTypes.map((x) => `this.${x[0]} = ${x[0]};`),
                    ...alt.attrs.map(x => [`this.${x.name} = ((): ${getMatchedSubstr(x.type, this.input)} => {`,
                            getMatchedSubstr(x.code, this.input).trim(),
                        "})();"]),
                    "}",
                ],
                "}",
            ];
        }
        return [
            `export interface ${name} {`,
            [
                `kind: ASTKinds.${name};`,
                ...namedTypes.map((x) => `${x[0]}: ${x[1]};`),
            ],
            "}",
        ];
    }

    public writeRuleClass(ruledef: Ruledef): Block {
        const nm = ruledef.name;
        const union: string[] = [];
        const choices: Block = [];
        for (let i = 0; i < ruledef.rule.length; i++) {
            const md = nm + (ruledef.rule.length === 1 ? "" : `_${i + 1}`);
            choices.push(...this.writeChoice(md, ruledef.rule[i]));
            union.push(md);
        }
        const typedef = ruledef.rule.length > 1 ? [`export type ${nm} = ${union.join(" | ")};`] : [];
        return [...typedef, ...choices];
    }

    public writeRuleClasses(gram: Grammar): Block {
        const types: string[] = [];
        const rules: Block = [];
        for (const ruledef of gram) {
            types.push(ruledef.name);
            rules.push(...this.writeRuleClass(ruledef));
        }
        return rules;
    }

    public writeParseIfStmt(alt: ALT): Block {
        const checks: string[] = [];
        for (const match of alt.matches) {
            const expr = match.rule;
            const rn = this.matchRule(expr);
            if (match.named) {
                // Optional match
                if (expr.kind !== ASTKinds.SPECIAL && expr.optional) {
                    checks.push(`&& ((${addScope(match.named.name)} = ${rn}) || true)`);
                } else {
                    checks.push(`&& (${addScope(match.named.name)} = ${rn}) !== null`);
                }
            } else {
                // Optional match
                if (expr.kind !== ASTKinds.SPECIAL && expr.optional) {
                    checks.push(`&& ((${rn}) || true)`);
                } else {
                    checks.push(`&& ${rn} !== null`);
                }
            }
        }
        return checks;
    }

    public writeRuleAliasFn(name: string, expr: MATCH): Block {
        return [`public match${name}($$dpth: number, $$cr?: ContextRecorder): Nullable<${name}> {`,
            [
                `return ${this.matchRule(expr)};`,
            ],
            "}",
        ];
    }

    public writeChoiceParseFn(name: string, alt: ALT): Block {
        const namedTypes: [string, string][] = [];
        const unnamedTypes: string[] = [];
        for (const match of alt.matches) {
            const expr = match.rule;
            const rn = this.matchType(expr);
            if (match.named) {
                namedTypes.push([match.named.name, rn]);
            } else {
                unnamedTypes.push(rn);
            }
        }
        if (namedTypes.length === 0 && alt.matches.length === 1) {
            return this.writeRuleAliasFn(name, alt.matches[0].rule);
        }
        return [`public match${name}($$dpth: number, $$cr?: ContextRecorder): Nullable<${name}> {`,
            [
                `return this.runner<${name}>($$dpth,`,
                [
                    "(log) => {",
                    [
                        "if (log) {",
                        [
                            `log("${name}");`,
                        ],
                        "}",
                        ...namedTypes.map((x) => `let ${addScope(x[0])}: Nullable<${x[1]}>;`),
                        `let $$res: Nullable<${name}> = null;`,
                        "if (true",
                        this.writeParseIfStmt(alt),
                        ") {",
                        [
                            hasAttrs(alt)
                            ? `$$res = new ${name}(${namedTypes.map(x => addScope(x[0])).join(", ")});`
                            : `$$res = {kind: ASTKinds.${name}, ${namedTypes.map(x => `${x[0]}: ${addScope(x[0])}`).join(", ")}};`,
                        ],
                        "}",
                        "return $$res;",
                    ],
                    "}, $$cr)();",
                ],
            ],
            "}",
        ];
    }

    public writeRuleParseFn(ruledef: Ruledef): Block {
        const nm = ruledef.name;
        const choices: Block = [];
        const nms: string[] = [];
        for (let i = 0; i < ruledef.rule.length; i++) {
            const md = nm + (ruledef.rule.length === 1 ? "" : `_${i + 1}`);
            nms.push(md);
            choices.push(...this.writeChoiceParseFn(md, ruledef.rule[i]));
        }
        const union = ruledef.rule.length <= 1 ? []
            : [`public match${nm}($$dpth: number, $$cr?: ContextRecorder): Nullable<${nm}> {`,
                [
                    `return this.choice<${nm}>([`,
                    nms.map((x) => `() => this.match${x}($$dpth + 1, $$cr),`),
                    `]);`,
                ],
                `}`];
        return [...union, ...choices];
    }

    public writeRuleParseFns(gram: Grammar): Block {
        const fns: Block = [];
        for (const ruledef of gram) {
            fns.push(...this.writeRuleParseFn(ruledef));
        }
        const S: string = gram[0].name;
        return [...fns,
            "public test(): boolean {",
            [
                "const mrk = this.mark();",
                `const res = this.match${S}(0);`,
                "const ans = res !== null && this.finished();",
                "this.reset(mrk);",
                "return ans;",
            ],
            "}",
            "public parse(): ParseResult {",
            [
                "const mrk = this.mark();",
                `const res = this.match${S}(0);`,
                "if (res && this.finished()) {",
                [
                    "return new ParseResult(res, null);",
                ],
                "}",
                "this.reset(mrk);",
                "const rec = new ErrorTracker();",
                `this.match${S}(0, rec);`,
                "return new ParseResult(res,",
                [
                    // If no parser error, but not finished, then we must have not consumed all input.
                    // In this case return special error rule $EOF
                    "rec.getErr() ?? new SyntaxErr(this.mark(), new Set([\"$EOF\"]), new Set([])));",
                ],
            ],
            "}",
        ];
    }

    public writeParseResultClass(gram: Grammar): Block {
        const head = gram[0];
        const startname = head.name;
        return ["export class ParseResult {",
            [
                `public ast: Nullable<${startname}>;`,
                "public err: Nullable<SyntaxErr>;",
                `constructor(ast: Nullable<${startname}>, err: Nullable<SyntaxErr>) {`,
                [
                    "this.ast = ast;",
                    "this.err = err;",
                ],
                "}",
            ],
            "}",
        ];
    }

    public generate(): string {
        const p = new Parser(this.input);
        const res = p.parse();
        if (res.err) {
            throw res.err;
        }
        if (!res.ast) {
            throw new Error("No AST found");
        }
        const gram = this.AST2Gram(res.ast);
        const hdr: Block = res.ast.header ? [res.ast.header.content] : [];
        const parseBlock = expandTemplate(this.input, hdr, this.writeKinds(gram), this.writeRuleClasses(gram),
            this.writeRuleParseFns(gram), this.writeParseResultClass(gram));
        return writeBlock(parseBlock).join("\n");
    }
}

export function buildParser(s: string, numEnums: boolean): string {
    const gen = new Generator(s, numEnums);
    return gen.generate();
}
