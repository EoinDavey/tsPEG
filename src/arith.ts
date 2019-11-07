// Arithmetic parser example

namespace Tokens {
    export enum TokenKind {
        EndMarker = 'ENDMARKER',
        String = 'STRING'
    }

    interface TokBase {
        kind : TokenKind;
    }

    interface TokEndIntf {
        kind: TokenKind.EndMarker;
    }

    export const TokEnd : TokEndIntf = {kind: TokenKind.EndMarker};

    export class TokString implements TokBase {
        kind : TokenKind = TokenKind.String;
        val : string;
        constructor(val : string){
            this.val = val;
        }
    }

    export type Token = TokEndIntf | TokString;
}

class Lexer {
    pos : number = 0;
    readonly input : string;

    constructor(input : string){
        this.input = input;
    }

    mark() : number {
        return this.pos;
    }

    reset(pos : number) {
        this.pos = pos;
    }

    finished() : boolean {
        return this.pos == this.input.length;
    }

    get_token() : Tokens.Token {
        const token = this.peek_token();
        this.pos += 1;
        return token;
    }

    peek_token() : Tokens.Token {
        if(this.pos < this.input.length)
            return new Tokens.TokString(this.input[this.pos]);
        return Tokens.TokEnd;
    }
}

type Nullable<T> = T | null;

interface Visitor<T> {
    visitInt(i : Int) : T;
    visitSum(sum : Sum) : T;
    visitAtom_1(at : Atom_1) : T;
    visitAtom_2(at : Atom_2) : T;
    visitFac(fac : Fac) : T;
}

interface Visitable {
    accept<T>(visitor : Visitor<T>) : T;
}

interface ASTNode {
    kind: ASTKinds;
}

enum ASTKinds {
    Int,
    Atom_1, Atom_2,
    Fac, Fac$1, Fac$1$1,
    Sum, Sum$1, Sum$1$1,
}

class Int implements ASTNode, Visitable {
    kind: ASTKinds.Int = ASTKinds.Int;
    val : string[];
    constructor(val : string[]) {
        this.val = val;
    }
    accept<T>(visitor : Visitor<T>) : T {
        return visitor.visitInt(this);
    }
}

class Atom_1 implements ASTNode, Visitable {
    kind: ASTKinds.Atom_1 = ASTKinds.Atom_1;
    val : Int;
    constructor(val : Int) {
        this.val = val;
    }
    accept<T>(visitor : Visitor<T>) : T {
        return visitor.visitAtom_1(this);
    }
}

class Atom_2 implements ASTNode, Visitable {
    kind: ASTKinds.Atom_2 = ASTKinds.Atom_2;
    val : Sum;
    constructor(val : Sum) {
        this.val = val;
    }
    accept<T>(visitor : Visitor<T>) : T {
        return visitor.visitAtom_2(this);
    }
}

type Atom = Atom_1 | Atom_2

class Fac implements ASTNode, Visitable {
    kind: ASTKinds.Fac = ASTKinds.Fac;
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

class Fac$1 implements ASTNode {
    kind: ASTKinds.Fac$1 = ASTKinds.Fac$1;
    op: Fac$1$1;
    at: Atom;
    constructor(op : Fac$1$1, at : Atom){
        this.op = op;
        this.at = at;
    }
}

type Fac$1$1 = '*' | '/';

class Sum implements ASTNode, Visitable {
    kind: ASTKinds.Sum = ASTKinds.Sum;
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

class Sum$1 implements ASTNode {
    kind: ASTKinds.Sum$1 = ASTKinds.Sum$1;
    op: Sum$1$1;
    sm: Fac;
    constructor(op : Sum$1$1, sm : Fac){
        this.op = op;
        this.sm = sm;
    }
}

type Sum$1$1 = '+' | '-';

class Parser {
    lex : Lexer;
    constructor(input : string) {
        this.lex = new Lexer(input);
    }

    mark() : number {
        return this.lex.mark();
    }

    reset(pos : number) {
        this.lex.reset(pos);
    }

    finished() : boolean {
        return this.lex.finished();
    }

    acceptTok(exp : string) : Nullable<Tokens.Token> {
        const tok = this.lex.peek_token();
        if(tok.kind === Tokens.TokenKind.String && tok.val === exp)
            return this.lex.get_token();
        return null;
    }

    acceptRange(rng : string[]) : Nullable<string> {
        for(let c of rng){
            let tst = this.accept(c);
            if(tst)
                return tst;
        }
        return null;
    }

    accept<T extends string>(exp : T) : Nullable<T> {
        const mrk = this.mark();
        let fail = false;
        for(let c of exp) {
            if(!this.acceptTok(c)) {
                fail = true;
                break;
            }
        }
        if(!fail)
            return exp;
        this.reset(mrk);
        return null;
    }

