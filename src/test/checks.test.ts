import { buildParser } from "../gen";

test("Check banned names", () => {
    const inp = "rule := kind='hello world'";
    expect(() => buildParser(inp, false))
        .toThrow("'kind' is not an allowed match name");
});

test("Check rules exist checker", () => {
    const inp = "rule := a=rule2";
    expect(() => buildParser(inp, false))
        .toThrow("Rule 'rule2' is not defined");
});
