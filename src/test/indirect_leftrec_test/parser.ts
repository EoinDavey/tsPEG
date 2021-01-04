/* AutoGenerated Code, changes may be overwritten
* INPUT GRAMMAR:
* // Indirect left recursion test
* A := B B | 'a'
* B := A | 'b'
*/
type Nullable<T> = T | null;
type $$RuleType<T> = () => Nullable<T>;
interface ASTNodeIntf {
    kind: ASTKinds;
}
export enum ASTKinds {
    A_1 = "A_1",
    A_2 = "A_2",
    B_1 = "B_1",
    B_2 = "B_2",
}
export type A = A_1 | A_2;
export interface A_1 {
    kind: ASTKinds.A_1;
}
export type A_2 = string;
export type B = B_1 | B_2;
export type B_1 = A;
export type B_2 = string;
export class Parser {
    private readonly input: string;
    private pos: PosInfo;
    private negating: boolean = false;
    constructor(input: string) {
        this.pos = {overallPos: 0, line: 1, offset: 0};
        this.input = input;
    }
    public reset(pos: PosInfo) {
        this.pos = pos;
    }
    public finished(): boolean {
        return this.pos.overallPos === this.input.length;
    }
    private $scope$A$memo: Map<number, [Nullable<A>, PosInfo]> = new Map();
    public matchA($$dpth: number, $$cr?: ErrorTracker): Nullable<A> {
        const fn = () => {
            return this.choice<A>([
                () => this.matchA_1($$dpth + 1, $$cr),
                () => this.matchA_2($$dpth + 1, $$cr),
            ]);
        };
        const pos = this.mark();
        const memo = this.$scope$A$memo.get(pos.overallPos);
        if(memo !== undefined) {
            this.reset(memo[1]);
            return memo[0];
        }
        this.$scope$A$memo.set(pos.overallPos, [null, pos]);
        let lastRes: Nullable<A> = null;
        let lastPos: PosInfo = pos;
        for(;;) {
            this.reset(pos);
            const res = fn();
            const end = this.mark();
            if(end.overallPos <= lastPos.overallPos)
                break;
            lastRes = res;
            lastPos = end;
            this.$scope$A$memo.set(pos.overallPos, [lastRes, lastPos]);
        }
        this.reset(lastPos);
        return lastRes;
    }
    public matchA_1($$dpth: number, $$cr?: ErrorTracker): Nullable<A_1> {
        return this.runner<A_1>($$dpth,
            () => {
                let $$res: Nullable<A_1> = null;
                if (true
                    && this.matchB($$dpth + 1, $$cr) !== null
                    && this.matchB($$dpth + 1, $$cr) !== null
                ) {
                    $$res = {kind: ASTKinds.A_1, };
                }
                return $$res;
            })();
    }
    public matchA_2($$dpth: number, $$cr?: ErrorTracker): Nullable<A_2> {
        return this.regexAccept(String.raw`(?:a)`, $$dpth + 1, $$cr);
    }
    public matchB($$dpth: number, $$cr?: ErrorTracker): Nullable<B> {
        return this.choice<B>([
            () => this.matchB_1($$dpth + 1, $$cr),
            () => this.matchB_2($$dpth + 1, $$cr),
        ]);
    }
    public matchB_1($$dpth: number, $$cr?: ErrorTracker): Nullable<B_1> {
        return this.matchA($$dpth + 1, $$cr);
    }
    public matchB_2($$dpth: number, $$cr?: ErrorTracker): Nullable<B_2> {
        return this.regexAccept(String.raw`(?:b)`, $$dpth + 1, $$cr);
    }
    public test(): boolean {
        const mrk = this.mark();
        const res = this.matchA(0);
        const ans = res !== null && this.finished();
        this.reset(mrk);
        return ans;
    }
    public parse(): ParseResult {
        const mrk = this.mark();
        const res = this.matchA(0);
        if (res && this.finished()) {
            return new ParseResult(res, null);
        }
        this.reset(mrk);
        const rec = new ErrorTracker();
        this.matchA(0, rec);
        return new ParseResult(res,
            rec.getErr() ?? new SyntaxErr(this.mark(), new Set([{kind: "EOF", negated: false}])));
    }
    public mark(): PosInfo {
        return this.pos;
    }
    private loop<T>(func: $$RuleType<T>, star: boolean = false): Nullable<T[]> {
        const mrk = this.mark();
        const res: T[] = [];
        for (;;) {
            const t = func();
            if (t === null) {
                break;
            }
            res.push(t);
        }
        if (star || res.length > 0) {
            return res;
        }
        this.reset(mrk);
        return null;
    }
    private runner<T>($$dpth: number, fn: $$RuleType<T>): $$RuleType<T> {
        return () => {
            const mrk = this.mark();
            const res = fn()
            if (res !== null)
                return res;
            this.reset(mrk);
            return null;
        };
    }
    private choice<T>(fns: Array<$$RuleType<T>>): Nullable<T> {
        for (const f of fns) {
            const res = f();
            if (res !== null) {
                return res;
            }
        }
        return null;
    }
    private regexAccept(match: string, dpth: number, cr?: ErrorTracker): Nullable<string> {
        return this.runner<string>(dpth,
            () => {
                const reg = new RegExp(match, "y");
                const mrk = this.mark();
                reg.lastIndex = mrk.overallPos;
                const res = this.tryConsume(reg);
                if(cr) {
                    cr.record(mrk, res, {
                        kind: "RegexMatch",
                        // We substring from 3 to len - 1 to strip off the
                        // non-capture group syntax added as a WebKit workaround
                        literal: match.substring(3, match.length - 1),
                        negated: this.negating,
                    });
                }
                return res;
            })();
    }
    private tryConsume(reg: RegExp): Nullable<string> {
        const res = reg.exec(this.input);
        if (res) {
            let lineJmp = 0;
            let lind = -1;
            for (let i = 0; i < res[0].length; ++i) {
                if (res[0][i] === "\n") {
                    ++lineJmp;
                    lind = i;
                }
            }
            this.pos = {
                overallPos: reg.lastIndex,
                line: this.pos.line + lineJmp,
                offset: lind === -1 ? this.pos.offset + res[0].length : (res[0].length - lind - 1)
            };
            return res[0];
        }
        return null;
    }
    private noConsume<T>(fn: $$RuleType<T>): Nullable<T> {
        const mrk = this.mark();
        const res = fn();
        this.reset(mrk);
        return res;
    }
    private negate<T>(fn: $$RuleType<T>): Nullable<boolean> {
        const mrk = this.mark();
        const oneg = this.negating;
        this.negating = !oneg;
        const res = fn();
        this.negating = oneg;
        this.reset(mrk);
        return res === null ? true : null;
    }
}
export function parse(s: string): ParseResult {
    const p = new Parser(s);
    return p.parse();
}
export class ParseResult {
    public ast: Nullable<A>;
    public err: Nullable<SyntaxErr>;
    constructor(ast: Nullable<A>, err: Nullable<SyntaxErr>) {
        this.ast = ast;
        this.err = err;
    }
}
export interface PosInfo {
    readonly overallPos: number;
    readonly line: number;
    readonly offset: number;
}
export interface RegexMatch {
    readonly kind: "RegexMatch";
    readonly negated: boolean;
    readonly literal: string;
}
export type EOFMatch = { kind: "EOF"; negated: boolean };
export type MatchAttempt = RegexMatch | EOFMatch;
export class SyntaxErr {
    public pos: PosInfo;
    public expmatches: MatchAttempt[];
    constructor(pos: PosInfo, expmatches: Set<MatchAttempt>) {
        this.pos = pos;
        this.expmatches = [...expmatches];
    }
    public toString(): string {
        return `Syntax Error at line ${this.pos.line}:${this.pos.offset}. Expected one of ${this.expmatches.map(x => x.kind === "EOF" ? " EOF" : ` ${x.negated ? 'not ': ''}'${x.literal}'`)}`;
    }
}
class ErrorTracker {
    private mxpos: PosInfo = {overallPos: -1, line: -1, offset: -1};
    private pmatches: Set<MatchAttempt> = new Set();
    public record(pos: PosInfo, result: any, att: MatchAttempt) {
        if ((result === null) === att.negated)
            return;
        if (pos.overallPos > this.mxpos.overallPos) {
            this.mxpos = pos;
            this.pmatches.clear();
        }
        if (this.mxpos.overallPos === pos.overallPos)
            this.pmatches.add(att);
    }
    public getErr(): SyntaxErr | null {
        if (this.mxpos.overallPos !== -1)
            return new SyntaxErr(this.mxpos, this.pmatches);
        return null;
    }
}