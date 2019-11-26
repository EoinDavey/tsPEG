import { Parser, ASTKinds, GRAM, POSTOP, PREOP, RULEDEF, RULE, ALT, MATCHSPEC, ATOM, STRLIT } from './meta';

import { expandTemplate } from './template';

import { Block, indentBlock, writeBlock } from './util';

function compressRULE(st : RULE) : Rule {
    return [st.head, ...st.tail.map(x => x.alt)];
}

type Alt = MATCHSPEC[];
type Rule = Alt[];
type Grammar = Ruledef[];
class Ruledef {
    name : string;
    rule : Rule;
    constructor(name : string, rule : Rule) {
        this.name = name;
        this.rule = rule;
    }
}

function getAtom(expr : POSTOP) : ATOM {
    return expr.pre.at;
}

function isOptional(expr : POSTOP) : boolean {
    return expr.op != null && expr.op === '?';
}

export class Generator {
    private subRules : Map<ATOM, string> = new Map();

    AST2Gram(g : GRAM) : Grammar {
        const gram = g.map(def => this.extractRules(compressRULE(def.rule), def.name));
        return gram.reduce((x, y) => x.concat(y));
    }

    extractRules(rule : Rule, name : string) : Ruledef[] {
        let cnt = 0;
        const rules = [new Ruledef(name, rule)];
        for(let alt of rule){
            for(let match of alt){
                const at : ATOM = getAtom(match.rule);
                if(at.kind !== ASTKinds.ATOM_3)
                    continue;
                const subrule = at.sub;
                const nm = `${name}_$${cnt}`;
                this.subRules.set(at, nm);
                const rdfs = this.extractRules(compressRULE(subrule), nm);
                rules.push(...rdfs)
                ++cnt;
            }
        }
        return rules;
    }

    preType(expr : PREOP) : string {
        if(expr.op && expr.op === '!') // Negation types return null if matched, true otherwise
            return 'Nullable<boolean>';
        return this.atomType(expr.at);
    }

    preRule(expr : PREOP) : string {
        if(expr.op && expr.op === '&')
            return `this.noConsume<${this.atomType(expr.at)}>(() => ${this.atomRule(expr.at)})`;
        if(expr.op && expr.op === '!')
            return `this.negate(() => ${this.atomRule(expr.at)})`;
        return this.atomRule(expr.at);
    }

    postType(expr : POSTOP) : string {
        if(expr.op){
            if(expr.op === '?')
                return `Nullable<${this.preType(expr.pre)}>`;
            return `${this.preType(expr.pre)}[]`;
        }
        return this.preType(expr.pre);
    }

    postRule(expr : POSTOP) : string {
        if(expr.op && expr.op !== '?')
                return `this.loop<${this.preType(expr.pre)}>(()=> ${this.preRule(expr.pre)}, ${expr.op === '+' ? 'false' : 'true'})`;
        return this.preRule(expr.pre);
    }

    atomRule(at : ATOM) : string {
        if(at.kind === ASTKinds.ATOM_1)
            return `this.match${at.name}($$dpth + 1, cr)`;
        if(at.kind === ASTKinds.ATOM_2)
            return `this.regexAccept(String.raw\`${at.match.val}\`, $$dpth+1, cr)`;
        const subname = this.subRules.get(at);
        if(subname)
            return `this.match${subname}($$dpth + 1, cr)`;
        return 'ERR';
    }

    atomType(at : ATOM) : string {
        if(at.kind === ASTKinds.ATOM_1)
            return at.name;
        if(at.kind === ASTKinds.ATOM_2)
            return 'string';
        const subname = this.subRules.get(at);
        if(subname)
            return subname;
        return 'ERR';
    }

    writeKinds(gram : Grammar) : Block {
        let astKinds = [];
        for(let ruledef of gram) {
            const nm = ruledef.name;
            for(let i = 0; i < ruledef.rule.length; i++) {
                const md = ruledef.rule.length == 1 ? '' : `_${i+1}`;
                astKinds.push(nm + md);
            }
        }
        return [
            'export enum ASTKinds {',
            astKinds.map(x => x + ','),
            '}',
        ];
    }

    writeChoice(name : string, alt : Alt) : Block {
        let namedTypes : [string, string][] = [];
        for(let match of alt) {
            if(match.named){
                const at = match.rule;
                namedTypes.push([match.named.name, this.postType(at)]);
            }
        }
        // Rules with no named matches and only one match are rule aliases
        if(namedTypes.length == 0 && alt.length == 1){
            const at = alt[0].rule;
            return [`export type ${name} = ${this.postType(at)};`];
        }
        const blk : Block = [
            `export class ${name} implements ASTNodeIntf {`,
            [
                `kind : ASTKinds.${name} = ASTKinds.${name};`,
                ...namedTypes.map(x => `${x[0]} : ${x[1]};`),
                `constructor(${namedTypes.map(x => `${x[0]} : ${x[1]}`).join(', ')}){`,
                namedTypes.map(x => `this.${x[0]} = ${x[0]};`),
                '}'
            ],
            '}',
        ]
        return blk;

    }

