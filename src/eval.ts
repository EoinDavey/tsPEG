import * as Parser from './arith';

export function evaluate(input : string) : number | null {
    const p = new Parser.Parser(input);
    const tree = p.parse();
    if(tree.err === null && tree.ast)
        return tree.ast.accept(EvVis);
    console.log('' + tree.err);
    return null;
}

export const EvVis : Parser.Visitor<number> = {
    visitInt: function(i : Parser.Int) : number {
        return parseInt(i.val.match);
    },

    visitAtom_1: function(at : Parser.Atom_1) : number {
        return at.val.accept(this);
    },

    visitAtom_2: function(at : Parser.Atom_2) : number {
        return at.val.accept(this);
    },

    visitSum: function(sum : Parser.Sum) : number {
        const x = sum.head.accept(this);
        return sum.tail.reduce((res, cur) : number => {
            const val = cur.sm.accept(this);
            if(cur.op.match === '+')
                return res + val;
            return res - val;
        }, x);
    },

    visitFac: function(fac : Parser.Fac) : number {
        const x = fac.head.accept(this);
        return fac.tail.reduce((res, cur) : number => {
            const val = cur.at.accept(this);
            if(cur.op.match === '*')
                return res * val;
            return res / val;
        }, x);
    }
}
