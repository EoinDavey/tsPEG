import { parse } from "./parser";

test("Verify $EOF error returns", () => {
    const res = parse("abcdefghi");
    expect(res.err).not.toBeNull();
    expect(res.err!.exprules).toEqual(["$EOF"]);
})
