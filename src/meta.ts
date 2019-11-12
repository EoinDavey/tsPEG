// Meta-Grammar parser

/* 
 * RULES   := {_ rule=RULE '\s*;\s*'}*;
 * RULE    := _ name=NAME '\s*:=\s*' alts=ALTS _;
 * ALTS    := _ head=ALT tail={'\s*\|\s*' rule=ALT}*;
 * ALT     := ITEM+;
 * ITEM    := _ item=MOD '\s+' 
 *            | _ name=NAME '=' item=MOD '\s+';
 * MOD     := rule=RULEREF op='\+|\*';
 * RULEREF := STRLIT
 *            | nm=NAME
 *            | '{' alts=ALTS '}';
 * NAME    := '[a-zA-Z_]+';
 * STRLIT  := '\'([^\'\\]|(\\.))*\'';
 * _       := '\s*';
 */

type Nullable<T> = T | null;

type $$RuleType<T> = (log? : (msg : string) => void) => Nullable<T>;

interface Visitable {
    accept<T>(visitor : Visitor<T>) : T;
}

export interface ContextRecorder {
    record(kind: ASTKinds, pos: number, result: Nullable<ASTNode>, extraInfo : string[]) : void;
}

interface ASTNodeIntf {
    kind: ASTKinds;
}

export enum ASTKinds {
    StrMatch = 0,
    Rules, Rules$1, Rules$1$eq,
    Rule,
    Alts, Alts$1,
    Alt,
    Item, Item_1, Item_2,
    Mod,
    Ruleref_1, Ruleref_2, Ruleref_3,
    Strlit,
    Name,
    _,
}

export type ASTNode = StrMatch | Rules | Rules$1 | Rule | Alts | Alts$1 | Alt | Item | Mod | Ruleref | Strlit | Name | _;

export class StrMatch implements ASTNodeIntf {
    kind: ASTKinds.StrMatch = ASTKinds.StrMatch;
    match : string;
    constructor(val : string){
        this.match = val;
    }
}

type Rules = Rules$1$eq;

export class Rules$1$eq extends Array implements ASTNodeIntf {
    kind : ASTKinds.Rules$1$eq = ASTKinds.Rules$1$eq;
}

export class Rules$1 implements ASTNodeIntf {
    kind: ASTKinds.Rules$1 = ASTKinds.Rules$1;
    rule : Rule;
    constructor(rule : Rule){
        this.rule = rule;
    }
}
export class Rule implements ASTNodeIntf {
    kind: ASTKinds.Rule = ASTKinds.Rule;
    name : Name;
    alts : Alts;
    constructor(name : Name, alts : Alts){
        this.name = name;
        this.alts = alts;
    }
}
export class Alts implements ASTNodeIntf {
    kind: ASTKinds.Alts = ASTKinds.Alts;
    head : Alt;
    tail : Alts$1[];
    constructor(head : Alt, tail : Alts$1[]){
        this.head = head;
        this.tail = tail;
    }
}
export class Alts$1 implements ASTNodeIntf {
    kind : ASTKinds.Alts$1 = ASTKinds.Alts$1;
    rule : Alt;
    constructor(rule : Alt){
        this.rule = rule;
    }
}
type Alt = Item[];
type Item = Item_1 | Item_2;
export class Item_1 implements ASTNodeIntf {
    kind: ASTKinds.Item_1 = ASTKinds.Item_1;
    item : Mod;
    constructor(item : Mod){
        this.item = item;
    }
}
export class Item_2 implements ASTNodeIntf {
    kind: ASTKinds.Item_2 = ASTKinds.Item_2;
    name : Name;
    item : Mod;
    constructor(name : Name, item : Mod){
        this.name = name;
        this.item = item;
    }
}
export class Mod implements ASTNodeIntf {
    kind: ASTKinds.Mod = ASTKinds.Mod;
    rule : Ruleref;
    op : StrMatch;
    constructor(rule : Ruleref, op : StrMatch){
        this.rule = rule;
        this.op = op;
    }
}
type Ruleref = Ruleref_1 | Ruleref_2 | Ruleref_3;
type Ruleref_1 = Strlit
export class Ruleref_2 implements ASTNodeIntf {
    kind: ASTKinds.Ruleref_2 = ASTKinds.Ruleref_2;
    name : Name;
    constructor(name : Name){
        this.name = name;
    }
}
export class Ruleref_3 implements ASTNodeIntf {
    kind: ASTKinds.Ruleref_3 = ASTKinds.Ruleref_3;
    alts : Alts;
    constructor(alts : Alts){
        this.alts = alts;
    }
}
type Name = StrMatch;
type Strlit = StrMatch;
type _ = StrMatch;

