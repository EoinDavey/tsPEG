import { parse } from "./parser";

test(`Case Test 1`, () => {
    const res = parse("SELECT from");
    expect(res.errs).toEqual([]);
    expect(res.ast).not.toBeNull();
});

test(`Case Test 2`, () => {
    const res = parse("SeLeCT fRoM");
    expect(res.errs).toEqual([]);
    expect(res.ast).not.toBeNull();
});
