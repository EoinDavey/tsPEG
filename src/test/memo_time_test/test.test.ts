import { parse } from "./parser";

// With memo working, this parse is trivial and completes instantly.
// E(time) < 5ms
// If memo isn't working, it takes exponentially longer for each bracket
// E(time) > 200ms.
// We fail if the time taken is > 50ms
test("parse completes in time", () => {
    const start = new Date();
    const res = parse('((100))');
    expect(res.errs.length).toEqual(0);
    expect(res.ast).not.toBeNull();
    expect(res.ast!.value).toEqual(100);
    const end = new Date();
    expect(end.getTime() - start.getTime()).toBeLessThan(50);
});
