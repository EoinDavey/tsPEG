import { ALT, ASTKinds, ATOM, GRAM, MATCHSPEC, Parser, POSTOP, PREOP, RULE, RULEDEF, STRLIT } from "./meta";

import { expandTemplate } from "./template";

import { Block, indentBlock, writeBlock } from "./util";

type Rule = ALT[];
type Grammar = Ruledef[];
interface Ruledef {
    name: string;
    rule: Rule;
}

function unescapeSeqs(s: string): string {
    let out = "";
    for (let i = 0; i < s.length; ++i) {
        if (s[i] !== "\\") {
            out += s[i];
            continue;
        }
        if (s[i + 1] === "{" || s[i + 1] === "}" || s[i + 1] === "\\") {
            out += s[i + 1];
        } else {
            throw new Error(`Unknown escape code \\${s[i + 1]}`);
        }
        ++i;
    }
    return out;
}

function getAtom(expr: POSTOP): ATOM {
    return expr.pre.at;
}

function hasAttrs(alt: ALT): boolean {
    return alt.attrs.length > 0;
}

export class Generator {
    private subRules: Map<ATOM, string> = new Map();

    public AST2Gram(g: GRAM): Grammar {
        const gram = g.rules.map((def) => this.extractRules(def.rule.list, def.name));
        return gram.reduce((x, y) => x.concat(y));
    }

    public extractRules(rule: Rule, name: string): Ruledef[] {
        let cnt = 0;
        const rules = [{name, rule}];
        for (const alt of rule) {
            for (const match of alt.matches) {
                const at: ATOM = getAtom(match.rule);
                if (at.kind !== ASTKinds.ATOM_3) {
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
            return "Nullable<boolean>";
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

    public postType(expr: POSTOP): string {
        if (expr.op) {
            if (expr.op === "?") {
                return `Nullable<${this.preType(expr.pre)}>`;
            }
            return `${this.preType(expr.pre)}[]`;
        }
        return this.preType(expr.pre);
    }

    public postRule(expr: POSTOP): string {
        if (expr.op && expr.op !== "?") {
                return `this.loop<${this.preType(expr.pre)}>(() => ${this.preRule(expr.pre)}, ${expr.op === "+" ? "false" : "true"})`;
        }
        return this.preRule(expr.pre);
    }

    public atomRule(at: ATOM): string {
        if (at.kind === ASTKinds.ATOM_1) {
            return `this.match${at.name}($$dpth + 1, cr)`;
        }
        if (at.kind === ASTKinds.ATOM_2) {
            return `this.regexAccept(String.raw\`${at.match.val}\`, $$dpth + 1, cr)`;
        }
        const subname = this.subRules.get(at);
        if (subname) {
            return `this.match${subname}($$dpth + 1, cr)`;
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
        return "ERR";
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
            astKinds.map((x) => x + ","),
            "}",
        ];
    }

    public writeChoice(name: string, alt: ALT): Block {
        const namedTypes: Array<[string, string]> = [];
        for (const match of alt.matches) {
            if (match.named) {
                const at = match.rule;
                namedTypes.push([match.named.name, this.postType(at)]);
            }
        }
        // Rules with no named matches, no attrs and only one match are rule aliases
        if (namedTypes.length === 0 && alt.matches.length === 1 && !hasAttrs(alt)) {
            const at = alt.matches[0].rule;
            return [`export type ${name} = ${this.postType(at)};`];
        }
        if (hasAttrs(alt)) {
            const blk: Block = [
                `export class ${name} {`,
                [
                    `public kind: ASTKinds.${name} = ASTKinds.${name}`,
                    ...namedTypes.map((x) => `public ${x[0]}: ${x[1]};`),
                    ...alt.attrs.map((x) => `public ${x.name}: ${x.type}`),
                     `constructor(${namedTypes.map((x) => `${x[0]} : ${x[1]}`).join(", ")}){`,
                    namedTypes.map((x) => `this.${x[0]} = ${x[0]};`),
                    ...alt.attrs.map((x) => [`this.${x.name} = (() => {`,
                            unescapeSeqs(x.action).trim(),
                        "})()"]),
                    "}",
                ],
                "}",
            ];
            return blk;
        }
        const blk: Block = [
            `export interface ${name} {`,
            [
                `kind: ASTKinds.${name};`,
                ...namedTypes.map((x) => `${x[0]}: ${x[1]};`),
            ],
            "}",
        ];
        return blk;
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
            const rn = this.postRule(expr);
            if (match.named) {
                if (expr.optional) {
                    checks.push(`&& ((${match.named.name} = ${rn}) || true)`);
                } else {
                    checks.push(`&& (${match.named.name} = ${rn}) !== null`);
                }
            } else {
                if (expr.optional) {
                    checks.push(`&& ((${rn}) || true)`);
                } else {
                checks.push(`&& ${rn} !== null`);
                }
            }
        }
        return checks;
    }

    public writeRuleAliasFn(name: string, expr: POSTOP): Block {
        return [`public match${name}($$dpth: number, cr?: ContextRecorder): Nullable<${name}> {`,
            [
                `return ${this.postRule(expr)};`,
            ],
            "}",
        ];
    }

    public writeChoiceParseFn(name: string, alt: ALT): Block {
        const namedTypes: Array<[string, string]> = [];
        const unnamedTypes: string[] = [];
        for (const match of alt.matches) {
            const expr = match.rule;
            const rn = this.postType(expr);
            if (match.named) {
                namedTypes.push([match.named.name, rn]);
            } else {
                unnamedTypes.push(rn);
            }
        }
        if (namedTypes.length === 0 && alt.matches.length === 1) {
            return this.writeRuleAliasFn(name, alt.matches[0].rule);
        }
        return [`public match${name}($$dpth: number, cr?: ContextRecorder): Nullable<${name}> {`,
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
                        ...namedTypes.map((x) => `let ${x[0]}: Nullable<${x[1]}>;`),
                        `let res: Nullable<${name}> = null;`,
                        "if (true",
                        this.writeParseIfStmt(alt),
                        ") {",
                        [
                            hasAttrs(alt)
                            ? `res = new ${name}(${namedTypes.map((x) => x[0]).join(", ")});`
                            : `res = {kind: ASTKinds.${name}, ${namedTypes.map((x) => x[0]).join(", ")}};`,
                        ],
                        "}",
                        "return res;",
                    ],
                    "}, cr)();",
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
            : [`public match${nm}($$dpth: number, cr?: ContextRecorder): Nullable<${nm}> {`,
                [
                    `return this.choice<${nm}>([`,
                    nms.map((x) => `() => this.match${x}($$dpth + 1, cr),`),
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
                "return new ParseResult(res, rec.getErr());",
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

    public generate(s: string): string {
        const p = new Parser(s);
        const res = p.parse();
        if (res.err) {
            throw res.err;
        }
        if (!res.ast) {
            throw new Error("No AST found");
        }
        const gram = this.AST2Gram(res.ast);
        const hdr: Block = res.ast.header ? [res.ast.header.content] : [];
        const parseBlock = expandTemplate(s, hdr, this.writeKinds(gram), this.writeRuleClasses(gram),
            this.writeRuleParseFns(gram), this.writeParseResultClass(gram));
        return writeBlock(parseBlock).join("\n");
    }
}

export function buildParser(s: string): string {
    const gen = new Generator();
    return gen.generate(s);
}
