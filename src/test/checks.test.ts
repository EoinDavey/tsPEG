import { buildParser } from "../gen";

test("Check banned names", () => {
    const inp = "rule := kind='hello world'";
    expect(() => buildParser(inp, false))
        .toThrow("'kind' is not an allowed match name");
});
