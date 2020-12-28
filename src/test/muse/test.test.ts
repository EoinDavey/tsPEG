import { parse } from "./parser";

// Just ensure they all parse

test("test parser", () => {
    interface TestCase { inp: string }
    const tcs: TestCase[] = [
        {
            inp: `melody main start
    play (four cmaj)
    play (four gmaj)
    play (four dmaj)
    play (four emin)
end

melody cmaj start
    play (overlay (Piano C4) (Piano E4) (Piano G4))
end

melody gmaj start
    play (overlay (Piano G4) (Piano B4) (Piano D4))
end

melody dmaj start
    play (overlay (Piano D4) (Piano Gb4) (Piano A4))
end

melody emin start
    play (overlay (Piano E4) (Piano G4) (Piano B4))
end

melody four x start
    play (repeat x 4)
end`,
        },
        {
            inp: `melody main start
    play (overlay progression drumBeat)
end

melody progression start
    play (four cmaj)
    play (four gmaj)
    play (four dmaj)
    play (four emin)
end

melody drumBeat start
    for i from 1 to 16
        if i % 4 == 0 then
            play Kick
        else if i % 2 == 0 then
            play Snare
        else
            wait 1
        end end
    end
end

melody four x start
    play (repeat x 4)
end

melody cmaj start
    play (overlay (Piano C4) (Piano E4) (Piano G4))
end

melody gmaj start
    play (overlay (Piano G4) (Piano B4) (Piano D4))
end

melody dmaj start
    play (overlay (Piano D4) (Piano Gb4) (Piano A4))
end

melody emin start
    play (overlay (Piano E4) (Piano G4) (Piano B4))
end`,
        },
        {
            inp: `melody a start
    play (fib 9)
end

melody fib n start
    a = 0
    b = 1
    for i from 1 to n
        play (Sine 220 + 20 * a)
        b = a + b
        a = b - a
    end
end`,
        },
        {
            inp: `melody a start
    play (fib 9)
end

melody fib n start
    a = 0
    b = 1
    for i from 1 to n
        play (Sine 220 + 20 * a)
        b = a + b
        a = b - a
    end
end`,
        },
        {
            inp: `melody A start
    play (Fib 10 0 1)
end

melody Fib n a b start
    if n then
        play (Sine 220 + a)
        play (Fib (n-1) (a+b) a)
    end
end`,
        },
        {
            inp: `melody a start
    play (overlay b c d)
end

melody b start
    play (Piano C4)
    play (Piano G4)
    play (Piano D4)
end

melody c start
    play (Piano E4)
    play (Piano B4)
    play (Piano Gb4)
end

melody d start
    play (Piano G4)
    play (Piano D4)
    play (Piano A4)
end`,
        },
    ];
    for (const tc of tcs) {
        const res = parse(tc.inp);
        expect(res.err).toBeNull();
        expect(res.ast).not.toBeNull();
    }
});
