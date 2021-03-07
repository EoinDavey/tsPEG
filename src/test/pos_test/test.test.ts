import { EXPR, PosInfo, parse } from "./parser";

function comp(a: number, b: number): number {
    if(a < b)
        return -1;
    if(a === b)
        return 0;
    return 1;
}
function posSort(a: PosInfo, b: PosInfo): number {
    if(a.overallPos !== b.overallPos)
        return comp(a.overallPos, b.overallPos);
    if(a.line !== b.line)
        return comp(a.line, b.line);
    return comp(a.offset, b.offset);
}

function traverse(e: EXPR): [PosInfo[], PosInfo[]] {
    const ret = [[e.strt], [e.end]] as [PosInfo[], PosInfo[]];
    if (e.left) {
        const t = traverse(e.left);
        ret[0] = ret[0].concat(t[0]);
        ret[1] = ret[1].concat(t[1]);
    }
    if (e.right) {
        const t = traverse(e.right);
        ret[0] = ret[0].concat(t[0]);
        ret[1] = ret[1].concat(t[1]);
    }
    return ret;
}

describe("test positions", () => {
    interface TestCase { inp: string; starts: PosInfo[]; ends: PosInfo[] }
    const tcs: TestCase[] = [
        {
            inp: "()",
            starts: [
                {
                    overallPos: 0,
                    line: 1,
                    offset: 0,
                },
            ],
            ends: [
                {
                    overallPos: 2,
                    line: 1,
                    offset: 2,
                },
            ],
        },
        {
            inp: "()()()",
            starts: [
                {
                    overallPos: 0,
                    line: 1,
                    offset: 0,
                },
                {
                    overallPos: 2,
                    line: 1,
                    offset: 2,
                },
                {
                    overallPos: 4,
                    line: 1,
                    offset: 4,
                },
            ],
            ends: [
                {
                    overallPos: 2,
                    line: 1,
                    offset: 2,
                },
                {
                    overallPos: 4,
                    line: 1,
                    offset: 4,
                },
                {
                    overallPos: 6,
                    line: 1,
                    offset: 6,
                },
            ],
        },
        {
            inp: "(()())",
            starts: [
                {
                    overallPos: 0,
                    line: 1,
                    offset: 0,
                },
                {
                    overallPos: 1,
                    line: 1,
                    offset: 1,
                },
                {
                    overallPos: 3,
                    line: 1,
                    offset: 3,
                },
            ],
            ends: [
                {
                    overallPos: 3,
                    line: 1,
                    offset: 3,
                },
                {
                    overallPos: 5,
                    line: 1,
                    offset: 5,
                },
                {
                    overallPos: 6,
                    line: 1,
                    offset: 6,
                },
            ],
        },
        {
            inp: `
()

 ()`,
            starts: [
                {
                    overallPos: 1,
                    line: 2,
                    offset: 0,
                },
                {
                    overallPos: 6,
                    line: 4,
                    offset: 1,
                },
            ],
            ends: [
                {
                    overallPos: 3,
                    line: 2,
                    offset: 2,
                },
                {
                    overallPos: 8,
                    line: 4,
                    offset: 3,
                },
            ],
        },
    ];
    for (const tc of tcs) {
        test(`inp: ${tc.inp}`, () => {
            const res = parse(tc.inp);
            expect(res.errs).toEqual([]);
            expect(res.ast).not.toBeNull();

            const [starts, ends] = traverse(res.ast!);

            expect(tc.starts.sort(posSort)).toEqual(starts.sort(posSort));
            expect(tc.ends.sort(posSort)).toEqual(ends.sort(posSort));
        });
    }
});
