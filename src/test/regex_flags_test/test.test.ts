import { parse } from './parser';

test.each([
    "hello",
    "goodbye",
    "OkIeDokEy",
])('test alpha unicode property: %s', input => {
    const res =  parse(input);
    expect(res.errs).toHaveLength(0);
    expect(res.ast).not.toBeNull();
});
