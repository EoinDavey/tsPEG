import { ALT, ASTKinds, GRAM, MATCH, Parser, PosInfo, SyntaxErr }  from "./meta";
import { expandTemplate } from "./template";
import { Block, Grammar, Ruledef, altNames, flattenBlock, usesEOF, writeBlock } from "./util";
import { BannedNamesChecker, Checker, NoKeywords, NoRuleNameCollisionChecker, RulesExistChecker } from "./checks";
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

function getNamedTypes(alt: ALT): [string, string][] {
    const types: [string, string][] = [];
    for (const match of alt.matches) {
        if (!match.named)
            continue;
        const rn = matchType(match.rule);
        types.push([match.named.name, rn]);
    }
    return types;
}

function buildAstKindsByName(expandedGram: Grammar, numEnums: boolean): ReadonlyMap<string, string> {
    const astKinds = ([] as string[]).concat(...expandedGram.map(altNames));
    const astKindsByName = new Map<string, string>();
    astKinds.forEach((kind, index) => {
        astKindsByName.set(kind, numEnums ? String(index) : `"${kind}"`);
    });
    return astKindsByName;
}

// Rules with no named matches, no attrs and only one match are rule aliases
function isAlias(alt: ALT): boolean {
    return getNamedTypes(alt).length === 0 && alt.matches.length === 1 && !hasAttrs(alt);
}

function memoedBody(memo: string, body: Block): Block {
    return [
        'return this.memoise(',
        [
            '() => {',
            body,
            '},',
            `this.${memoName(memo)},`,
        ],
        ');',
    ];
}

export function getMatchedSubstr(t: {start: PosInfo, end: PosInfo}, inputStr: string): string {
    return inputStr.substring(t.start.overallPos, t.end.overallPos);
}

// We use a class so we can do an instanceof check
export class SyntaxErrs {
    constructor(public errs: SyntaxErr[]) {
    }
}

export class Generator {
    // expandedGram is the grammar with all subrules expanded into their own Ruledefs
    public expandedGram: Grammar;
    // unexpandedGram is the grammar with no subrules expanded.
    public unexpandedGram: Grammar;
    // Whether to use strings or numbers for AST kinds
    private numEnums: boolean;
    // Whether to use an enum or a union of string/number constants for AST kinds
    private erasableSyntax: boolean;
    private enableMemos: boolean;
    private regexFlags: string;
    private includeGrammar: boolean;

    private input: string;
    private checkers: Checker[] = [];
    private header: string | null;
    private boundedRecRules: Set<string>;
    private readonly astKindsByName: ReadonlyMap<string, string>;

    public constructor(input: string, numEnums = false, enableMemos = false, regexFlags = "", includeGrammar = true, erasableSyntax = false) {
        this.input = input;
        this.numEnums = numEnums;
        this.erasableSyntax = erasableSyntax;
        this.enableMemos = enableMemos;
        this.regexFlags = regexFlags;
        this.includeGrammar = includeGrammar;
        const p = new Parser(this.input);
        const res = p.parse();
        if (res.errs.length > 0)
            throw new SyntaxErrs(res.errs);
        if (!res.ast)
            throw new Error("No AST found");
        this.expandedGram = this.astToExpandedGram(res.ast);
        this.unexpandedGram = res.ast.rules.map(def => {
            return {
                name: def.name,
                subNames: def.rule.list.map(alt => alt.rulename?.name),
                rule: def.rule.list,
                pos: def.namestart,
            };
        });
        this.header = res.ast.header?.content ?? null;
        this.boundedRecRules = getRulesToMarkForBoundedRecursion(this.unexpandedGram);
        this.astKindsByName = buildAstKindsByName(this.expandedGram, this.numEnums);
    }

    private astToExpandedGram(g: GRAM): Grammar {
        const gram = g.rules.map(def => extractRules(def.rule.list, def.name, def.namestart));
        return gram.reduce((x, y) => x.concat(y));
    }

    public addChecker(c: Checker): this {
        this.checkers.push(c);
        return this;
    }

