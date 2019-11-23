"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class $$StrMatch {
    constructor(val) {
        this.kind = ASTKinds.$$StrMatch;
        this.match = val;
    }
}
exports.$$StrMatch = $$StrMatch;
var ASTKinds;
(function (ASTKinds) {
    ASTKinds[ASTKinds["$$StrMatch"] = 0] = "$$StrMatch";
    ASTKinds[ASTKinds["S"] = 1] = "S";
    ASTKinds[ASTKinds["S_$0"] = 2] = "S_$0";
    ASTKinds[ASTKinds["A_1"] = 3] = "A_1";
    ASTKinds[ASTKinds["A_2"] = 4] = "A_2";
    ASTKinds[ASTKinds["B_1"] = 5] = "B_1";
    ASTKinds[ASTKinds["B_2"] = 6] = "B_2";
})(ASTKinds = exports.ASTKinds || (exports.ASTKinds = {}));
class S {
    constructor() {
        this.kind = ASTKinds.S;
    }
}
exports.S = S;
class S_$0 {
    constructor() {
        this.kind = ASTKinds.S_$0;
    }
}
exports.S_$0 = S_$0;
class A_1 {
    constructor() {
        this.kind = ASTKinds.A_1;
    }
}
exports.A_1 = A_1;
class B_1 {
    constructor() {
        this.kind = ASTKinds.B_1;
    }
}
exports.B_1 = B_1;
class Parser {
    constructor(input) {
        this.pos = 0;
        this.input = input;
    }
    mark() {
        return this.pos;
    }
    reset(pos) {
        this.pos = pos;
    }
    finished() {
        return this.pos == this.input.length;
    }
    loop(func, star = false) {
        const mrk = this.mark();
        let res = [];
        for (;;) {
            const t = func();
            if (!t)
                break;
            res.push(t);
        }
        if (star || res.length > 0)
            return res;
        this.reset(mrk);
        return null;
    }
    runner($$dpth, fn, cr) {
        return () => {
            const mrk = this.mark();
            const res = cr ? (() => {
                let extraInfo = [];
                const res = fn((msg) => extraInfo.push(msg));
                cr.record(mrk, $$dpth, res, extraInfo);
                return res;
            })() : fn();
            if (res)
                return res;
            this.reset(mrk);
            return null;
        };
    }
    choice(fns) {
        for (let f of fns) {
            const res = f();
            if (res)
                return res;
        }
        return null;
    }
    regexAccept(match, dpth, cr) {
        return this.runner(dpth, (log) => {
            if (log) {
                log('$$StrMatch');
                log(match);
            }
            var reg = new RegExp(match, 'y');
            reg.lastIndex = this.mark();
            const res = reg.exec(this.input);
            if (res) {
                this.pos = reg.lastIndex;
                return new $$StrMatch(res[0]);
            }
            return null;
        }, cr)();
    }
    noConsume($$dpth, fn, cr) {
        const mrk = this.mark();
        const res = fn();
        this.reset(mrk);
        return res;
    }
    matchS($$dpth, cr) {
        return this.runner($$dpth, (log) => {
            if (log)
                log('S');
            let res = null;
            if (true
                && this.noConsume($$dpth + 1, () => this.matchS_$0($$dpth + 1, cr))
                && this.loop(() => this.regexAccept(String.raw `a`, $$dpth + 1, cr), false)
                && this.matchB($$dpth + 1, cr))
                res = new S();
            return res;
        }, cr)();
    }
    matchS_$0($$dpth, cr) {
        return this.runner($$dpth, (log) => {
            if (log)
                log('S_$0');
            let res = null;
            if (true
                && this.matchA($$dpth + 1, cr)
                && this.regexAccept(String.raw `c`, $$dpth + 1, cr))
                res = new S_$0();
            return res;
        }, cr)();
    }
    matchA($$dpth, cr) {
        return this.choice([
            () => { return this.matchA_1($$dpth + 1, cr); },
            () => { return this.matchA_2($$dpth + 1, cr); },
        ]);
    }
    matchA_1($$dpth, cr) {
        return this.runner($$dpth, (log) => {
            if (log)
                log('A_1');
            let res = null;
            if (true
                && this.regexAccept(String.raw `a`, $$dpth + 1, cr)
                && this.matchA($$dpth + 1, cr)
                && this.regexAccept(String.raw `b`, $$dpth + 1, cr))
                res = new A_1();
            return res;
        }, cr)();
    }
    matchA_2($$dpth, cr) {
        return this.regexAccept(String.raw `ab`, $$dpth + 1, cr);
    }
    matchB($$dpth, cr) {
        return this.choice([
            () => { return this.matchB_1($$dpth + 1, cr); },
            () => { return this.matchB_2($$dpth + 1, cr); },
        ]);
    }
    matchB_1($$dpth, cr) {
        return this.runner($$dpth, (log) => {
            if (log)
                log('B_1');
            let res = null;
            if (true
                && this.regexAccept(String.raw `b`, $$dpth + 1, cr)
                && this.matchB($$dpth + 1, cr)
                && this.regexAccept(String.raw `c`, $$dpth + 1, cr))
                res = new B_1();
            return res;
        }, cr)();
    }
    matchB_2($$dpth, cr) {
        return this.regexAccept(String.raw `bc`, $$dpth + 1, cr);
    }
    parse() {
        const mrk = this.mark();
        const res = this.matchS(0);
        if (res && this.finished())
            return new ParseResult(res, null);
        this.reset(mrk);
        const rec = new ErrorTracker();
        this.matchS(0, rec);
        return new ParseResult(res, rec.getErr());
    }
}
exports.Parser = Parser;
class ParseResult {
    constructor(ast, err) {
        this.ast = ast;
        this.err = err;
    }
}
exports.ParseResult = ParseResult;
class SyntaxErr {
    constructor(pos, exprules, expmatches) {
        this.pos = pos;
        this.exprules = [...exprules];
        this.expmatches = [...expmatches];
    }
    toString() {
        return `Syntax Error at position ${this.pos}. Tried to match rules ${this.exprules.join(', ')}. Expected one of ${this.expmatches.map(x => ` '${x}'`)}`;
    }
}
exports.SyntaxErr = SyntaxErr;
class ErrorTracker {
    constructor() {
        this.mxpos = -1;
        this.mnd = -1;
        this.prules = new Set();
        this.pmatches = new Set();
    }
    record(pos, depth, result, extraInfo) {
        if (result !== null)
            return;
        if (pos > this.mxpos) {
            this.mxpos = pos;
            this.mnd = depth;
            this.pmatches.clear();
            this.prules.clear();
        }
        else if (pos === this.mxpos && depth < this.mnd) {
            this.mnd = depth;
            this.prules.clear();
        }
        if (this.mxpos === pos && extraInfo.length >= 2 && extraInfo[0] === '$$StrMatch')
            this.pmatches.add(extraInfo[1]);
        if (this.mxpos === pos && this.mnd === depth)
            extraInfo.forEach(x => { if (x !== '$$StrMatch')
                this.prules.add(x); });
    }
    getErr() {
        if (this.mxpos !== -1)
            return new SyntaxErr(this.mxpos, this.prules, this.pmatches);
        return null;
    }
}
