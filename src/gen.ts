import { Parser, Visitor, ASTKinds, ASTNode, GRAM, RULEDEF, RULE, ALT, MATCHSPEC, ATOM, NAME, STRLIT } from './meta';

export const STR = String.raw`GRAM      := head=RULEDEF tail=GRAM
           | def=RULEDEF;
RULEDEF   := _ name=NAME '\s*:=\s*' rule=RULE '\s*;\s*';
RULE      := head=ALT '\s*\|\s*' tail=RULE
           | alt=ALT;
ALT       := head=MATCHSPEC _ tail=ALT
           | mtch=MATCHSPEC;
MATCHSPEC := name=NAME '=' rule=ATOM
           | rule=ATOM;
ATOM      := name=NAME
           | match=STRLIT;
NAME      := val='[a-zA-Z_]+';
STRLIT    := '\'' val='([^\'\\]|(\\.))*' '\'';
_         := '\s*';`;

export function compressAST<T, K>(st : T, gt : (x : T) => K, next : (x : T) => T) : K[] {
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

export function compressGRAM(st : GRAM) : RULEDEF[] {
    return compressAST(st,
        x => x.kind === ASTKinds.GRAM_1 ? x.head : x.def,
        x => x.kind === ASTKinds.GRAM_1 ? x.tail : x);
}

export function compressRULE(st : RULE) : ALT[] {
    return compressAST(st,
        x => x.kind === ASTKinds.RULE_1 ? x.head : x.alt,
        x => x.kind === ASTKinds.RULE_1 ? x.tail : x);
}

export function compressALT(st : ALT) : MATCHSPEC[] {
    return compressAST(st,
        x => x.kind === ASTKinds.ALT_1 ? x.head : x.mtch,
        x => x.kind === ASTKinds.ALT_1 ? x.tail : x);
}

export type Alt = MATCHSPEC[];
export type Rule = Alt[];
export type Grammar = Ruledef[];

export class Ruledef {
    name : string;
    rule : Rule;
    constructor(rd : RULEDEF) {
        this.name = rd.name.val.match;
        this.rule = compressRULE(rd.rule).map(compressALT);
    }
}

export function AST2Gram(g : GRAM) : Grammar {
    return compressGRAM(g).map(def => new Ruledef(def));
}

export function writeKinds(gram : Grammar) : string {
    let astKinds = ["$$StrMatch"];
    for(let ruledef of gram) {
        const nm = ruledef.name;
        for(let i = 0; i < ruledef.rule.length; i++) {
            const alt = ruledef.rule[i];
            const md = ruledef.rule.length == 1 ? "" : `_${i+1}`;
            astKinds.push(nm+md);
        }
    }
    const kinds = `export enum ASTKinds {
${astKinds.map(x=>'  '+x).join(',\n')}
}`;
    return kinds;
}

export function writeChoice(name : string, alt : Alt) : string {
    let namedTypes : [string, string][] = [];
    for(let match of alt) {
        if(match.kind === ASTKinds.MATCHSPEC_1){
            const at = match.rule;
            namedTypes.push([match.name.val.match, at.kind === ASTKinds.ATOM_1 ? at.name.val.match : '$$StrMatch']);
        }
    }
    return `export class ${name} implements ASTNodeIntf {
    kind : ASTKinds.${name} = ASTKinds.${name};
${namedTypes.map(x => `    ${x[0]} : ${x[1]};`).join('\n')}
    constructor(${namedTypes.map(x => `${x[0]} : ${x[1]}`).join(',')}){
${namedTypes.map(x => `        this.${x[0]} = ${x[0]};`).join('\n')}
    }
}`;
}

export function writeRuleClass(ruledef : Ruledef) : string {
    const nm = ruledef.name;
    let union : string[] = [];
    let choices : string[] = [];
    for(let i = 0; i < ruledef.rule.length; i++) {
        const md = nm + (ruledef.rule.length == 1 ? "" : `_${i+1}`);
        choices.push(writeChoice(md, ruledef.rule[i]));
        union.push(md);
    }
    let typedef = ruledef.rule.length > 1 ? `export type ${nm} = ${union.join(' | ')};` : '';
    return [typedef, ...choices].join('\n');
}

export function writeRuleClasses(gram : Grammar) : string {
    let types : string[] = [];
    let rules : string[] = [];
    for(let ruledef of gram) {
        types.push(ruledef.name);
        rules.push(writeRuleClass(ruledef));
    }
    return `export type ASTNode = $$StrMatch | ${types.join(' | ')};
${rules.join('\n')}
`;
}

export function writeParseIfStmt(alt : Alt) : string {
    let checks : string[] = [];
    for(let match of alt) {
        const at = match.rule;
        const rn = at.kind === ASTKinds.ATOM_1 ?
            `this.match${at.name.val.match}(cr)` : `this.regexAccept(String.raw\`${at.match.val.match}\`, cr)`;
        if(match.kind === ASTKinds.MATCHSPEC_1)
            checks.push(`\t\t&& (${match.name.val.match} = ${rn})`);
        else
            checks.push(`\t\t&& ${rn}`);
    }
    return checks.join('\n');
}

export function writeChoiceParseFn(name : string, alt : Alt) : string {
    let namedTypes : [string, string][] = [];
    let unnamedTypes : string[] = [];
    for(let match of alt) {
        const at = match.rule;
        const rn = at.kind === ASTKinds.ATOM_1 ? at.name.val.match : '$$StrMatch';
        if(match.kind === ASTKinds.MATCHSPEC_1){
            namedTypes.push([match.name.val.match, rn]);
        } else {
            unnamedTypes.push(rn);
        }
    }
    return `match${name}(cr? : ContextRecorder) : Nullable<${name}> {
    return this.runner<${name}>(
        () => {
${namedTypes.map(x => `            let ${x[0]} : Nullable<${x[1]}>;`).join('\n')}
            let res : Nullable<${name}> = null;
            if(true
${writeParseIfStmt(alt)}
            )
                res = new ${name}(${namedTypes.map(x => x[0]).join(', ')});
            return res;
        },
        cr)();
}`;
}

export function writeRuleParseFn(ruledef : Ruledef) : string {
    const nm = ruledef.name;
    let choices : string[] = [];
    let nms : string[] = [];
    for(let i = 0; i < ruledef.rule.length; i++) {
        const md = nm + (ruledef.rule.length == 1 ? "" : `_${i+1}`);
        nms.push(md);
        choices.push(writeChoiceParseFn(md, ruledef.rule[i]));
    }
    const union = choices.length <= 1 ? ''
        : `match${nm}(cr? : ContextRecorder) : Nullable<${nm}> {
        return this.choice<${nm}>([
${nms.map(x => `\t\t() => { return this.match${x}(cr) }`).join(',\n')}
        ]);
}
`;
    return union + choices.join('\n');
}

export function writeRuleParseFns(gram : Grammar) : string {
    let fns : string[] = [];
    for(let ruledef of gram) {
        fns.push(writeRuleParseFn(ruledef));
    }
    const S : string = gram[0].name;
    return fns.join('\n') + `
    parse() : ParseResult {
        const mrk = this.mark();
        const res = this.match${S}();
        if(res && this.finished())
            return new ParseResult(res, null);
        this.reset(mrk);
        const rec = new ErrorTracker();
        this.match${S}(rec);
        return new ParseResult(res, rec.getErr());
    }`;
}

export function test(s : string) {
    const p = new Parser(s);
    const res = p.parse();
    if(res.err)
        throw res.err;
    if(res.ast){
        const gram = AST2Gram(res.ast);
        //console.log([writeKinds(gram), writeRuleClasses(gram)].join('\n'));
        console.log(writeRuleParseFns(gram));
    }
}
