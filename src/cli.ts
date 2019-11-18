#!/usr/bin/env node

import * as fs from 'fs';

import { buildParser } from './gen';

const [,, ...args] = process.argv;

function run() {
    if(args.length != 2) {
        console.error('Usage cli <input file> <output file>');
        process.exitCode = 1;
        return;
    }
    const inGram = fs.readFileSync(args[0], { encoding: 'utf8' });
    const parser = buildParser(inGram);
    fs.writeFileSync(args[1], parser);
}

run();
