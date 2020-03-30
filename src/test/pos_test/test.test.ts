import { parse, Parser, EXPR } from "./parser";

function traverse(e: EXPR): [number[], number[]] {
    const ret = [[e.strt.overallPos], [e.end.overallPos]] as [number[], number[]];
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

test("test positions", () => {
    interface TestCase { inp: string; starts: number[]; ends: number[] };
    const tcs: TestCase[] = [
        {
            inp: "()",
            starts: [0],
            ends: [2]
        },
        {
            inp: "()()()",
            starts: [0, 2, 4],
            ends: [2, 4, 6]
        },
        {
            inp: "(()())",
            starts: [0, 1, 3],
            ends: [3, 5, 6]
        }
    ];
    for (const tc of tcs) {
        const res = parse(tc.inp);
        expect(res.err).toBeNull();
        expect(res.ast).not.toBeNull();

        const [starts, ends] = traverse(res.ast!);

        expect(tc.starts.sort()).toEqual(starts.sort());
        expect(tc.ends.sort()).toEqual(ends.sort());
    }
})
