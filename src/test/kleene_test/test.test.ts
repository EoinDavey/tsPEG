import { parse } from "./parser";

describe('nested kleene stars', () => {

    test('will terminate', () => {
        expect(parse('aaa').errs).toEqual([]);
        expect(parse('').errs).toEqual([]);
    });
});
