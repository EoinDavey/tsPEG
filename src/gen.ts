import { ALT, ASTKinds, GRAM, MATCH, Parser, PosInfo }  from "./meta";
import { expandTemplate } from "./template";
import { Block, Grammar, Ruledef, altNames, writeBlock } from "./util";
import { BannedNamesChecker, Checker, NoRuleNameCollisionChecker, RulesExistChecker } from "./checks";
import { matchType } from "./types";
import { extractRules, matchRule } from "./rules";
import { getRulesToMarkForBoundedRecursion } from "./leftrec";

function hasAttrs(alt: ALT): boolean {
    return alt.attrs.length > 0;
}

// addScope adds a prefix that uses illegal characters to
// ensure namespace separation wrt generated vs user supplied IDs
function addScope(id: string): string {
    return "$scope$" + id;
}

function memoName(id: string): string {
    return addScope(id + "$memo");
}

export function getMatchedSubstr(t: {start: PosInfo, end: PosInfo}, inputStr: string): string {
    return inputStr.substring(t.start.overallPos, t.end.overallPos);
}

export class Generator {
    // expandedGram is the grammar with all subrules expanded into their own Ruledefs
    public expandedGram: Grammar;
    // unexpandedGram is the grammar with no subrules expanded.
    public unexpandedGram: Grammar;
    private numEnums: boolean;
    private input: string;
    private checkers: Checker[] = [];
    private header: string | null;
    private boundedRecRules: Set<string>;

    public constructor(input: string, numEnums = false) {
        this.input = input;
        this.numEnums = numEnums;
        const p = new Parser(this.input);
        const res = p.parse();
        if (res.err)
            throw res.err;
        if (!res.ast)
            throw new Error("No AST found");
        this.expandedGram = this.astToExpandedGram(res.ast);
        this.unexpandedGram = res.ast.rules.map(def => {
            return {
                name: def.name,
                rule: def.rule.list,
                pos: def.namestart,
            };
        });
        this.header = res.ast.header?.content ?? null;
        this.boundedRecRules = getRulesToMarkForBoundedRecursion(this.unexpandedGram);
    }

    private astToExpandedGram(g: GRAM): Grammar {
        const gram = g.rules.map(def => extractRules(def.rule.list, def.name, def.namestart));
        return gram.reduce((x, y) => x.concat(y));
    }

    public addChecker(c: Checker): this {
        this.checkers.push(c);
        return this;
    }

    public writeKinds(gram: Grammar): Block {
        const astKinds = ([] as string[]).concat(...gram.map(altNames));
        return [
            "export enum ASTKinds {",
            this.numEnums
                ? astKinds.map(x => `${x},`)
                : astKinds.map(x => `${x} = "${x}",`),
            "}",
        ];
    }

    public writeMemos(): Block {
        const out: Block = [];
        for(const rule of this.expandedGram) {
            if(this.boundedRecRules.has(rule.name)) {
                out.push(`private ${memoName(rule.name)}: Map<number, [Nullable<${rule.name}>, PosInfo]> = new Map();`);
            }
        }
        return out;
    }

