import { parse } from "./parser";

test.each([
    "a",
    "aaaaaaaa",
    "bb",
    "bab",
])('%p', inp => {
    const res = parse(inp);
    expect(res.errs).toEqual([]);
    expect(res.ast).not.toBeNull();
});
