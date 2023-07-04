import { parse } from "./parser";

test(`Multiline test: Positive`, () => {
    const res = parse(`line 1
line 2`);
    expect(res.errs).toEqual([]);
    expect(res.ast).not.toBeNull();
});

test(`Multiline test: Negative`, () => {
    const res = parse("line 1 line 2");
    expect(res.ast).toBeNull();
    expect(res.errs).not.toHaveLength(0);
});
