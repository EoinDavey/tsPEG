import { evaluate } from './eval';
import { parse } from './parser';

import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question('', (s) => {
    const tree = parse(s);
    if(tree.errs.length > 0 || tree.ast === null) {
        for(const err of tree.errs){
            console.error(err.toString());
        }
    } else {
        console.log(evaluate(tree.ast));
    }
    rl.close();
});
