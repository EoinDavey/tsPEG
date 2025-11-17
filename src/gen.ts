import { GRAM, Parser, PosInfo, SyntaxErr }  from "./parser.gen";
import { expandTemplate } from "./template";
import { Block, Grammar, flattenBlock, writeBlock } from "./util";
import { BannedNamesChecker, Checker, NoKeywords, NoRuleNameCollisionChecker, RulesExistChecker } from "./checks";
import { matchTypeFromModel } from "./types";
import { extractRules, matchRuleFromModel } from "./rules";
import { getRulesToMarkForBoundedRecursion } from "./leftrec";
import { ModelBuilder } from './builder';
import * as model from "./model";
import { ExpansionVisitor } from "./expansion";
import { SimpleVisitor } from "./simplevisitor";

// addScope adds a prefix that uses illegal characters to
// ensure namespace separation wrt generated vs user supplied IDs
function addScope(id: string): string {
    return "$scope$" + id;
}

function memoName(id: string): string {
    return addScope(id + "$memo");
}


/**
 * Extracts the name and TypeScript type of all named matches in a MatchSequence.
 * This is the model-aware equivalent of the old `getNamedTypes` function.
 * @param sequence The MatchSequence from the semantic model.
 * @returns An array of tuples, where each tuple is [matchName, typeAsString].
 */
function getNamedTypesFromModel(sequence: model.MatchSequence): [string, string][] {
    const types: [string, string][] = [];
    for (const match of sequence.matches) {
        if (match.name === null) {
            continue;
        }
        const type = matchTypeFromModel(match.expression);
        types.push([match.name, type]);
    }
    return types;
}