    public writeKinds(): Block {
        const astKinds = ([] as string[]).concat(...this.expandedGram.map(altNames));
        if(usesEOF(this.expandedGram))
            astKinds.push("$EOF");
        if (this.erasableSyntax) {
            return [
                "export const ASTKinds = {",
                this.numEnums
                    ? astKinds.map((x, i) => `${x}: ${i},`)
                    : astKinds.map(x => `${x}: "${x}",`),
                "} as const",
                "export type ASTKinds = ",
                this.numEnums
                    ? astKinds.map((x, i) => `| ${i}`)
                    : astKinds.map(x => `| "${x}"`),
                ";",
            ];
        }
        return [
            "export enum ASTKinds {",
            this.numEnums
                ? astKinds.map(x => `${x},`)
                : astKinds.map(x => `${x} = "${x}",`),
            "}",
        ];
    }

    private memoRules(): Ruledef[] {
        return this.enableMemos
            ? this.expandedGram
            : this.expandedGram
                .filter(rule => this.boundedRecRules.has(rule.name));
    }

    public writeMemos(): Block {
        return this.memoRules().map(rule =>
            `protected ${memoName(rule.name)}: Map<number, [Nullable<${rule.name}>, PosInfo]> = new Map();`);
    }

    public writeMemoClearFn(): Block {
        const ls: Block = this.memoRules().map(rule => `this.${memoName(rule.name)}.clear();`);
        return [
            'public clearMemos(): void {',
            ls,
            '}',
        ];
    }

