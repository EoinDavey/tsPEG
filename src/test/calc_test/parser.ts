/* AutoGenerated Code, changes may be overwritten
* INPUT GRAMMAR:
* SUM  := head=FAC tail={ op='\+|-' sm=FAC }*
*         .value = number {
*             return this.tail.reduce((x, y) => {
*                 return y.op === "+" ? x + y.sm.value : x - y.sm.value;
*             }, this.head.value);
*         }
* FAC  := head=ATOM tail={ op='\*|/' sm=ATOM }*
*         .value = number {
*             return this.tail.reduce((x, y) => {
*                 return y.op === "*" ? x * y.sm.value : x / y.sm.value;
*             }, this.head.value);
*         }
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
export interface ASTNodeIntf {
    kind: ASTKinds;
}
export enum ASTKinds {
    SUM,
    SUM_$0,
    FAC,
    FAC_$0,
    ATOM_1,
    ATOM_2,
    INT,
    _,
}
export class SUM {
    public kind: ASTKinds.SUM = ASTKinds.SUM;
    public head: FAC;
    public tail: SUM_$0[];
    public value: number;
    constructor(head: FAC, tail: SUM_$0[]){
        this.head = head;
        this.tail = tail;
        this.value = ((): number => {
        return this.tail.reduce((x, y) => {
                return y.op === "+" ? x + y.sm.value : x - y.sm.value;
            }, this.head.value);
        })();
    }
}
export interface SUM_$0 {
    kind: ASTKinds.SUM_$0;
    op: string;
    sm: FAC;
}
export class FAC {
    public kind: ASTKinds.FAC = ASTKinds.FAC;
    public head: ATOM;
    public tail: FAC_$0[];
    public value: number;
    constructor(head: ATOM, tail: FAC_$0[]){
        this.head = head;
        this.tail = tail;
        this.value = ((): number => {
        return this.tail.reduce((x, y) => {
                return y.op === "*" ? x * y.sm.value : x / y.sm.value;
            }, this.head.value);
        })();
    }
}
export interface FAC_$0 {
    kind: ASTKinds.FAC_$0;
    op: string;
    sm: ATOM;
}
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
    }
    public matchSUM($$dpth: number, $$cr?: ErrorTracker): Nullable<SUM> {
        return this.run<SUM>($$dpth,
            () => {
                let $scope$head: Nullable<FAC>;
                let $scope$tail: Nullable<SUM_$0[]>;
                let $$res: Nullable<SUM> = null;
                if (true
                    && ($scope$head = this.matchFAC($$dpth + 1, $$cr)) !== null
                    && ($scope$tail = this.loop<SUM_$0>(() => this.matchSUM_$0($$dpth + 1, $$cr), 0, -1)) !== null
                ) {
                    $$res = new SUM($scope$head, $scope$tail);
                }
                return $$res;
            });
    }
    public matchSUM_$0($$dpth: number, $$cr?: ErrorTracker): Nullable<SUM_$0> {
        return this.run<SUM_$0>($$dpth,
            () => {
                let $scope$op: Nullable<string>;
                let $scope$sm: Nullable<FAC>;
                let $$res: Nullable<SUM_$0> = null;
                if (true
                    && ($scope$op = this.regexAccept(String.raw`(?:\+|-)`, "", $$dpth + 1, $$cr)) !== null
                    && ($scope$sm = this.matchFAC($$dpth + 1, $$cr)) !== null
                ) {
                    $$res = {kind: ASTKinds.SUM_$0, op: $scope$op, sm: $scope$sm};
                }
                return $$res;
            });
    }
    public matchFAC($$dpth: number, $$cr?: ErrorTracker): Nullable<FAC> {
        return this.run<FAC>($$dpth,
            () => {
                let $scope$head: Nullable<ATOM>;
                let $scope$tail: Nullable<FAC_$0[]>;
                let $$res: Nullable<FAC> = null;
                if (true
                    && ($scope$head = this.matchATOM($$dpth + 1, $$cr)) !== null
                    && ($scope$tail = this.loop<FAC_$0>(() => this.matchFAC_$0($$dpth + 1, $$cr), 0, -1)) !== null
                ) {
                    $$res = new FAC($scope$head, $scope$tail);
                }
                return $$res;
            });
    }
    public matchFAC_$0($$dpth: number, $$cr?: ErrorTracker): Nullable<FAC_$0> {
        return this.run<FAC_$0>($$dpth,
            () => {
                let $scope$op: Nullable<string>;
                let $scope$sm: Nullable<ATOM>;
                let $$res: Nullable<FAC_$0> = null;
                if (true
                    && ($scope$op = this.regexAccept(String.raw`(?:\*|/)`, "", $$dpth + 1, $$cr)) !== null
                    && ($scope$sm = this.matchATOM($$dpth + 1, $$cr)) !== null
                ) {
                    $$res = {kind: ASTKinds.FAC_$0, op: $scope$op, sm: $scope$sm};
                }
                return $$res;
            });
    }
    public matchATOM($$dpth: number, $$cr?: ErrorTracker): Nullable<ATOM> {
        return this.choice<ATOM>([
            () => this.matchATOM_1($$dpth + 1, $$cr),
            () => this.matchATOM_2($$dpth + 1, $$cr),
        ]);
    }
    public matchATOM_1($$dpth: number, $$cr?: ErrorTracker): Nullable<ATOM_1> {
        return this.run<ATOM_1>($$dpth,
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
            });
    }
    public matchATOM_2($$dpth: number, $$cr?: ErrorTracker): Nullable<ATOM_2> {
        return this.run<ATOM_2>($$dpth,
            () => {
                let $scope$val: Nullable<SUM>;
                let $$res: Nullable<ATOM_2> = null;
                if (true
                    && this.match_($$dpth + 1, $$cr) !== null
                    && this.regexAccept(String.raw`(?:\()`, "", $$dpth + 1, $$cr) !== null
                    && ($scope$val = this.matchSUM($$dpth + 1, $$cr)) !== null
                    && this.regexAccept(String.raw`(?:\))`, "", $$dpth + 1, $$cr) !== null
                    && this.match_($$dpth + 1, $$cr) !== null
                ) {
                    $$res = new ATOM_2($scope$val);
                }
                return $$res;
            });
    }
    public matchINT($$dpth: number, $$cr?: ErrorTracker): Nullable<INT> {
        return this.run<INT>($$dpth,
            () => {
                let $scope$val: Nullable<string>;
                let $$res: Nullable<INT> = null;
                if (true
                    && ($scope$val = this.regexAccept(String.raw`(?:[0-9]+)`, "", $$dpth + 1, $$cr)) !== null
                ) {
                    $$res = new INT($scope$val);
                }
                return $$res;
            });
    }
    public match_($$dpth: number, $$cr?: ErrorTracker): Nullable<_> {
        return this.regexAccept(String.raw`(?:\s*)`, "", $$dpth + 1, $$cr);
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
    // @ts-ignore: loopPlus may not be called
    private loopPlus<T>(func: $$RuleType<T>): Nullable<[T, ...T[]]> {
        return this.loop(func, 1, -1) as Nullable<[T, ...T[]]>;
    }
    private loop<T>(func: $$RuleType<T>, lb: number, ub: number): Nullable<T[]> {
        const mrk = this.mark();
        const res: T[] = [];
        while (ub === -1 || res.length < ub) {
            const preMrk = this.mark();
            const t = func();
            if (t === null || this.pos.overallPos === preMrk.overallPos) {
                break;
            }
            res.push(t);
        }
        if (res.length >= lb) {
            return res;
        }
        this.reset(mrk);
        return null;
    }
    // @ts-ignore: It's possible that run won't be called
    private run<T>($$dpth: number, fn: $$RuleType<T>): Nullable<T> {
        const mrk = this.mark();
        const res = fn()
        if (res !== null)
            return res;
        this.reset(mrk);
        return null;
    }
    // @ts-ignore: choice may not be called
    private choice<T>(fns: Array<$$RuleType<T>>): Nullable<T> {
        for (const f of fns) {
            const res = f();
            if (res !== null) {
                return res;
            }
        }
        return null;
    }
    private regexAccept(match: string, mods: string, dpth: number, cr?: ErrorTracker): Nullable<string> {
        const reg = new RegExp(match, "y" + mods);
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
        if(res !== null)
            return res;
        this.reset(mrk);
        return null;
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
    // @ts-ignore: noConsume may not be called
    private noConsume<T>(fn: $$RuleType<T>): Nullable<T> {
        const mrk = this.mark();
        const res = fn();
        this.reset(mrk);
        return res;
    }
    // @ts-ignore: negate may not be called
    private negate<T>(fn: $$RuleType<T>): Nullable<boolean> {
        const mrk = this.mark();
        const oneg = this.negating;
        this.negating = !oneg;
        const res = fn();
        this.negating = oneg;
        this.reset(mrk);
        return res === null ? true : null;
    }
    // @ts-ignore: Memoise may not be used
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