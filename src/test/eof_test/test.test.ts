import { parse } from "./parser";

test("Verify $EOF error returns", () => {
    const res = parse("abcdefghi");
    expect(res.err).not.toBeNull();
    expect(res.err!.expmatches.map(x => x.kind)).toEqual(["EOF"]);
});
