import { parse } from "./parser";

describe("Fixed Repetition", () => {
    test("Too Short", () => {
        const res = parse("a");
        expect(res.ast).toBeNull();
        expect(res.errs).not.toHaveLength(0);
    });
    test("Too Long", () => {
        const res = parse("aaa");
        expect(res.ast).toBeNull();
        expect(res.errs).not.toHaveLength(0);
    });
    test("Exact Length", () => {
        const res = parse("aa");
        expect(res.ast).not.toBeNull();
        expect(res.errs).toHaveLength(0);
    });
});

describe("Only Lower Bound", () => {
    test("Too Short", () => {
        const res = parse("bb");
        expect(res.ast).toBeNull();
        expect(res.errs).not.toHaveLength(0);
    });
    test("Long is Ok", () => {
        const res = parse("bbbbbb");
        expect(res.ast).not.toBeNull();
        expect(res.errs).toHaveLength(0);
    });
    test("Exact Length", () => {
        const res = parse("bbb");
        expect(res.ast).not.toBeNull();
        expect(res.errs).toHaveLength(0);
    });
});

describe("Lower and Upper Bound", () => {
    test("Too Short", () => {
        const res = parse("cc");
        expect(res.ast).toBeNull();
        expect(res.errs).not.toHaveLength(0);
    });
    test("Too Long", () => {
        const res = parse("cccccc");
        expect(res.ast).toBeNull();
        expect(res.errs).not.toHaveLength(0);
    });
    test("Exact Lower Bound", () => {
        const res = parse("ccc");
        expect(res.ast).not.toBeNull();
        expect(res.errs).toHaveLength(0);
    });
    test("Exact Upper Bound", () => {
        const res = parse("ccccc");
        expect(res.ast).not.toBeNull();
        expect(res.errs).toHaveLength(0);
    });
    test("Between Bounds", () => {
        const res = parse("cccc");
        expect(res.ast).not.toBeNull();
        expect(res.errs).toHaveLength(0);
    });
});
