// Arithmetic parser example

/* 
 * SUM  ::= head=FAC tail={op='\+|-' sm=FAC}*;
 * FAC  ::= head=ATOM tail={op='\*|/' at=ATOM }*;
 * ATOM ::= val=INT | '\(' val=SUM '\)';
 * INT  ::= val='[0-9]+';
 */

type Nullable<T> = T | null;

type Rule<T> = (log? : (msg : string) => void) => Nullable<T>;

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
    StrMatch,
    Int,
    Atom_1, Atom_2,
    Fac, Fac$1,
    Sum, Sum$1, 
}

export type ASTNode = StrMatch | Int | Atom | Fac | Fac$1 | Sum | Sum$1;

export class StrMatch implements ASTNodeIntf {
    kind: ASTKinds.StrMatch = ASTKinds.StrMatch;
    match : string;
    constructor(val : string){
        this.match = val;
    }
}

export class Int implements ASTNodeIntf, Visitable {
    kind : ASTKinds.Int = ASTKinds.Int;
    val : StrMatch;
    constructor(val : StrMatch) {
        this.val = val;
    }
    accept<T>(visitor : Visitor<T>) : T {
        return visitor.visitInt(this);
    }
}

export class Atom_1 implements ASTNodeIntf, Visitable {
    kind : ASTKinds.Atom_1 = ASTKinds.Atom_1;
    val : Int;
    constructor(val : Int) {
        this.val = val;
    }
    accept<T>(visitor : Visitor<T>) : T {
        return visitor.visitAtom_1(this);
    }
}

export class Atom_2 implements ASTNodeIntf, Visitable {
    kind : ASTKinds.Atom_2 = ASTKinds.Atom_2;
    val : Sum;
    constructor(val : Sum) {
        this.val = val;
    }
    accept<T>(visitor : Visitor<T>) : T {
        return visitor.visitAtom_2(this);
    }
}

export type Atom = Atom_1 | Atom_2

export class Fac implements ASTNodeIntf, Visitable {
    kind : ASTKinds.Fac = ASTKinds.Fac;
    head : Atom;
    tail : Fac$1[];
    constructor(head : Atom, tail : Fac$1[]){
        this.head = head;
        this.tail = tail;
    }
    accept<T>(visitor : Visitor<T>) : T {
        return visitor.visitFac(this);
    }
}

export class Fac$1 implements ASTNodeIntf {
    kind : ASTKinds.Fac$1 = ASTKinds.Fac$1;
    op: StrMatch;
    at: Atom;
    constructor(op : StrMatch, at : Atom){
        this.op = op;
        this.at = at;
    }
}

export class Sum implements ASTNodeIntf, Visitable {
    kind : ASTKinds.Sum = ASTKinds.Sum;
    head : Fac;
    tail : Sum$1[];
    constructor(head : Fac, tail :Sum$1[]){
        this.head = head;
        this.tail = tail;
    }
    accept<T>(visitor : Visitor<T>) : T {
        return visitor.visitSum(this);
    }
}

export class Sum$1 implements ASTNodeIntf {
    kind : ASTKinds.Sum$1 = ASTKinds.Sum$1;
    op: StrMatch;
    sm: Fac;
    constructor(op : StrMatch, sm : Fac){
        this.op = op;
        this.sm = sm;
    }
}

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

    private loop<T>(func : Rule<T>, star : boolean = false) : Nullable<T[]> {
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
    }

    private runner<T extends ASTNode>(kind: ASTKinds, fn : Rule<T>,
        cr? : ContextRecorder) : Rule<T> {
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

    private choice<T>(fns : Rule<T>[]) : Nullable<T> {
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

    parse() : ParseResult {
        const mrk = this.mark();
        const res = this.matchSum();
        if(res && this.finished())
            return new ParseResult(res, null);
        this.reset(mrk);
        const rec = new ErrorTracker();
        this.matchSum(rec);
        return new ParseResult(res, rec.getErr());
    }

    matchInt(cr? : ContextRecorder) : Nullable<Int> {
        return this.runner<Int>(
            ASTKinds.Int,
            ()=> {
                let val : Nullable<StrMatch> = null;
                let res : Nullable<Int> = null;
                if((val = this.regexAccept(String.raw`[0-9]+`, cr)))
                    res = new Int(val);
                return res;
            },
            cr)();
    }

    matchAtom(cr? : ContextRecorder) : Nullable<Atom> {
        return this.choice<Atom>(
            [this.runner(ASTKinds.Atom_1, () => {
                let x : Nullable<Int>;
                let res : Nullable<Atom> = null;
                if((x = this.matchInt(cr)))
                    res = new Atom_1(x);
                return res;
            }, cr),
            this.runner(ASTKinds.Atom_2, () => {
                let $1 : Nullable<StrMatch>;
                let val : Nullable<Sum>;
                let $2 : Nullable<StrMatch>;
                let res : Nullable<Atom> = null;
                if(($1 = this.regexAccept(String.raw`\(`, cr))
                    && (val = this.matchSum(cr))
                    && ($2 = this.regexAccept(String.raw`\)`, cr)))
                    res = new Atom_2(val);
                return res;
            }, cr)]);
    }

    matchFac$1(cr? : ContextRecorder) : Nullable<Fac$1> {
        return this.runner<Fac$1>(ASTKinds.Fac$1,
            () => {
                let op : Nullable<StrMatch>;
                let at : Nullable<Atom>;
                let res : Nullable<Fac$1> = null;
                if((op = this.regexAccept(String.raw`\*|/`, cr))
                    && (at = this.matchAtom(cr)))
                    res = new Fac$1(op, at);
                return res;
            },
            cr)();
    }

    matchFac(cr? : ContextRecorder) : Nullable<Fac> {
        return this.runner<Fac>(ASTKinds.Fac,
            () => {
                let head : Nullable<Atom>;
                let tail : Nullable<Fac$1[]>;
                let res : Nullable<Fac> = null;
                if((head = this.matchAtom(cr))
                    && (tail = this.loop<Fac$1>(() => this.matchFac$1(cr), true)))
                    res = new Fac(head, tail);
                return res;
            },
            cr)();
    }

    matchSum$1(cr? : ContextRecorder) : Nullable<Sum$1> {
        return this.runner<Sum$1>(ASTKinds.Sum$1,
            () => {
                let op : Nullable<StrMatch>;
                let sm : Nullable<Fac>;
                let res : Nullable<Sum$1> = null;
                if((op = this.regexAccept(String.raw`\+|-`, cr))
                    && (sm = this.matchFac(cr)))
                    res = new Sum$1(op, sm);
                return res;
            },
            cr)();
    }

    matchSum(cr? : ContextRecorder) : Nullable<Sum> {
        return this.runner<Sum>(ASTKinds.Sum,
            () => {
                let head : Nullable<Fac>;
                let tail : Nullable<Sum$1[]>;
                let res : Nullable<Sum> = null;
                if((head = this.matchFac(cr))
                    && (tail = this.loop<Sum$1>(() => this.matchSum$1(cr), true)))
                    res = new Sum(head, tail);
                return res;
            }, 
            cr)();
    }
}

export interface Visitor<T> {
    visitInt(i : Int) : T;
    visitSum(sum : Sum) : T;
    visitAtom_1(at : Atom_1) : T;
    visitAtom_2(at : Atom_2) : T;
    visitFac(fac : Fac) : T;
}

export class ParseResult {
    ast : Nullable<Visitable>;
    err : Nullable<SyntaxErr>;
    constructor(ast : Nullable<Visitable>, err : Nullable<SyntaxErr>){
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