export class Parser {
    private pos : number = 0;
    readonly input : string;
    constructor(input : string) {
        this.input = input;
    }

    private mark() : number {
        return this.pos;
    }

    reset(pos : number) {
        this.pos = pos;
    }

    finished() : boolean {
        return this.pos == this.input.length;
    }

    private loop<T>(func : $$RuleType<T>, star : boolean = false) : $$RuleType<T[]> {
        return ()=> {
            const mrk = this.mark();
            let res : T[] = [];
            for(;;) {
                const t = func();
                if(!t)
                    break;
                res.push(t);
            }
            if(star || res.length > 0)
                return res;
            this.reset(mrk);
            return null;
        };
    }

    private runner<T extends ASTNode>(kind: ASTKinds, fn : $$RuleType<T>,
        cr? : ContextRecorder) : $$RuleType<T> {
        return () => {
            const mrk = this.mark();
            const res = cr ? (()=>{
                let extraInfo : string[] = [];
                const res = fn((msg : string) => extraInfo.push(msg));
                cr.record(kind, mrk, res, extraInfo);
                return res;
            })() : fn();
            if(res)
                return res;
            this.reset(mrk);
            return null
        }
    }

    private choice<T>(fns : $$RuleType<T>[]) : Nullable<T> {
        for(let f of fns){
            const res = f();
            if(res)
                return res;
        }
        return null;
    }

    private regexAccept(match : string, cr? : ContextRecorder) : Nullable<StrMatch> {
        return this.runner<StrMatch>(ASTKinds.StrMatch,
            (log) => {
                if(log)
                    log(match);
                var reg = new RegExp(match, 'y');
                reg.lastIndex = this.mark();
                const res = reg.exec(this.input);
                if(res){
                    this.pos = reg.lastIndex;
                    return new StrMatch(res[0]);
                }
                return null;
            }, cr)();
    }

    match_(cr? : ContextRecorder) : Nullable<_> {
        return this.choice<_>([this.runner<_>(ASTKinds._,
            () => {
                return this.regexAccept(String.raw`\s*`, cr);
            },
            cr),
        ]);
    }

    matchName(cr? : ContextRecorder) : Nullable<Name> {
        return this.choice<Name>([this.runner<Name>(ASTKinds.Name,
            () => {
                return this.regexAccept(String.raw`[a-zA-Z_]+`, cr);
            },
            cr),
        ]);
    }

    matchStrlit(cr? : ContextRecorder) : Nullable<Strlit> {
        return this.runner<Name>(ASTKinds.Strlit,
            () => {
                return this.regexAccept(String.raw`\'([^\'\\]|(\\.))*\'`, cr);
            },
            cr)();
    }

    matchRuleref(cr? : ContextRecorder) : Nullable<Ruleref> {
        return this.choice<Ruleref>(
            [this.runner(ASTKinds.Ruleref_1,
                () => {
                    return this.matchStrlit(cr);
                },
                cr),
            this.runner(ASTKinds.Ruleref_2,
                () => {
                    let name : Nullable<Name> = null;
                    let res : Nullable<Ruleref_2> = null;
                    if((name = this.matchName(cr)))
                        res = new Ruleref_2(name);
                    return res;
                },
                cr),
            ]);
    }

    matchMod(cr? : ContextRecorder) {
        return this.runner<Mod>(ASTKinds.Mod,
            ()=> {
                let rule : Nullable<Ruleref> = null;
                let op : Nullable<StrMatch> = null;
                let res : Nullable<Mod> = null;
                if((rule = this.matchRuleref(cr))
                    && (op = this.regexAccept(String.raw`\+|\*`, cr)))
                    res = new Mod(rule, op);
                return res;
            },
            cr)();
    }

    matchItem(cr? : ContextRecorder) {
        return this.choice<Item>(
            [this.runner(ASTKinds.Item_1,
            () => {
                let item : Nullable<Mod> = null;
                let res : Nullable<Item_1> = null;
                if(this.match_(cr)
                    && (item = this.matchMod(cr))
                    && (this.regexAccept(String.raw`\s+`, cr)))
                    res = new Item_1(item);
                return res;
            }, cr),
            this.runner(ASTKinds.Item_2,
            () => {
                let name : Nullable<Name> = null;
                let item : Nullable<Mod> = null;
                let res : Nullable<Item_2> = null;
                if(this.match_(cr)
                    && (name = this.matchName(cr))
                    && this.regexAccept(String.raw`=`, cr)
                    && (item = this.matchMod(cr))
                    && this.regexAccept(String.raw`\s+`))
                    res = new Item_2(name, item);
                return res;
            }, cr),
            ]);
    }

