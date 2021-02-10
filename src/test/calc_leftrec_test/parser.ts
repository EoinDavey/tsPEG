/* AutoGenerated Code, changes may be overwritten
* INPUT GRAMMAR:
* // Left recursion test
* SUM  := l=SUM op='\+|-' r=FAC
*         .value = number {
*             return this.op === "+" ? l.value + r.value : l.value - r.value;
*         }
*         | FAC
* FAC  := l=FAC op='\*|/' r=ATOM
*         .value = number {
*             return this.op === "*" ? l.value * r.value : l.value / r.value;
*         }
*         | ATOM
* ATOM := _ val=INT _
*         .value = number { return this.val.value; }
*         | _ '\(' val=SUM '\)' _
*         .value = number { return this.val.value; }
* INT  := val='[0-9]+'
*         .value = number { return parseInt(this.val); }
* _    := '\s*'
*/
type Nullable<T> = T | null;
type $$RuleType<T> = () => Nullable<T>;
interface ASTNodeIntf {
    kind: ASTKinds;
}
export enum ASTKinds {
    SUM_1 = "SUM_1",
    SUM_2 = "SUM_2",
    FAC_1 = "FAC_1",
    FAC_2 = "FAC_2",
    ATOM_1 = "ATOM_1",
    ATOM_2 = "ATOM_2",
    INT = "INT",
    _ = "_",
}
export type SUM = SUM_1 | SUM_2;
export class SUM_1 {
    public kind: ASTKinds.SUM_1 = ASTKinds.SUM_1;
    public l: SUM;
    public op: string;
    public r: FAC;
    public value: number;
    constructor(l: SUM, op: string, r: FAC){
        this.l = l;
        this.op = op;
        this.r = r;
        this.value = ((): number => {
        return this.op === "+" ? l.value + r.value : l.value - r.value;
        })();
    }
}
export type SUM_2 = FAC;
export type FAC = FAC_1 | FAC_2;
export class FAC_1 {
    public kind: ASTKinds.FAC_1 = ASTKinds.FAC_1;
    public l: FAC;
    public op: string;
    public r: ATOM;
    public value: number;
    constructor(l: FAC, op: string, r: ATOM){
        this.l = l;
        this.op = op;
        this.r = r;
        this.value = ((): number => {
        return this.op === "*" ? l.value * r.value : l.value / r.value;
        })();
    }
}
export type FAC_2 = ATOM;
export type ATOM = ATOM_1 | ATOM_2;
export class ATOM_1 {
    public kind: ASTKinds.ATOM_1 = ASTKinds.ATOM_1;
    public val: INT;
    public value: number;
    constructor(val: INT){
        this.val = val;
        this.value = ((): number => {
        return this.val.value;
        })();
    }
}
export class ATOM_2 {
    public kind: ASTKinds.ATOM_2 = ASTKinds.ATOM_2;
    public val: SUM;
    public value: number;
    constructor(val: SUM){
        this.val = val;
        this.value = ((): number => {
        return this.val.value;
        })();
    }
}
export class INT {
    public kind: ASTKinds.INT = ASTKinds.INT;
    public val: string;
    public value: number;
    constructor(val: string){
        this.val = val;
        this.value = ((): number => {
        return parseInt(this.val);
        })();
    }
}
export type _ = string;
export class Parser {
    private readonly input: string;
    private pos: PosInfo;
    private negating: boolean = false;
    private memoSafe: boolean = true;
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
    public clearMemos(): void {
        this.$scope$SUM$memo.clear();
        this.$scope$FAC$memo.clear();
    }
    protected $scope$SUM$memo: Map<number, [Nullable<SUM>, PosInfo]> = new Map();
    protected $scope$FAC$memo: Map<number, [Nullable<FAC>, PosInfo]> = new Map();
    public matchSUM($$dpth: number, $$cr?: ErrorTracker): Nullable<SUM> {
        const fn = () => {
            return this.choice<SUM>([
                () => this.matchSUM_1($$dpth + 1, $$cr),
                () => this.matchSUM_2($$dpth + 1, $$cr),
            ]);
        };
        const $scope$pos = this.mark();
        const memo = this.$scope$SUM$memo.get($scope$pos.overallPos);
        if(memo !== undefined) {
            this.reset(memo[1]);
            return memo[0];
        }
        const $scope$oldMemoSafe = this.memoSafe;
        this.memoSafe = false;
        this.$scope$SUM$memo.set($scope$pos.overallPos, [null, $scope$pos]);
        let lastRes: Nullable<SUM> = null;
        let lastPos: PosInfo = $scope$pos;
        for(;;) {
            this.reset($scope$pos);
            const res = fn();
            const end = this.mark();
            if(end.overallPos <= lastPos.overallPos)
                break;
            lastRes = res;
            lastPos = end;
            this.$scope$SUM$memo.set($scope$pos.overallPos, [lastRes, lastPos]);
        }
        this.reset(lastPos);
        this.memoSafe = $scope$oldMemoSafe;
        return lastRes;
    }
    public matchSUM_1($$dpth: number, $$cr?: ErrorTracker): Nullable<SUM_1> {
        return this.runner<SUM_1>($$dpth,
            () => {
                let $scope$l: Nullable<SUM>;
                let $scope$op: Nullable<string>;
                let $scope$r: Nullable<FAC>;
                let $$res: Nullable<SUM_1> = null;
                if (true
                    && ($scope$l = this.matchSUM($$dpth + 1, $$cr)) !== null
                    && ($scope$op = this.regexAccept(String.raw`(?:\+|-)`, $$dpth + 1, $$cr)) !== null
                    && ($scope$r = this.matchFAC($$dpth + 1, $$cr)) !== null
                ) {
                    $$res = new SUM_1($scope$l, $scope$op, $scope$r);
                }
                return $$res;
            })();
    }
    public matchSUM_2($$dpth: number, $$cr?: ErrorTracker): Nullable<SUM_2> {
        return this.matchFAC($$dpth + 1, $$cr);
    }
    public matchFAC($$dpth: number, $$cr?: ErrorTracker): Nullable<FAC> {
        const fn = () => {
            return this.choice<FAC>([
                () => this.matchFAC_1($$dpth + 1, $$cr),
                () => this.matchFAC_2($$dpth + 1, $$cr),
            ]);
        };
        const $scope$pos = this.mark();
        const memo = this.$scope$FAC$memo.get($scope$pos.overallPos);
        if(memo !== undefined) {
            this.reset(memo[1]);
            return memo[0];
        }
        const $scope$oldMemoSafe = this.memoSafe;
        this.memoSafe = false;
        this.$scope$FAC$memo.set($scope$pos.overallPos, [null, $scope$pos]);
        let lastRes: Nullable<FAC> = null;
        let lastPos: PosInfo = $scope$pos;
        for(;;) {
            this.reset($scope$pos);
            const res = fn();
            const end = this.mark();
            if(end.overallPos <= lastPos.overallPos)
                break;
            lastRes = res;
            lastPos = end;
            this.$scope$FAC$memo.set($scope$pos.overallPos, [lastRes, lastPos]);
        }
        this.reset(lastPos);
        this.memoSafe = $scope$oldMemoSafe;
        return lastRes;
    }
    public matchFAC_1($$dpth: number, $$cr?: ErrorTracker): Nullable<FAC_1> {
        return this.runner<FAC_1>($$dpth,
            () => {
                let $scope$l: Nullable<FAC>;
                let $scope$op: Nullable<string>;
                let $scope$r: Nullable<ATOM>;
                let $$res: Nullable<FAC_1> = null;
                if (true
                    && ($scope$l = this.matchFAC($$dpth + 1, $$cr)) !== null
                    && ($scope$op = this.regexAccept(String.raw`(?:\*|/)`, $$dpth + 1, $$cr)) !== null
                    && ($scope$r = this.matchATOM($$dpth + 1, $$cr)) !== null
                ) {
                    $$res = new FAC_1($scope$l, $scope$op, $scope$r);
                }
                return $$res;
            })();
    }
    public matchFAC_2($$dpth: number, $$cr?: ErrorTracker): Nullable<FAC_2> {
        return this.matchATOM($$dpth + 1, $$cr);
    }
    public matchATOM($$dpth: number, $$cr?: ErrorTracker): Nullable<ATOM> {
        return this.choice<ATOM>([
            () => this.matchATOM_1($$dpth + 1, $$cr),
            () => this.matchATOM_2($$dpth + 1, $$cr),
        ]);
    }
    public matchATOM_1($$dpth: number, $$cr?: ErrorTracker): Nullable<ATOM_1> {
        return this.runner<ATOM_1>($$dpth,
            () => {
                let $scope$val: Nullable<INT>;
                let $$res: Nullable<ATOM_1> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && ($scope$val = this.matchINT($$dpth + 1, $$cr)) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                ) {
                    $$res = new ATOM_1($scope$val);
                }
                return $$res;
            })();
    }
    public matchATOM_2($$dpth: number, $$cr?: ErrorTracker): Nullable<ATOM_2> {
        return this.runner<ATOM_2>($$dpth,
            () => {
                let $scope$val: Nullable<SUM>;
                let $$res: Nullable<ATOM_2> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:\()`, $$dpth + 1, $$cr) !== null
                    && ($scope$val = this.matchSUM($$dpth + 1, $$cr)) !== null
                    && this.regexAccept(String.raw`(?:\))`, $$dpth + 1, $$cr) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                ) {
                    $$res = new ATOM_2($scope$val);
                }
                return $$res;
            })();
    }
    public matchINT($$dpth: number, $$cr?: ErrorTracker): Nullable<INT> {
        return this.runner<INT>($$dpth,
            () => {
                let $scope$val: Nullable<string>;
                let $$res: Nullable<INT> = null;
                if (true
                    && ($scope$val = this.regexAccept(String.raw`(?:[0-9]+)`, $$dpth + 1, $$cr)) !== null
                ) {
                    $$res = new INT($scope$val);
                }
                return $$res;
            })();
    }
    public match_($$dpth: number, $$cr?: ErrorTracker): Nullable<_> {
        return this.regexAccept(String.raw`(?:\s*)`, $$dpth + 1, $$cr);
    }
    public test(): boolean {
        const mrk = this.mark();
        const res = this.matchSUM(0);
        const ans = res !== null;
        this.reset(mrk);
        return ans;
    }
    public parse(): ParseResult {
        const mrk = this.mark();
        const res = this.matchSUM(0);
        if (res)
            return {ast: res, errs: []};
        this.reset(mrk);
        const rec = new ErrorTracker();
        this.clearMemos();
        this.matchSUM(0, rec);
        const err = rec.getErr()
        return {ast: res, errs: err !== null ? [err] : []}
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
    private memoise<K>(rule: $$RuleType<K>, memo: Map<number, [Nullable<K>, PosInfo]>): Nullable<K> {
        const $scope$pos = this.mark();
        const $scope$memoRes = memo.get($scope$pos.overallPos);
        if(this.memoSafe && $scope$memoRes !== undefined) {
        this.reset($scope$memoRes[1]);
        return $scope$memoRes[0];
        }
        const $scope$result = rule();
        if(this.memoSafe)
        memo.set($scope$pos.overallPos, [$scope$result, this.mark()]);
        return $scope$result;
    }
}
export function parse(s: string): ParseResult {
    const p = new Parser(s);
    return p.parse();
}
export interface ParseResult {
    ast: Nullable<SUM>;
    errs: SyntaxErr[];
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
    constructor(pos: PosInfo, expmatches: MatchAttempt[]) {
        this.pos = pos;
        this.expmatches = [...expmatches];
    }
    public toString(): string {
        return `Syntax Error at line ${this.pos.line}:${this.pos.offset}. Expected one of ${this.expmatches.map(x => x.kind === "EOF" ? " EOF" : ` ${x.negated ? 'not ': ''}'${x.literal}'`)}`;
    }
}
class ErrorTracker {
    private mxpos: PosInfo = {overallPos: -1, line: -1, offset: -1};
    private regexset: Set<string> = new Set();
    private pmatches: MatchAttempt[] = [];
    public record(pos: PosInfo, result: any, att: MatchAttempt) {
        if ((result === null) === att.negated)
            return;
        if (pos.overallPos > this.mxpos.overallPos) {
            this.mxpos = pos;
            this.pmatches = [];
            this.regexset.clear()
        }
        if (this.mxpos.overallPos === pos.overallPos) {
            if(att.kind === "RegexMatch") {
                if(!this.regexset.has(att.literal))
                    this.pmatches.push(att);
                this.regexset.add(att.literal);
            } else {
                this.pmatches.push(att);
            }
        }
    }
    public getErr(): SyntaxErr | null {
        if (this.mxpos.overallPos !== -1)
            return new SyntaxErr(this.mxpos, this.pmatches);
        return null;
    }
}