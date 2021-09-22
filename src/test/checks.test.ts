import { buildParser } from "../gen";

test("Check banned names", () => {
    const inp = "rule := kind='hello world'";
    expect(() => buildParser(inp, false, false, ""))
        .toThrow("'kind' is not an allowed match name");
});

test("Check rules exist checker", () => {
    const inp = "rule := a=rule2";
    expect(() => buildParser(inp, false, false, ""))
        .toThrow("Rule 'rule2' is not defined");
});

test("Check rule collision checker for alternatives", () => {
    const inp = `rule := 'a' | 'b'
    rule_1 := 'c'`;
    expect(() => buildParser(inp, false, false, ""))
        .toThrow('Rule "rule" declared with >= 1 alternatives and rule "rule_1" should not both be declared');
});

test("Check rule collision checker for double definition", () => {
    const inp = `rule := 'a' | 'b'
    rule := 'a' | 'b'`;
    expect(() => buildParser(inp, false, false, ""))
        .toThrow('Rule already defined: "rule"');
});
