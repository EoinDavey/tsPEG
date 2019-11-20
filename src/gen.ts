import { Parser, ASTKinds, GRAM, RULEXPR, RULEDEF, RULE, ALT, MATCHSPEC, ATOM, STRLIT } from './meta';

import { expandTemplate } from './template';

import { Block, indentBlock, writeBlock } from './util';

function compressAST<T, K>(st : T, gt : (x : T) => K, next : (x : T) => T) : K[] {
    let v : T  = st;
    let ls : K[] = [];
    while(true) {
        ls.push(gt(v));
        if(v === next(v))
            break;
        v = next(v);
    }
    return ls;
}

function compressRULE(st : RULE) : ALT[] {
    return compressAST(st,
        x => x.kind === ASTKinds.RULE_1 ? x.head : x.alt,
        x => x.kind === ASTKinds.RULE_1 ? x.tail : x);
}

type Alt = MATCHSPEC[];
type Rule = Alt[];
type Grammar = Ruledef[];
class Ruledef {
    name : string;
    rule : Rule;
    constructor(rd : RULEDEF) {
        this.name = rd.name.match;
        this.rule = compressRULE(rd.rule);
    }
}

function AST2Gram(g : GRAM) : Grammar {
    return g.map(def => new Ruledef(def));
}

function exprType(expr : RULEXPR) : string {
    if(expr.kind === ASTKinds.RULEXPR_1)
        return `${atomType(expr.at)}[]`;
    return atomType(expr);
}

function exprRule(expr : RULEXPR) : string {
    if(expr.kind === ASTKinds.RULEXPR_1)
        return `this.loop<${atomType(expr.at)}>(()=> ${atomRule(expr.at)}, ${expr.op.match === '+' ? 'false' : 'true'})`;
    return atomRule(expr);
}

function atomRule(at : ATOM) : string {
    if(at.kind === ASTKinds.ATOM_1)
        return `this.match${at.name.match}($$dpth + 1, cr)`;
    return `this.regexAccept(String.raw\`${at.match.val.match}\`, $$dpth+1, cr)`;
}

function atomType(at : ATOM) : string {
    if(at.kind === ASTKinds.ATOM_1)
        return `${at.name.match}`;
    return '$$StrMatch';
}

function writeKinds(gram : Grammar) : Block {
    let astKinds = ["$$StrMatch"];
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

function writeChoice(name : string, alt : Alt) : Block {
    let namedTypes : [string, string][] = [];
    for(let match of alt) {
        if(match.kind === ASTKinds.MATCHSPEC_1){
            const at = match.rule;
            namedTypes.push([match.name.match, exprType(at)]);
        }
    }
    // Rules with no named matches and only one match are rule aliases
    if(namedTypes.length == 0 && alt.length == 1){
        const at = alt[0].rule;
        return [`export type ${name} = ${exprType(at)};`];
    }
    const blk : Block = [
        `export class ${name} implements ASTNodeIntf {`,
        [
            `kind : ASTKinds.${name} = ASTKinds.${name};`,
            ...namedTypes.map(x => `${x[0]} : ${x[1]};`),
            `constructor(${namedTypes.map(x => `${x[0]} : ${x[1]}`).join(',')}){`,
            namedTypes.map(x => `this.${x[0]} = ${x[0]};`),
            '}'
        ],
        '}',
    ]
    return blk;

}

function writeRuleClass(ruledef : Ruledef) : Block {
    const nm = ruledef.name;
    let union : string[] = [];
    let choices : Block = [];
    for(let i = 0; i < ruledef.rule.length; i++) {
        const md = nm + (ruledef.rule.length == 1 ? "" : `_${i+1}`);
        choices.push(...writeChoice(md, ruledef.rule[i]));
        union.push(md);
    }
    const typedef = ruledef.rule.length > 1 ? [`export type ${nm} = ${union.join(' | ')};`] : [];
    return [...typedef, ...choices];
}

function writeRuleClasses(gram : Grammar) : Block {
    let types : string[] = [];
    let rules : Block = [];
    for(let ruledef of gram) {
        types.push(ruledef.name);
        rules.push(...writeRuleClass(ruledef));
    }
    return rules;
}

function writeParseIfStmt(alt : Alt) : Block {
    let checks : string[] = [];
    for(let match of alt) {
        const expr = match.rule;
        const rn = exprRule(expr);
        if(match.kind === ASTKinds.MATCHSPEC_1)
            checks.push(`&& (${match.name.match} = ${rn})`);
        else
            checks.push(`&& ${rn}`);
    }
    return checks;
}

function writeRuleAliasFn(name : string, expr : RULEXPR) : Block {
    return [`match${name}($$dpth : number, cr? : ContextRecorder) : Nullable<${name}> {`,
        [
            `return ${exprRule(expr)};`
        ],
        '}'
    ];
}

function writeChoiceParseFn(name : string, alt : Alt) : Block {
    let namedTypes : [string, string][] = [];
    let unnamedTypes : string[] = [];
    for(let match of alt) {
        const expr = match.rule;
        const rn = exprType(expr);
        if(match.kind === ASTKinds.MATCHSPEC_1){
            namedTypes.push([match.name.match, rn]);
        } else {
            unnamedTypes.push(rn);
        }
    }
    if(namedTypes.length == 0 && alt.length == 1)
        return writeRuleAliasFn(name, alt[0].rule);
    return [
        `match${name}($$dpth : number, cr? : ContextRecorder) : Nullable<${name}> {`,
        [
            `return this.runner<${name}>($$dpth,`,
            [
                `(log) => {`,
                [
                    'if(log)',
                    [
                        `log('${name}');`
                    ],
                    ...namedTypes.map(x => `let ${x[0]} : Nullable<${x[1]}>;`),
                    `let res : Nullable<${name}> = null;`,
                    'if(true',
                    writeParseIfStmt(alt),
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

function writeRuleParseFn(ruledef : Ruledef) : Block {
    const nm = ruledef.name;
    let choices : Block = [];
    let nms : string[] = [];
    for(let i = 0; i < ruledef.rule.length; i++) {
        const md = nm + (ruledef.rule.length == 1 ? "" : `_${i+1}`);
        nms.push(md);
        choices.push(...writeChoiceParseFn(md, ruledef.rule[i]));
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

function writeRuleParseFns(gram : Grammar) : Block {
    let fns : Block = [];
    for(let ruledef of gram) {
        fns.push(...writeRuleParseFn(ruledef));
    }
    const S : string = gram[0].name;
    return [...fns,
        'parse() : ParseResult {',
        [
            'const mrk = this.mark();',
            `const res = this.match${S}(0);`,
            'if(res && this.finished())',
            '    return new ParseResult(res, null);',
            'this.reset(mrk);',
            'const rec = new ErrorTracker();',
            `this.match${S}(0, rec);`,
            'return new ParseResult(res, rec.getErr());'
        ],
        '}'
    ];
}

function writeParseResultClass(gram : Grammar) : Block {
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

export function buildParser(s : string) : string {
    const p = new Parser(s);
    const res = p.parse();
    if(res.err)
        throw res.err;
    if(!res.ast)
        throw 'No AST found';
    const gram = AST2Gram(res.ast);
    const parseBlock = expandTemplate(s, writeKinds(gram), writeRuleClasses(gram),
        writeRuleParseFns(gram), writeParseResultClass(gram));
    return writeBlock(parseBlock).join('\n');
}
