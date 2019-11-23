"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Parser = require("./parser");
function evaluate(input) {
    const p = new Parser.Parser(input);
    const tree = p.parse();
    if (tree.err === null && tree.ast)
        return calcSum(tree.ast);
    console.log('' + tree.err);
    return null;
}
exports.evaluate = evaluate;
function calcInt(at) {
    return parseInt(at.val);
}
function calcAtom(at) {
    if (at.kind === Parser.ASTKinds.ATOM_1)
        return calcInt(at.val);
    return calcSum(at.val);
}
function calcFac(at) {
    return at.tail.reduce((x, y) => {
        if (y.op === '*')
            return x * calcAtom(y.sm);
        return x / calcAtom(y.sm);
    }, calcAtom(at.head));
}
function calcSum(at) {
    return at.tail.reduce((x, y) => {
        if (y.op === '+')
            return x + calcFac(y.sm);
        return x - calcFac(y.sm);
    }, calcFac(at.head));
}
