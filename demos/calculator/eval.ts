import * as Parser from './parser';

export function evaluate(input : Parser.SUM) : number {
    return calcSum(input);
}

function calcInt(at : Parser.INT) : number {
    return parseInt(at.val);
}

function calcAtom(at : Parser.ATOM) : number {
    if(at.kind === Parser.ASTKinds.ATOM_1)
        return calcInt(at.val);
    return calcSum(at.val);
}

function calcFac(at : Parser.FAC) : number {
    return at.tail.reduce((x, y) => {
        if(y.op === '*')
            return x * calcAtom(y.sm);
        return x / calcAtom(y.sm);
    }, calcAtom(at.head));
}

function calcSum(at : Parser.SUM) : number {
    return at.tail.reduce((x, y) => {
        if(y.op === '+')
            return x + calcFac(y.sm);
        return x - calcFac(y.sm);
    }, calcFac(at.head));
}
