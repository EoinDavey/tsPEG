import { parse } from "./parser";

// Just ensure they all parse

test("test calculator", () => {
    interface TestCase { inp: string }
    const tcs: TestCase[] = [
        {
            inp: `masses := []
nuair-a fíor {
    l := léigh_líne()
    má !l
        bris
    masses = masses + [go_uimh(l)]
}

gníomh cuida() {
    sm := 0
    le i idir (0, fad(masses)) {
        mass := masses[i]
        sm = sm + (mass - mass%3)/3 - 2
    }
    toradh sm
}

gníomh cuidb() {
    sm := 0
    le i idir (0, fad(masses)) {
        mass := masses[i]
        mass = (mass - mass%3)/3 - 2
        nuair-a mass > 0 {
            sm = sm + mass
            mass = (mass - mass%3)/3 - 2
        }
    }
    toradh sm
}

scríobh('Cuid A', cuida())
scríobh('Cuid B', cuidb())`,
        },
        {
            inp: `mns := [
    [-7,17,-11],
    [9, 12, 5],
    [-9, 0, -4],
    [4, 6, 0]
]

vs := [
    [0,0,0],
    [0,0,0],
    [0,0,0],
    [0,0,0]
]

gníomh ad(x, y) {
    n := []
    le i idir (0, fad(y))
        n = n + [x[i] + y[i]]
    toradh n
}

gníomh cmp(x, y) {
    má x == y
        toradh 0
    má x > y
        toradh -1
    toradh 1
}

gníomh abs(x) {
    má x > 0
        toradh x
    toradh -1 * x
}

gníomh gcd(a, b) {
    nuair-a b != 0 {
        t := a % b
        a = b
        b = t
    }
    toradh a
}

le t idir (0, 1000) {
    le a idir (0, 4){
        le b idir (0, a) {
            le i idir (0, 3) {
                df := cmp(mns[a][i], mns[b][i])
                vs[a][i] = vs[a][i] + df
                vs[b][i] = vs[b][i] - df
            }
        }
    }
    le k idir (0, 4)
        mns[k] = ad(mns[k], vs[k])
}

sm := 0
le m idir (0, 4) {
    vsm := 0
    psm := 0
    le i idir(0, 3) {
        vsm = vsm + abs(vs[m][i])
        psm = psm + abs(mns[m][i])
    }
    sm = sm + vsm*psm
}
scríobh(sm)`,
        },
        {
            inp: `
línte := []
nuair-a fíor {
    líne := léigh_líne()
    má !líne
        bris
    línte = línte + [líne]
}
>-- Aimsigh eochair i liosta --<
gníomh ams(ls, k){
    le i idir (0, fad(ls))
        má ls[i] == k
            toradh i
}

grph := []
le i idir (0, fad(línte))
    grph = grph + [roinn(athchuir(athchuir(línte[i], ',', ''), '=> ', ''), ' ')]

>-- Eochracha --<
ecrcha := []
gníomh cuir_e(k){
    le i idir (0, fad(ecrcha))
        má ecrcha[i] == k
            bris
    ecrcha = ecrcha + [k]
}
cuir_e('ORE')
le i idir(0, fad(grph))
    cuir_e(grph[i][fad(grph[i])-1])
K := fad(ecrcha)

méad := [0]*K
adjLs := []
le i idir (0, K)
    adjLs = adjLs + [[]]

le i idir (0, fad(grph)){
    g := grph[i]
    ga := ams(ecrcha, g[fad(g)-1])
    gb := go_uimh(g[fad(g)-2])
    méad[ga] = gb
    le j idir(0, fad(g)) {
        má 2*j + 1 >= fad(g) - 2
            bris
        a := g[2*j]
        b := g[2*j+1]
        adjLs[ga] = adjLs[ga] + [[go_uimh(a), ams(ecrcha, b)]]
    }
}

feicthe := [breag]*K
ord := []
gníomh siul(u) {
    feicthe[u] = fíor
    ls := adjLs[u]
    le i idir (0, fad(ls)){
        v := ls[i][1]
        má !feicthe[v]
            siul(v)
    }
    ord = ord + [u]
}

siul(ams(ecrcha, 'FUEL'))

gníomh idiv(a, b) {
    toradh (a - (a % b))/b
}

gníomh reitigh(tgt) {
    reqs := [0]*K
    reqs[ams(ecrcha, 'FUEL')] = tgt
    ol := ams(ecrcha, 'ORE')
    le i idir (0, fad(ord)) {
        ind := fad(ord) - i - 1
        x := ord[ind]
        r := reqs[x]
        má x == ol
            toradh r
        m := méad[x]
        tms := idiv(r+m-1, m)
        le j idir (0, fad(adjLs[x]))
            reqs[adjLs[x][j][1]] = reqs[adjLs[x][j][1]] + tms * adjLs[x][j][0]
    }
}

TR := 1000000000000
L := 0
R := TR

nuair-a L < R {
    md := idiv(L+R+1,2)
    v := reitigh(md)
    má v > TR
        R = md -1
    nó
        L = md
}

scríobh('Cuid A')
scríobh(reitigh(1))
scríobh('Cuid B')
scríobh(L)`,
        },
        {
            inp: `
mvs := []

nuair-a fíor {
    líne := léigh_líne()
    má !líne
        bris
    mvs = mvs + [roinn(líne, ' ')]
}

gníomh iol(x, y, N) {
    a := x[0][0] b := x[0][1]
    c := x[1][0] d := x[1][1]
    e := y[0][0] f := y[0][1]
    g := y[1][0] h := y[1][1]
    toradh [
        [(a * e + b * g) % N, (a * f + b * h) % N],
        [(c * e + d * g) % N, (c * f + d * h) % N]
    ]
}

gníomh modPow(x, id, iolfn, n, N) {
    ans := [[1, 0], [0, 1]]
    nuair-a n {
        má n % 2 == 1
            ans = iol(ans, x, N)
        x = iol(x, x, N)
        n = (n - (n % 2))/2
    }
    toradh ans
}

gníomh ab(N) {
    a := 1
    b := 0
    le i idir (0, fad(mvs)) {
        mv := mvs[i]
        má mv[0] == 'cut' {
            b = (b - go_uimh(mv[1])) % N
        } nó má mv[1] == 'with' {
            n := go_uimh(mv[3])
            a = (n*a) % N
            b = (n*b) % N
        } nó {
            a = -a % N
            b = (- b - 1) % N
        }
    }
    toradh [a, b]
}

p := ab(10007)
scríobh('Cuid 1', (p[0]*2019 + p[1])%10007)`,
        },
        {
            inp: `
gníomh fac(x) {
    má x <= 1
        toradh 1
    toradh x * fac(x - 1)
}

scríobh(fac(10))`,
        },
        {
            inp: `s := 'test'

gníomh copy(arr) {
    nua := [fíor]*fad(arr)
    le i idir (0, fad(arr))
        nua[i] = arr[i]
    toradh nua
}

gníomh gen(ind, used, st) {
    má ind == fad(s)
        scríobh(st)
    le i idir (0, fad(s)) {
        má used[i]
            chun-cinn
        nused := copy(used)
        nused[i] = fíor
        gen(ind + 1, nused, st + s[i])
    }
}

gen(0, [breag]*fad(s), '')`,
        },
        {
            inp: `
>-- Comhair na uimhreacha phríomha
gníomh príómha(x) {
    má x <= 2
        toradh x == 2
    le i idir(2, x) {
        má i*i > x >-- Is feidir linn stad anseo --<
            bris
        má x % i == 0
            toradh breag
    }
    toradh fíor
}

le i idir (2, 100) {
    má príómha(i)
        scríobh(i)
}`,
        },
    ];
    for (const tc of tcs) {
        const res = parse(tc.inp);
        expect(res.errs).toEqual([]);
        expect(res.ast).not.toBeNull();
    }
});

/* TODO re-enable after Setanta update
test("Expect simple syntax error", () => {
    const prog = `x := [1, 2`;
    const res = parse(prog);
    expect(res.err).not.toBeNull();
    const expmatches = res.err!.expmatches;
    const regs: string[] = [];
    for(const match of expmatches) {
        expect(match.kind).toEqual("RegexMatch");
        regs.push((match as RegexMatch).literal);
    }
    expect(regs).toContain("\\]");
    expect(regs).toContain(",");
});
*/
