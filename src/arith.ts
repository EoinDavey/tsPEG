// Arithmetic parser example

enum TokenKind {
    EndMarker = 'ENDMARKER',
    String = 'STRING'
}

interface TokBase {
    kind : TokenKind;
}

interface TokEndIntf {
    kind: TokenKind.EndMarker;
}

const TokEnd : TokEndIntf = {kind: TokenKind.EndMarker};

class TokString implements TokBase {
    kind : TokenKind = TokenKind.String;
    val : string;
    constructor(val : string){
        this.val = val;
    }
}

type Token = TokEndIntf | TokString;

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

    get_token() : Token {
        const token = this.peek_token();
        this.pos += 1;
        return token;
    }

    peek_token() : Token {
        if(this.pos < this.input.length)
            return new TokString(this.input[this.pos]);
        return TokEnd;
    }
}

enum ASTKinds {
    Int
}

interface ASTNode {
    kind: ASTKinds;
}

class Int implements ASTNode {
    kind: ASTKinds.Int = ASTKinds.Int;
    val : string[];
    constructor(val : string[]) {
        this.val = val;
    }
}

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

    acceptTok(exp : string) : Token | null {
        const tok = this.lex.peek_token();
        if(tok.kind === TokenKind.String && tok.val === exp)
            return this.lex.get_token();
        return null;
    }

    acceptRange(rng : string) : string | null {
        for(let c of rng){
            let tst = this.acceptTok(c);
            if(tst && tst.kind === TokenKind.String)
                return tst.val;
        }
        return null;
    }

    accept(exp : string) : string | null {
        const mrk = this.mark();
        let fail = false;
        for(let c of exp) {
            if(!this.acceptTok(c)) {
                fail = true;
                break;
            }
        }
        if(fail){
            this.reset(mrk);
            return null;
        }
        return exp;
    }

    matchInt() : Int | null {
        const mrk = this.mark();
        let res : string[] = [];
        for(;;){
            const dig = this.acceptRange("0123456789");
            if(!dig)
                break;
            res.push(dig);
        }
        if(res.length > 0){
            return new Int(res);
        }
        this.reset(mrk);
        return null;
    }

    w() : null {
        for(;;) {
            const tst = this.acceptRange(' \n');
            if(!tst)
                break;
        }
        return null;
    }

    /* EXPR ::= SUM
     * SUM ::= FAC (['+', '-'] w FAC)*;
     * FAC ::= ATOM (['*', '/'] w ATOM)*;
     * ATOM ::= INT | '(' w? EXPR w? ')';
     * INT ::= val=[0-9]+;
     */
}