function buildAstKindsByName(astKinds: string[], numEnums: boolean): ReadonlyMap<string, string> {
    const astKindsByName = new Map<string, string>();
    astKinds.forEach((kind, index) => {
        astKindsByName.set(kind, numEnums ? String(index) : `"${kind}"`);
    });
    return astKindsByName;
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
    private readonly model: model.Grammar;
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
    private readonly astKinds: string[];
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
                rule: def.rule.list,
                pos: def.namestart,
            };
        });
        this.header = res.ast.header?.content ?? null;
        const modelBuilder = new ModelBuilder(this.input);
        this.model = modelBuilder.build(res.ast);
        this.astKinds = this.getExpandedRules().flatMap(rule => rule.definition.alternatives.map(alt => alt.name));
        if(this.usesEOFInModel())
            this.astKinds.push("$EOF");
        this.boundedRecRules = getRulesToMarkForBoundedRecursion(this.model);
        this.astKindsByName = buildAstKindsByName(this.astKinds, this.numEnums);
    }

    private astToExpandedGram(g: GRAM): Grammar {
        const gram = g.rules.map(def => extractRules(def.rule.list, def.name, def.namestart));
        return gram.reduce((x, y) => x.concat(y));
    }

    public addChecker(c: Checker): this {
        this.checkers.push(c);
        return this;
    }

    private usesEOFInModel(): boolean {
        const visitor = new class extends SimpleVisitor {
            public foundEOF = false;
            visitEOFMatch(_expr: model.EOFMatch){
                this.foundEOF = true;
            }
        };
        this.model.accept(visitor);
        return visitor.foundEOF;
    }

    private getExpandedRules(): model.Rule[] {
        const visitor = new ExpansionVisitor();
        this.model.accept(visitor);
        return visitor.rules;
    }

    public writeKinds(): Block {
        if (this.erasableSyntax) {
            return [
                "export const ASTKinds = {",
                this.numEnums
                    ? this.astKinds.map((x, i) => `${x}: ${i},`)
                    : this.astKinds.map(x => `${x}: "${x}",`),
                "} as const",
                "export type ASTKinds = ",
                this.numEnums
                    ? this.astKinds.map((x, i) => `| ${i}`)
                    : this.astKinds.map(x => `| "${x}"`),
                ";",
            ];
        }
        return [
            "export enum ASTKinds {",
            this.numEnums
                ? this.astKinds.map(x => `${x},`)
                : this.astKinds.map(x => `${x} = "${x}",`),
            "}",
        ];
    }

    private memoRules(): model.Rule[] {
        const allRules = this.getExpandedRules();
        return this.enableMemos
            ? allRules
            : allRules
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

    public writeChoice(name: string, sequence: model.MatchSequence): Block {
        const type = sequence.getType();

        if (type === 'alias') {
            const expressionType = matchTypeFromModel(sequence.matches[0].expression);
            return [`export type ${name} = ${expressionType};`];
        }

        const namedTypes = getNamedTypesFromModel(sequence);

        if (type === 'class') {
            return [
                `export class ${name} {`,
                [
                    `public kind: ${this.astKindsType(name)} = ASTKinds.${name};`,
                    ...namedTypes.map((x) => `public ${x[0]}: ${x[1]};`),
                    ...sequence.attributes.map((attr) => `public ${attr.name}: ${attr.type};`),
                    `constructor(${namedTypes.map((x) => `${x[0]}: ${x[1]}`).join(", ")}){`,
                    namedTypes.map((x) => `this.${x[0]} = ${x[0]};`),
                    ...sequence.attributes.map(attr => [`this.${attr.name} = ((): ${attr.type} => {`,
                        attr.code.trim(),
                        "})();"]),
                    "}",
                ],
                "}",
            ];
        }

        // The remaining case is 'interface'
        return [
            `export interface ${name} {`,
            [
                `kind: ${this.astKindsType(name)};`,
                ...namedTypes.map((x) => `${x[0]}: ${x[1]};`),
            ],
            "}",
        ];
    }

    public writeRuleClasses(): Block {
        const expandedRules = this.getExpandedRules();
        const allBlocks: Block = [];

        for (const rule of expandedRules) {
            const alternatives = rule.definition.alternatives;

            // Generate union type if needed
            if (alternatives.length > 1) {
                const unionNames = alternatives.map(alt => alt.name);
                allBlocks.push(`export type ${rule.name} = ${unionNames.join(" | ")};`);
            }

            // Generate the interface/class/alias for each alternative
            for (const alternative of alternatives) {
                allBlocks.push(...this.writeChoice(alternative.name, alternative));
            }
        }
        return allBlocks;
    }

    public writeParseIfStmt(sequence: model.MatchSequence): Block {
        const checks: string[] = [];
        for (const match of sequence.matches) {
            const expr = match.expression;
            const rn = matchRuleFromModel(expr);
            const isOptional = expr.kind === model.MatchExpressionKind.PostfixExpression &&
                               (expr as model.PostfixExpression).op.kind === model.PostfixOpKind.Optional;

            if (match.name) {
                // Optional match
                if (isOptional) {
                    checks.push(`&& ((${addScope(match.name)} = ${rn}) || true)`);
                } else {
                    checks.push(`&& (${addScope(match.name)} = ${rn}) !== null`);
                }
            } else {
                // Optional match
                if (isOptional) {
                    checks.push(`&& ((${rn}) || true)`);
                } else {
                    checks.push(`&& ${rn} !== null`);
                }
            }
        }
        return checks;
    }

    public writeRuleAliasFnBody(expr: model.MatchExpression): Block {
        return [
            `return ${matchRuleFromModel(expr)};`,
        ];
    }

    public writeChoiceParseFn(name: string, sequence: model.MatchSequence, memo = false): Block {
        return [`public match${name}($$dpth: number, $$cr?: ErrorTracker): Nullable<${name}> {`,
            memo
                ? memoedBody(name, this.writeChoiceParseFnBody(name, sequence))
                : this.writeChoiceParseFnBody(name, sequence),
            "}",
        ];
    }

    public writeChoiceParseFnBody(name: string, sequence: model.MatchSequence): Block {
        const namedTypes = getNamedTypesFromModel(sequence);
        const type = sequence.getType();

        if (type === 'alias') {
            return this.writeRuleAliasFnBody(sequence.matches[0].expression);
        }

        return [
            `return this.run<${name}>($$dpth,`,
            [
                "() => {",
                [
                    ...namedTypes.map((x) => `let ${addScope(x[0])}: Nullable<${x[1]}>;`),
                    `let $$res: Nullable<${name}> = null;`,
                    "if (true",
                    this.writeParseIfStmt(sequence),
                    ") {",
                    [
                        type === 'class'
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

    public writeRuleParseFns(rule: model.Rule): Block {
        const nm = rule.name;
        const nms = rule.definition.alternatives.map(alt => alt.name);

        if(this.boundedRecRules.has(nm)) {
            if(nms.length === 1) {
                // Only 1, skip the union
                const body = this.writeChoiceParseFnBody(nms[0], rule.definition.alternatives[0]);
                if(nm !== nms[0])
                    throw `${nm} != ${nms[0]}`;
                const fn = this.writeLeftRecRuleParseFn(nm, body);

                return fn;
            }
            const body = this.writeUnionParseBody(nm, nms);
            const fn = this.writeLeftRecRuleParseFn(nm, body);
            const choiceFns = flattenBlock(nms.map((name, i) =>
                this.writeChoiceParseFn(name, rule.definition.alternatives[i])));

            return [...fn, ...choiceFns];
        }
        if(rule.definition.alternatives.length <= 1)
            return this.writeChoiceParseFn(nm, rule.definition.alternatives[0], this.enableMemos);
        const union = this.writeUnionParseFn(nm, nms, this.enableMemos);
        const choiceFns = flattenBlock(
            nms.map((name, i) => this.writeChoiceParseFn(name, rule.definition.alternatives[i])));
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

    public writeAllRuleParseFns(): Block {
        const rules = this.getExpandedRules();
        const fns: Block = [];
        for (const rule of rules)
            fns.push(...this.writeRuleParseFns(rule));
        const S: string = rules[0].name;
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

    public writeParseResultClass(): Block {
        const startname = this.model.rules[0].name;
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
            const err = checker.Check(this.model, this.input);
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
            ruleClasses: this.writeRuleClasses(),
            ruleParseFns: this.writeAllRuleParseFns(),
            parseResult: this.writeParseResultClass(),
            usesEOF: this.usesEOFInModel(),
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
