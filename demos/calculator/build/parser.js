"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ASTKinds;
(function (ASTKinds) {
    ASTKinds[ASTKinds["SUM"] = 0] = "SUM";
    ASTKinds[ASTKinds["SUM_$0"] = 1] = "SUM_$0";
    ASTKinds[ASTKinds["FAC"] = 2] = "FAC";
    ASTKinds[ASTKinds["FAC_$0"] = 3] = "FAC_$0";
    ASTKinds[ASTKinds["ATOM_1"] = 4] = "ATOM_1";
    ASTKinds[ASTKinds["ATOM_2"] = 5] = "ATOM_2";
    ASTKinds[ASTKinds["INT"] = 6] = "INT";
    ASTKinds[ASTKinds["_"] = 7] = "_";
})(ASTKinds = exports.ASTKinds || (exports.ASTKinds = {}));
class SUM {
    constructor(head, tail) {
        this.kind = ASTKinds.SUM;
        this.head = head;
        this.tail = tail;
    }
}
exports.SUM = SUM;
class SUM_$0 {
    constructor(op, sm) {
        this.kind = ASTKinds.SUM_$0;
        this.op = op;
        this.sm = sm;
    }
}
exports.SUM_$0 = SUM_$0;
class FAC {
    constructor(head, tail) {
        this.kind = ASTKinds.FAC;
        this.head = head;
        this.tail = tail;
    }
}
exports.FAC = FAC;
class FAC_$0 {
    constructor(op, sm) {
        this.kind = ASTKinds.FAC_$0;
        this.op = op;
        this.sm = sm;
    }
}
exports.FAC_$0 = FAC_$0;
class ATOM_1 {
    constructor(val) {
        this.kind = ASTKinds.ATOM_1;
        this.val = val;
    }
}
exports.ATOM_1 = ATOM_1;
class ATOM_2 {
    constructor(val) {
        this.kind = ASTKinds.ATOM_2;
        this.val = val;
    }
}
exports.ATOM_2 = ATOM_2;
class INT {
    constructor(val) {
        this.kind = ASTKinds.INT;
        this.val = val;
    }
}
exports.INT = INT;
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
            if (res !== null)
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
                return res[0];
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
    matchSUM($$dpth, cr) {
        return this.runner($$dpth, (log) => {
            if (log)
                log('SUM');
            let head;
            let tail;
            let res = null;
            if (true
                && (head = this.matchFAC($$dpth + 1, cr)) != null
                && (tail = this.loop(() => this.matchSUM_$0($$dpth + 1, cr), true)) != null)
                res = new SUM(head, tail);
            return res;
        }, cr)();
    }
    matchSUM_$0($$dpth, cr) {
        return this.runner($$dpth, (log) => {
            if (log)
                log('SUM_$0');
            let op;
            let sm;
            let res = null;
            if (true
                && (op = this.regexAccept(String.raw `\+|-`, $$dpth + 1, cr)) != null
                && (sm = this.matchFAC($$dpth + 1, cr)) != null)
                res = new SUM_$0(op, sm);
            return res;
        }, cr)();
    }
    matchFAC($$dpth, cr) {
        return this.runner($$dpth, (log) => {
            if (log)
                log('FAC');
            let head;
            let tail;
            let res = null;
            if (true
                && (head = this.matchATOM($$dpth + 1, cr)) != null
                && (tail = this.loop(() => this.matchFAC_$0($$dpth + 1, cr), true)) != null)
                res = new FAC(head, tail);
            return res;
        }, cr)();
    }
    matchFAC_$0($$dpth, cr) {
        return this.runner($$dpth, (log) => {
            if (log)
                log('FAC_$0');
            let op;
            let sm;
            let res = null;
            if (true
                && (op = this.regexAccept(String.raw `\*|/`, $$dpth + 1, cr)) != null
                && (sm = this.matchATOM($$dpth + 1, cr)) != null)
                res = new FAC_$0(op, sm);
            return res;
        }, cr)();
    }
    matchATOM($$dpth, cr) {
        return this.choice([
            () => { return this.matchATOM_1($$dpth + 1, cr); },
            () => { return this.matchATOM_2($$dpth + 1, cr); },
        ]);
    }
    matchATOM_1($$dpth, cr) {
        return this.runner($$dpth, (log) => {
            if (log)
                log('ATOM_1');
            let val;
            let res = null;
            if (true
                && this.match_($$dpth + 1, cr) != null
                && (val = this.matchINT($$dpth + 1, cr)) != null
                && this.match_($$dpth + 1, cr) != null)
                res = new ATOM_1(val);
            return res;
        }, cr)();
    }
    matchATOM_2($$dpth, cr) {
        return this.runner($$dpth, (log) => {
            if (log)
                log('ATOM_2');
            let val;
            let res = null;
            if (true
                && this.match_($$dpth + 1, cr) != null
                && this.regexAccept(String.raw `\(`, $$dpth + 1, cr) != null
                && (val = this.matchSUM($$dpth + 1, cr)) != null
                && this.regexAccept(String.raw `\)`, $$dpth + 1, cr) != null
                && this.match_($$dpth + 1, cr) != null)
                res = new ATOM_2(val);
            return res;
        }, cr)();
    }
    matchINT($$dpth, cr) {
        return this.runner($$dpth, (log) => {
            if (log)
                log('INT');
            let val;
            let res = null;
            if (true
                && (val = this.regexAccept(String.raw `[0-9]+`, $$dpth + 1, cr)) != null)
                res = new INT(val);
            return res;
        }, cr)();
    }
    match_($$dpth, cr) {
        return this.regexAccept(String.raw `\s*`, $$dpth + 1, cr);
    }
    parse() {
        const mrk = this.mark();
        const res = this.matchSUM(0);
        if (res && this.finished())
            return new ParseResult(res, null);
        this.reset(mrk);
        const rec = new ErrorTracker();
        this.matchSUM(0, rec);
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