    public writeChoice(name: string, alt: ALT): Block {
        const namedTypes = getNamedTypes(alt);
        if (isAlias(alt)) {
            const at = alt.matches[0].rule;
            return [`export type ${name} = ${matchType(at)};`];
        }
        // If we have computed properties, then we need a class, not an interface.
        if (hasAttrs(alt)) {
            return [
                `export class ${name} {`,
                [
                    `public kind: ${this.astKindsType(name)} = ASTKinds.${name};`,
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
                `kind: ${this.astKindsType(name)};`,
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

    public writeRuleAliasFnBody(expr: MATCH): Block {
        return [
            `return ${matchRule(expr)};`,
        ];
    }

    public writeChoiceParseFn(name: string, alt: ALT, memo = false): Block {
        return [`public match${name}($$dpth: number, $$cr?: ErrorTracker): Nullable<${name}> {`,
            memo
                ? memoedBody(name, this.writeChoiceParseFnBody(name, alt))
                : this.writeChoiceParseFnBody(name, alt),
            "}",
        ];
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
        const namedTypes = getNamedTypes(alt);
        if(isAlias(alt))
            return this.writeRuleAliasFnBody(alt.matches[0].rule);
        return [
            `return this.run<${name}>($$dpth,`,
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
                "});",
            ],
        ];
    }

    private writeLeftRecRuleParseFn(name: string, body: Block): Block {
        const memo = memoName(name);
        const posVar = addScope("pos");
        const oldMemoSafe = addScope("oldMemoSafe");
        const t: Block = [`public match${name}($$dpth: number, $$cr?: ErrorTracker): Nullable<${name}> {`,
            [
                'const fn = () => {',
                body,
                '};',
                `const ${posVar} = this.mark();`,
                `const memo = this.${memo}.get(${posVar}.overallPos);`,
                'if(memo !== undefined) {',
                '    this.reset(memo[1]);',
                '    return memo[0];',
                '}',
                `const ${oldMemoSafe} = this.memoSafe;`,
                'this.memoSafe = false;',
                `this.${memo}.set(${posVar}.overallPos, [null, ${posVar}]);`,
                `let lastRes: Nullable<${name}> = null;`,
                `let lastPos: PosInfo = ${posVar};`,
                'for(;;) {',
                [
                    `this.reset(${posVar});`,
                    'const res = fn();',
                    'const end = this.mark();',
                    'if(end.overallPos <= lastPos.overallPos)',
                    [
                        'break;',
                    ],
                    'lastRes = res;',
                    'lastPos = end;',
                    `this.${memo}.set(${posVar}.overallPos, [lastRes, lastPos]);`,
                ],
                '}',
                'this.reset(lastPos);',
                `this.memoSafe = ${oldMemoSafe};`,
                'return lastRes;',
            ],
            '}'];
        return t;
    }

    public writeRuleParseFns(ruledef: Ruledef): Block {
        const nm = ruledef.name;
        const nms: string[] = altNames(ruledef);

        if(this.boundedRecRules.has(nm)) {
            if(nms.length === 1) {
                // Only 1, skip the union
                const body = this.writeChoiceParseFnBody(nms[0], ruledef.rule[0]);
                if(nm !== nms[0])
                    throw `${nm} != ${nms[0]}`;
                const fn = this.writeLeftRecRuleParseFn(nm, body);

                return fn;
            }
            const body = this.writeUnionParseBody(nm, nms);
            const fn = this.writeLeftRecRuleParseFn(nm, body);
            const choiceFns = flattenBlock(nms.map((name, i) =>
                this.writeChoiceParseFn(name, ruledef.rule[i])));

            return [...fn, ...choiceFns];
        }
        if(ruledef.rule.length <= 1)
            return this.writeChoiceParseFn(nm, ruledef.rule[0], this.enableMemos);
        const union = this.writeUnionParseFn(nm, nms, this.enableMemos);
        const choiceFns = flattenBlock(
            nms.map((name, i) => this.writeChoiceParseFn(name, ruledef.rule[i])));
        return [...union, ...choiceFns];
    }

    public writeUnionParseFn(name: string, alts: string[], memo = false): Block {
        return [
            `public match${name}($$dpth: number, $$cr?: ErrorTracker): Nullable<${name}> {`,
            memo
                ? memoedBody(name, this.writeUnionParseBody(name, alts))
                : this.writeUnionParseBody(name, alts),
            `}`,
        ];
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
                "const ans = res !== null;",
                "this.reset(mrk);",
                "return ans;",
            ],
            "}",
            "public parse(): ParseResult {",
            [
                "const mrk = this.mark();",
                `const res = this.match${S}(0);`,
                "if (res)",
                [
                    "return {ast: res, errs: []};",
                ],
                "this.reset(mrk);",
                "const rec = new ErrorTracker();",
                "this.clearMemos();",
                `this.match${S}(0, rec);`,
                "const err = rec.getErr()",
                "return {ast: res, errs: err !== null ? [err] : []}",
            ],
            "}",
        ];
    }

    public writeParseResultClass(gram: Grammar): Block {
        const head = gram[0];
        const startname = head.name;
        return ["export interface ParseResult {",
            [
                `ast: Nullable<${startname}>;`,
                "errs: SyntaxErr[];",
            ],
            "}",
        ];
    }

    public generate(): string {
        // TODO Support throwing more checks than one.
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
            memoClearFn: this.writeMemoClearFn(),
            kinds: this.writeKinds(),
            regexFlags: this.regexFlags,
            ruleClasses: this.writeRuleClasses(this.expandedGram),
            ruleParseFns: this.writeAllRuleParseFns(this.expandedGram),
            parseResult: this.writeParseResultClass(this.expandedGram),
            usesEOF: usesEOF(this.expandedGram),
            eofType: this.erasableSyntax ? this.astKindsType("$EOF") : `ASTKinds.$EOF`,
            includeGrammar: this.includeGrammar,
        });
        return writeBlock(parseBlock).join("\n");
    }

    private astKindsType(name: string): string {
        if (this.erasableSyntax) {
            return this.astKindsByName.get(name) ?? "never"; 
        }
        return `ASTKinds.${name}`;
    }
}

export function buildParser(s: string, numEnums: boolean, enableMemos: boolean, regexFlags: string, includeGrammar = true, erasableSyntax = false): string {
    const gen = new Generator(s, numEnums, enableMemos, regexFlags, includeGrammar, erasableSyntax)
        .addChecker(BannedNamesChecker)
        .addChecker(RulesExistChecker)
        .addChecker(NoRuleNameCollisionChecker)
        .addChecker(NoKeywords);
    return gen.generate();
}