    matchAlt(cr? : ContextRecorder) : Nullable<Alt> {
        return this.choice([this.loop<Item>(
            this.runner(ASTKinds.Item, () => {
                return this.matchItem();
            },
            cr), false)]);
    }

    matchAlts$1(cr? : ContextRecorder) : Nullable<Alts$1> {
        return this.choice([
            this.runner<Alts$1>(ASTKinds.Alts$1,
                () => {
                    let rule : Nullable<Alt> = null;
                    let res : Nullable<Alts$1> = null;
                    if(this.regexAccept(String.raw`\s*\|\s*`, cr)
                        && (rule = this.matchAlt()))
                        res = new Alts$1(rule);
                    return res;
                },
                cr),
        ]);
    }

    matchAlts(cr? : ContextRecorder) : Nullable<Alts> {
        return this.choice([
            this.runner<Alts>(ASTKinds.Alts,
                () => {
                    let head : Nullable<Alt> = null;
                    let tail : Nullable<Alts$1[]> = null;
                    let res : Nullable<Alts> = null;
                    if(this.match_()
                        && (head = this.matchAlt())
                        && (tail = this.loop<Alts$1>(
                            () => {
                                return this.matchAlts$1(cr);
                            },
                            true)()))
                        res = new Alts(head, tail)
                    return res;
                },
                cr),
        ]);
    }

    matchRule(cr? : ContextRecorder) : Nullable<Rule> {
        return this.choice<Rule>([
            this.runner<Rule>(ASTKinds.Rule,
                () => {
                    let name : Nullable<Name> = null;
                    let alts : Nullable<Alts> = null;
                    let res : Nullable<Rule> = null;
                    if(this.match_(cr)
                        && (name = this.matchName(cr))
                        && this.regexAccept(String.raw`\s*:=\s*`, cr)
                        && (alts = this.matchAlts(cr))
                        && this.match_(cr))
                        res = new Rule(name, alts);
                    return res;
                },
                cr),
        ]);
    }

    matchRules$1(cr? : ContextRecorder) : Nullable<Rules$1> {
        return this.choice<Rules$1>([
            this.runner<Rules$1>(ASTKinds.Rules$1,
                () => {
                    let rule : Nullable<Rule> = null;
                    let res : Nullable<Rules$1> = null;
                    if(this.match_(cr)
                        && (rule = this.matchRule(cr))
                        && this.regexAccept(String.raw`\s*;\s*`, cr))
                        res = new Rules$1(rule);
                    return res;
                },
                cr),
        ]);
    }

    matchRules(cr? : ContextRecorder) : Nullable<Rules> {
        return this.choice<Rules>([
            this.runner<Rules>(ASTKinds.Rules,
            () => {
                let rules : Nullable<Rules$1[]> = null;
                let res : Nullable<Rules> = null;
                if((rules = this.loop<Rules$1>(
                    () => {
                        return this.matchRules$1(cr);
                    },
                    false)())){
                    res = Rules$1$eq.from(rules) as Rules$1$eq;
                }
                return res;
            }, cr),
        ]);
    }

    parse() : ParseResult {
        const mrk = this.mark();
        const res = this.matchRules();
        if(res && this.finished())
            return new ParseResult(res, null);
        this.reset(mrk);
        const rec = new ErrorTracker();
        this.matchRules(rec);
        return new ParseResult(res, rec.getErr());
    }
}

export interface Visitor<T> {
}

export class ParseResult {
    ast : Nullable<ASTNode>;
    err : Nullable<SyntaxErr>;
    constructor(ast : Nullable<ASTNode>, err : Nullable<SyntaxErr>){
        this.ast = ast;
        this.err = err;
    }
}

export class SyntaxErr {
    pos : number;
    exp : string[];
    constructor(pos : number, exp : string[]){
        this.pos = pos;
        this.exp = exp;
    }

    toString() : string {
        return `Syntax Error at position ${this.pos}, expected one of ${this.exp.map(x => ` '${x}'`)}`;
    }
}

class ErrorTracker implements ContextRecorder {
    mxd : number | undefined;
    pmatches: string[] = [];

    record(kind: ASTKinds, pos : number, result : Nullable<ASTNode>, extraInfo : string[]){
        if(kind === ASTKinds.StrMatch && result === null) {
            if(this.mxd && this.mxd > pos)
                return;
            if(!this.mxd || this.mxd < pos){
                this.mxd = pos;
                this.pmatches = [];
            }
            this.pmatches.push(...extraInfo);
        }
    }

    getErr() : SyntaxErr | null {
        if(this.mxd)
            return new SyntaxErr(this.mxd, this.pmatches);
        return null;
    }
}
