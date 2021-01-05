import { parse } from "./parser";

test("Verify $EOF error returns", () => {
    const res = parse("abcdefghi");
    expect(res.errs).toHaveLength(1);
    expect(res.errs[0].expmatches.map(x => x.kind)).toEqual(["EOF"]);
});