    writeRuleClass(ruledef : Ruledef) : Block {
        const nm = ruledef.name;
        let union : string[] = [];
        let choices : Block = [];
        for(let i = 0; i < ruledef.rule.length; i++) {
            const md = nm + (ruledef.rule.length == 1 ? "" : `_${i+1}`);
            choices.push(...this.writeChoice(md, ruledef.rule[i]));
            union.push(md);
        }
        const typedef = ruledef.rule.length > 1 ? [`export type ${nm} = ${union.join(' | ')};`] : [];
        return [...typedef, ...choices];
    }

    writeRuleClasses(gram : Grammar) : Block {
        let types : string[] = [];
        let rules : Block = [];
        for(let ruledef of gram) {
            types.push(ruledef.name);
            rules.push(...this.writeRuleClass(ruledef));
        }
        return rules;
    }

    writeParseIfStmt(alt : Alt) : Block {
        let checks : string[] = [];
        for(let match of alt) {
            const expr = match.rule;
            const rn = this.postRule(expr);
            if(match.named){
                if(isOptional(expr))
                    checks.push(`&& ((${match.named.name} = ${rn}) || true)`);
                else
                    checks.push(`&& (${match.named.name} = ${rn}) != null`);
            } else {
                if(isOptional(expr))
                    checks.push(`&& ((${rn}) || true)`);
                else
                checks.push(`&& ${rn} != null`);
            }
        }
        return checks;
    }

    writeRuleAliasFn(name : string, expr : POSTOP) : Block {
        return [`match${name}($$dpth : number, cr? : ContextRecorder) : Nullable<${name}> {`,
            [
                `return ${this.postRule(expr)};`
            ],
            '}'
        ];
    }

    writeChoiceParseFn(name : string, alt : Alt) : Block {
        let namedTypes : [string, string][] = [];
        let unnamedTypes : string[] = [];
        for(let match of alt) {
            const expr = match.rule;
            const rn = this.postType(expr);
            if(match.named){
                namedTypes.push([match.named.name, rn]);
            } else {
                unnamedTypes.push(rn);
            }
        }
        if(namedTypes.length == 0 && alt.length == 1)
            return this.writeRuleAliasFn(name, alt[0].rule);
        return [`match${name}($$dpth : number, cr? : ContextRecorder) : Nullable<${name}> {`,
            [
                `return this.runner<${name}>($$dpth,`,
                [
                    '(log) => {',
                    [
                        'if(log)',
                        [
                            `log('${name}');`
                        ],
                        ...namedTypes.map(x => `let ${x[0]} : Nullable<${x[1]}>;`),
                        `let res : Nullable<${name}> = null;`,
                        'if(true',
                        this.writeParseIfStmt(alt),
                        ')',
                        [
                            `res = new ${name}(${namedTypes.map(x => x[0]).join(', ')});`,
                        ],
                        'return res;'
                    ],
                    '}, cr)();'
                ],
            ],
            '}'
        ];
    }

    writeRuleParseFn(ruledef : Ruledef) : Block {
        const nm = ruledef.name;
        let choices : Block = [];
        let nms : string[] = [];
        for(let i = 0; i < ruledef.rule.length; i++) {
            const md = nm + (ruledef.rule.length == 1 ? "" : `_${i+1}`);
            nms.push(md);
            choices.push(...this.writeChoiceParseFn(md, ruledef.rule[i]));
        }
        const union = ruledef.rule.length <= 1 ? []
            : [`match${nm}($$dpth : number, cr? : ContextRecorder) : Nullable<${nm}> {`,
                [
                    `return this.choice<${nm}>([`,
                    nms.map(x => `() => { return this.match${x}($$dpth + 1, cr) },`),
                    `]);`
                ],
                `}`];
        return [...union, ...choices];
    }

    writeRuleParseFns(gram : Grammar) : Block {
        let fns : Block = [];
        for(let ruledef of gram) {
            fns.push(...this.writeRuleParseFn(ruledef));
        }
        const S : string = gram[0].name;
        return [...fns,
            'parse() : ParseResult {',
            [
                'const mrk = this.mark();',
                `const res = this.match${S}(0);`,
                'if(res && this.finished())',
                [
                    'return new ParseResult(res, null);'
                ],
                'this.reset(mrk);',
                'const rec = new ErrorTracker();',
                `this.match${S}(0, rec);`,
                'return new ParseResult(res, rec.getErr());'
            ],
            '}'
        ];
    }

    writeParseResultClass(gram : Grammar) : Block {
        const head = gram[0];
        const startname = head.name;
        return ['export class ParseResult {',
            [
                `ast : Nullable<${startname}>;`,
                'err : Nullable<SyntaxErr>;',
                `constructor(ast : Nullable<${startname}>, err : Nullable<SyntaxErr>){`,
                [
                    'this.ast = ast;',
                    'this.err = err;'
                ],
                '}'
            ],
            '}'
        ];
    }

    generate(s : string) : string {
        const p = new Parser(s);
        const res = p.parse();
        if(res.err)
            throw res.err;
        if(!res.ast)
            throw 'No AST found';
        const gram = this.AST2Gram(res.ast);
        const parseBlock = expandTemplate(s, this.writeKinds(gram), this.writeRuleClasses(gram),
            this.writeRuleParseFns(gram), this.writeParseResultClass(gram));
        return writeBlock(parseBlock).join('\n');
    }
}

export function buildParser(s : string) : string {
    const gen = new Generator();
    return gen.generate(s);
}
