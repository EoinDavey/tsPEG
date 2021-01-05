import { parse } from "./parser";

import { Interpreter } from "setanta/node_build/i10r";

test("Run simple program", async () => {
    // Calculate 21 fibonacci numbers
    const fibProg = `fib := [0, 1]
le i idir (0, 20)
    fib += [fib[fad@fib - 2] + fib[fad@fib - 1]]
res := fib[fad@fib - 1]
`;
    const res = parse(fibProg);
    expect(res.errs).toEqual([]);
    expect(res.ast).not.toBeNull();
    const i = new Interpreter();

    await i.interpret(res.ast!);

    // Expect result to be 10946, the fibonacci number
    expect(i.global.env.getGlobalValDirect("res")).toEqual(10946);
});