    public writeChoice(name: string, alt: ALT): Block {
        const namedTypes: [string, string][] = [];
        for (const match of alt.matches) {
            if (match.named) {
                const at = match.rule;
                namedTypes.push([match.named.name, matchType(at)]);
            }
        }
        // Rules with no named matches, no attrs and only one match are rule aliases
        if (namedTypes.length === 0 && alt.matches.length === 1 && !hasAttrs(alt)) {
            const at = alt.matches[0].rule;
            return [`export type ${name} = ${matchType(at)};`];
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
        const union = altNames(ruledef);
        const choices: Block = [];
        altNames(ruledef).forEach((name, i) => {
            choices.push(...this.writeChoice(name, ruledef.rule[i]));
        });
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
            const rn = matchRule(expr);
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

    public writeRuleAliasFnBody(name: string, expr: MATCH): Block {
        return [
                `return ${matchRule(expr)};`,
            ];
    }

    public writeChoiceParseFn(name: string, alt: ALT): Block {
        return [`public match${name}($$dpth: number, $$cr?: ErrorTracker): Nullable<${name}> {`,
             this.writeChoiceParseFnBody(name, alt),
            "}",
        ];
    }

    public getNamedTypes(alt: ALT): [string, string][] {
        const types: [string, string][] = [];
        for (const match of alt.matches) {
            if (!match.named)
                continue;
            const rn = matchType(match.rule);
            types.push([match.named.name, rn]);
        }
        return types;
    }

    public getUnnamedTypes(alt: ALT): string[] {
        const types: string[] = [];
        for (const match of alt.matches) {
            if (match.named)
                continue;
            const rn = matchType(match.rule);
            types.push(rn);
        }
        return types;
    }

    public writeChoiceParseFnBody(name: string, alt: ALT): Block {
        const namedTypes = this.getNamedTypes(alt);
        if(namedTypes.length === 0 && alt.matches.length === 1)
            return this.writeRuleAliasFnBody(name, alt.matches[0].rule);
        return [`return this.runner<${name}>($$dpth,`,
            [
                "() => {",
                [
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
                "})();",
            ],
        ];
    }

    private writeLeftRecRuleParseFn(name: string, body: Block): Block {
        const memo = memoName(name);
        const t: Block = [`public match${name}($$dpth: number, $$cr?: ErrorTracker): Nullable<${name}> {`,
        [
            'const fn = () => {',
            body,
            '};',
            'const pos = this.mark();',
            `const memo = this.${memo}.get(pos.overallPos);`,
            'if(memo !== undefined) {',
            '    this.reset(memo[1]);',
            '    return memo[0];',
            '}',
            `this.${memo}.set(pos.overallPos, [null, pos]);`,
            `let lastRes: Nullable<${name}> = null;`,
            'let lastPos: PosInfo = pos;',
            'for(;;) {',
            [
                'this.reset(pos);',
                'const res = fn();',
                'const end = this.mark();',
                'if(end.overallPos <= lastPos.overallPos)',
                [
                    'break;',
                ],
                'lastRes = res;',
                'lastPos = end;',
                `this.${memo}.set(pos.overallPos, [lastRes, lastPos]);`,
            ],
            '}',
            'this.reset(lastPos);',
            'return lastRes;',
        ],
    '}'];
        return t;
    }

    public writeRuleParseFns(ruledef: Ruledef): Block {
        const nm = ruledef.name;
        const choices: Block = [];
        const nms: string[] = altNames(ruledef);
        nms.forEach((name, i) => {
            choices.push(...this.writeChoiceParseFn(name, ruledef.rule[i]));
        });

        if(this.boundedRecRules.has(nm)) {
            const body = nms.length === 1 
                ? this.writeChoiceParseFnBody(nms[0], ruledef.rule[0])
                : this.writeUnionParseBody(nm, nms);
            const fn = this.writeLeftRecRuleParseFn(nm, body);
            if(nms.length === 1)
                return fn;
            return [...fn, ...choices];
        }
        const union = ruledef.rule.length <= 1 ? []
            : [`public match${nm}($$dpth: number, $$cr?: ErrorTracker): Nullable<${nm}> {`,
                this.writeUnionParseBody(nm, nms),
                `}`];
        return [...union, ...choices];
    }

    public writeUnionParseBody(name: string, alts: string[]): Block {
        return [
            `return this.choice<${name}>([`,
            alts.map(x => `() => this.match${x}($$dpth + 1, $$cr),`),
            `]);`,
        ];
    }

    public writeAllRuleParseFns(gram: Grammar): Block {
        const fns: Block = [];
        for (const ruledef of gram)
            fns.push(...this.writeRuleParseFns(ruledef));
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
                    "rec.getErr() ?? new SyntaxErr(this.mark(), [{kind: \"EOF\", negated: false}]));",
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
        for (const checker of this.checkers) {
            const err = checker.Check(this.expandedGram, this.input);
            if (err)
                throw err;
        }
        const hdr: Block = this.header ? [this.header] : [];
        const parseBlock = expandTemplate({
            inputStr: this.input,
            header: hdr,
            memos: this.writeMemos(),
            kinds: this.writeKinds(this.expandedGram),
            ruleClasses: this.writeRuleClasses(this.expandedGram),
            ruleParseFns: this.writeAllRuleParseFns(this.expandedGram),
            parseResult: this.writeParseResultClass(this.expandedGram),
        });
        return writeBlock(parseBlock).join("\n");
    }
}

export function buildParser(s: string, numEnums: boolean): string {
    const gen = new Generator(s, numEnums)
        .addChecker(BannedNamesChecker)
        .addChecker(RulesExistChecker)
        .addChecker(NoRuleNameCollisionChecker);
    return gen.generate();
}
