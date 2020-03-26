import { parse } from "./parser";

test("test calculator", () => {
    interface TestCase { inp: string, exp: number };
    const tcs: TestCase[] = [
        { inp: "1+2", exp: 3 },
        { inp: " 1 + 2 ", exp: 3 },
        { inp: "1 * 2 - 3", exp: -1 },
        { inp: "2 * (2 - 3)", exp: -2 },
        { inp: "54 * 30 - 4098 * 17 + 34 * 4", exp: -67910 },
    ];
    for (const tc of tcs) {
        const res = parse(tc.inp);
        expect(res.err).toBeNull();
        expect(res.ast).not.toBeNull();
        const ast = res.ast!;
        expect(ast.value).toEqual(tc.exp);
    }
})
