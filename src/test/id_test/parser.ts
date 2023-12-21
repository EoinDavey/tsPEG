/* AutoGenerated Code, changes may be overwritten
* INPUT GRAMMAR:
* // Test for allowable id names
* lowercase := 'a'
* UPPERCASE := 'b'
* _start_hypen_ := 'c'
* numbers1ab234 := 'd'
* // Check for namespace collision
* rule := rule=rule .a = number { return 0; }
* rule2 := res='a'
* rule3 := cr='b'
*/
type Nullable<T> = T | null;
type $$RuleType<T> = () => Nullable<T>;
export interface ASTNodeIntf {
    kind: ASTKinds;
}
export enum ASTKinds {
    lowercase = "lowercase",
    UPPERCASE = "UPPERCASE",
    _start_hypen_ = "_start_hypen_",
    numbers1ab234 = "numbers1ab234",
    rule = "rule",
    rule2 = "rule2",
    rule3 = "rule3",
}
export type lowercase = string;
export type UPPERCASE = string;
export type _start_hypen_ = string;
export type numbers1ab234 = string;
export class rule {
    public kind: ASTKinds.rule = ASTKinds.rule;
    public rule: rule;
    public a: number;
    constructor(rule: rule){
        this.rule = rule;
        this.a = ((): number => {
        return 0;
        })();
    }
}
export interface rule2 {
    kind: ASTKinds.rule2;
    res: string;
}
export interface rule3 {
    kind: ASTKinds.rule3;
    cr: string;
}
export class Parser {
    private readonly input: string;
    private pos: PosInfo;
    private negating: boolean = false;
    private memoSafe: boolean = true;
    public debugEnabled: boolean = false;
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
        this.$scope$rule$memo.clear();
    }
    protected $scope$rule$memo: Map<number, [Nullable<rule>, PosInfo]> = new Map();
    public matchlowercase($$dpth: number, $$cr?: ErrorTracker): Nullable<lowercase> {
        return this.regexAccept(String.raw`(?:a)`, "", $$dpth + 1, $$cr);
    }
    public matchUPPERCASE($$dpth: number, $$cr?: ErrorTracker): Nullable<UPPERCASE> {
        return this.regexAccept(String.raw`(?:b)`, "", $$dpth + 1, $$cr);
    }
    public match_start_hypen_($$dpth: number, $$cr?: ErrorTracker): Nullable<_start_hypen_> {
        return this.regexAccept(String.raw`(?:c)`, "", $$dpth + 1, $$cr);
    }
    public matchnumbers1ab234($$dpth: number, $$cr?: ErrorTracker): Nullable<numbers1ab234> {
        return this.regexAccept(String.raw`(?:d)`, "", $$dpth + 1, $$cr);
    }
    public matchrule($$dpth: number, $$cr?: ErrorTracker): Nullable<rule> {
        const fn = () => {
            return this.run<rule>($$dpth,
                () => {
                    let $scope$rule: Nullable<rule>;
                    let $$res: Nullable<rule> = null;
                    if (true
                        && ($scope$rule = this.matchrule($$dpth + 1, $$cr)) !== null
                    ) {
                        $$res = new rule($scope$rule);
                    }
                    return $$res;
                });
        };
        const $scope$pos = this.mark();
        const memo = this.$scope$rule$memo.get($scope$pos.overallPos);
        if(memo !== undefined) {
            this.reset(memo[1]);
            return memo[0];
        }
        const $scope$oldMemoSafe = this.memoSafe;
        this.memoSafe = false;
        this.$scope$rule$memo.set($scope$pos.overallPos, [null, $scope$pos]);
        let lastRes: Nullable<rule> = null;
        let lastPos: PosInfo = $scope$pos;
        for(;;) {
            this.reset($scope$pos);
            const res = fn();
            const end = this.mark();
            if(end.overallPos <= lastPos.overallPos)
                break;
            lastRes = res;
            lastPos = end;
            this.$scope$rule$memo.set($scope$pos.overallPos, [lastRes, lastPos]);
        }
        this.reset(lastPos);
        this.memoSafe = $scope$oldMemoSafe;
        return lastRes;
    }
    public matchrule2($$dpth: number, $$cr?: ErrorTracker): Nullable<rule2> {
        return this.run<rule2>($$dpth,
            () => {
                let $scope$res: Nullable<string>;
                let $$res: Nullable<rule2> = null;
                if (true
                    && ($scope$res = this.regexAccept(String.raw`(?:a)`, "", $$dpth + 1, $$cr)) !== null
                ) {
                    $$res = {kind: ASTKinds.rule2, res: $scope$res};
                }
                return $$res;
            });
    }
    public matchrule3($$dpth: number, $$cr?: ErrorTracker): Nullable<rule3> {
        return this.run<rule3>($$dpth,
            () => {
                let $scope$cr: Nullable<string>;
                let $$res: Nullable<rule3> = null;
                if (true
                    && ($scope$cr = this.regexAccept(String.raw`(?:b)`, "", $$dpth + 1, $$cr)) !== null
                ) {
                    $$res = {kind: ASTKinds.rule3, cr: $scope$cr};
                }
                return $$res;
            });
    }
    public test(): boolean {
        const mrk = this.mark();
        const res = this.matchlowercase(0);
        const ans = res !== null;
        this.reset(mrk);
        return ans;
    }
    public parse(): ParseResult {
        const mrk = this.mark();
        const res = this.matchlowercase(0);
        if (res)
            return {ast: res, errs: []};
        this.reset(mrk);
        const rec = new ErrorTracker();
        this.clearMemos();
        this.matchlowercase(0, rec);
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
        if (res !== null) {
            return res;
        }
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
        if(res !== null) {
            return res;
        }
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
    ast: Nullable<lowercase>;
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