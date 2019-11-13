// Meta-Grammar parser

/* 
 * GRAM     := RULEDEF+;
 * RULEDEF  := name=NAME '\s*:=\s*' rule=RULE '\s*;';
 * RULE     := { _ alt=ALTS '\s*\|\s*'}+;
 * ALTS     := ALT+;
 * ALT      := name=NAME '=' rule=RULEXPR ;
 *           | _ rule=RULEXPR _;
 * RULEEXPR := rule=RULEAT
 *           | rule=RULEAT op='\+|\*';
 * RULEAT   := name=RULENAME
 *           | '{\s*' rule=RULE '\s*}'
 *           | str=STRLIT;
 * NAME     := '[a-zA-Z_]+';
 * STRLIT   := '\'([^\'\\]|(\\.))*\'';
 * _        := '\s*';
 */

type Nullable<T> = T | null;

type $$RuleType<T> = (log? : (msg : string) => void) => Nullable<T>;

interface Visitable {
    accept<T>(visitor : Visitor<T>) : T;
}

export interface ContextRecorder {
    record(pos: number, result: Nullable<ASTNode>, extraInfo : string[]) : void;
}

interface ASTNodeIntf {
    kind: ASTKinds;
}

export enum ASTKinds {
    StrMatch,
}

export type ASTNode = StrMatch;

export class StrMatch implements ASTNodeIntf {
    kind: ASTKinds.StrMatch = ASTKinds.StrMatch;
    match : string;
    constructor(val : string){
        this.match = val;
    }
}

function tst(at : ASTNode){
    if(at.kind === ASTKinds.StrMatch)
        console.log(at.match);
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

    private runner<T extends ASTNode>(fn : $$RuleType<T>,
        cr? : ContextRecorder) : $$RuleType<T> {
        return () => {
            const mrk = this.mark();
            const res = cr ? (()=>{
                let extraInfo : string[] = [];
                const res = fn((msg : string) => extraInfo.push(msg));
                cr.record(mrk, res, extraInfo);
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
        return this.runner<StrMatch>(
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

    record(pos : number, result : Nullable<ASTNode>, extraInfo : string[]){
        if(result === null) {
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