    loop<T>(func : () => T | null, star : boolean = false) : Nullable<T[]> {
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

    matchInt() : Nullable<Int> {
        const val = this.loop<string>(() => this.acceptRange(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]));
        if(val)
            return new Int(val);
        return null;
    }

    matchAtom() : Nullable<Atom> {
        {
            const x = this.matchInt();
            if(x)
                return new Atom_1(x);
        }
        {
            const mrk = this.mark();
            let $1 : Nullable<'('>;
            let val : Nullable<Sum>;
            let $2 : Nullable<')'>;
            if(($1 = this.accept('('))
                && (val = this.matchSum())
                && ($2 = this.accept(')')))
                return new Atom_2(val);
        }
        return null;
    }

    matchFac$1$1() : Nullable<Fac$1$1> {
        {
            if(this.accept('*'))
                return '*';
        }
        {
            if(this.accept('/'))
                return '/';
        }
        return null;
    }

    matchFac$1() : Nullable<Fac$1> {
        {
            const mrk = this.mark();
            let op : Nullable<Fac$1$1>;
            let at : Nullable<Atom>;
            if((op = this.matchFac$1$1())
                && (at = this.matchAtom()))
                return new Fac$1(op, at);
            this.reset(mrk);
        }
        return null;
    }

    matchFac() : Nullable<Fac> {
        {
            const mrk = this.mark();
            let head : Nullable<Atom>;
            let tail : Nullable<Fac$1[]>;
            if((head = this.matchAtom())
                && (tail = this.loop<Fac$1>(() => this.matchFac$1(), true)))
                return new Fac(head, tail);
            this.reset(mrk);
        }
        return null;
    }

    matchSum$1$1() : Nullable<Sum$1$1> {
        {
            const mrk = this.mark();
            if(this.accept('+'))
                return '+';
            this.reset(mrk);
        }
        {
            const mrk = this.mark();
            if(this.accept('-'))
                return '-';
            this.reset(mrk);
        }
        return null;
    }

    matchSum$1() : Nullable<Sum$1> {
        {
            const mrk = this.mark();
            let op : Nullable<Sum$1$1>;
            let sm : Nullable<Fac>;
            if((op = this.matchSum$1$1())
                && (sm = this.matchFac()))
                return new Sum$1(op, sm);
            this.reset(mrk);
        }
        return null;
    }

    matchSum() : Nullable<Sum> {
        {
            const mrk = this.mark();
            let head : Nullable<Fac>;
            let tail : Nullable<Sum$1[]>;
            if((head = this.matchFac())
                && (tail = this.loop<Sum$1>(() => this.matchSum$1(), true)))
                return new Sum(head, tail);
            this.reset(mrk);
        }
        return null;
    }

    /* 
     * EXPR ::= SUM
     * SUM  ::= head=FAC tail={op={'+' | '-'} sm=FAC}*;
     * FAC  ::= head=ATOM tail={ op={'*' | '/'} at=ATOM }*;
     * ATOM ::= val=INT | '(' val=EXPR ')';
     * INT  ::= val=[0-9]+;
     */

    /* 
     * NAME    := [a-z]+
     * RULES   := { rule=RULE '\n'}*
     * RULE    := name=NAME ':=' ALTS
     * ALTS    := head=ALT tail={'|' rule=ALT}*
     * ALT     := items=ITEM+
     * ITEM    := item=MOD
     *            | name=NAME '=' item=MOD
     * MOD     := rule=RULEREF op={'*' | '+'}
     * RULEREF := '\'' str '\''
     *            | nm=NAME
     *            | '{' ALTS '}'
     */
}

class EvVis implements Visitor<number> {
    visitInt(i : Int) : number {
        let x = 0;
        for(let v of i.val)
            x = 10 * x + parseInt(v);
        return x;
    }

    visitAtom_1(at : Atom_1) : number {
        return at.val.accept(this);
    }

    visitAtom_2(at : Atom_2) : number {
        return at.val.accept(this);
    }

    visitSum(sum : Sum) : number {
        const x = sum.head.accept(this);
        return sum.tail.reduce((res, cur) : number => {
            const val = cur.sm.accept(this);
            if(cur.op === '+')
                return res + val;
            return res - val;
        }, x);
    }

    visitFac(fac : Fac) : number {
        const x = fac.head.accept(this);
        return fac.tail.reduce((res, cur) : number => {
            const val = cur.at.accept(this);
            if(cur.op === '*')
                return res * val;
            return res / val;
        }, x);
    }
}
