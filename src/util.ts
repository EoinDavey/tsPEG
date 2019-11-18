export interface Block extends Array<string | Block> { };

export function indentBlock(blk : string[]) : string[] {
    return blk.filter(x => x).map(x => '    '+x);
}

export function writeBlock(blk : Block) : string[] {
    let res : string[] = [];
    for(let x of blk){
        if(typeof x === "string"){
            res.push(x);
            continue;
        }
        const sub = indentBlock(writeBlock(x));
        res.push(...sub);
    }
    return res;
}
