import { Parser, PosInfo } from './parser';

// ExposedParser exposes the memo tables as public for testing.
class ExposedParser extends Parser {
    public getSmemo(): Map<number, [unknown, PosInfo]> {
        return this.$scope$S$memo;
    }
    public getE0memo(): Map<number, [unknown, PosInfo]> {
        return this.$scope$E0$memo;
    }
    public getE1memo(): Map<number, [unknown, PosInfo]> {
        return this.$scope$E1$memo;
    }
    public getATOMmemo(): Map<number, [unknown, PosInfo]> {
        return this.$scope$ATOM$memo;
    }
    public getINTmemo(): Map<number, [unknown, PosInfo]> {
        return this.$scope$INT$memo;
    }
    public get_memo(): Map<number, [unknown, PosInfo]> {
        return this.$scope$_$memo;
    }
}

// This is a bad test, it is entirely based on testing implementation
// details. Easily broken if implementation changes, oh well.

test.each([
    "100",
    " 100 ",
    "50 * 2",
    "50 + 50",
    "100 + 50 + (100 - 50 * 3)",
])('test parse + memo works: %s', input => {
    // Strategy here is to parse input, make a copy of all memo tables
    // then for each entry in a memo table, clear the memo in the parser,
    // try the parse from scratch from the start position, and verify the
    // result is the same as the cached value.

    const prsr = new ExposedParser(input);
    // using match instead of parse to avoid memo reset.
    const res = prsr.matchS(0);
    expect(res).not.toBeNull();
    expect(res!.value).toEqual(100);

    // Using ts-ignore to access private fields.
    const memosAndFns: [[number, [unknown, PosInfo]][], () => unknown][] = [
        [[...prsr.getSmemo()], () => prsr.matchS(0)],
        [[...prsr.getE0memo()], () => prsr.matchE0(0)],
        [[...prsr.getE1memo()], () => prsr.matchE1(0)],
        [[...prsr.getATOMmemo()], () => prsr.matchATOM(0)],
        [[...prsr.getINTmemo()], () => prsr.matchINT(0)],
        [[...prsr.get_memo()], () => prsr.match_(0)],
    ];

    for(const [ls, fn] of memosAndFns) {
        for(const [start, [exp, end]] of ls) {
            prsr.clearMemos();

            // Abuse of implementation to reset position, line and
            // offset values will be wrong.
            prsr.reset({ overallPos: start, line: 1, offset: 0});

            const got = fn();
            expect(got).toEqual(exp);
            // We only check overallPos because of above abuse
            // of implementation. overallPos is the source of truth.
            expect(prsr.mark().overallPos).toEqual(end.overallPos);
        }
    }
});
