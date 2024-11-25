import { parse } from './parser';

import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const variables = new Map<string, number>();

rl.on('line', (s) => {
    if(s === 'exit') {
        rl.close();
        return;
    }
    try {
        const tree = parse(s, variables);
        if(tree.errs.length > 0 || tree.ast === null) {
            for(const err of tree.errs){
                console.error(err.toString());
            }
        } else {
            console.log(tree.ast.value);
        }
    }
    catch(e: any) {
        console.log(e.toString());
    }
});
