#!/usr/bin/env node

import * as fs from "fs";

import { buildParser } from "./gen";

const [, , ...args] = process.argv;

function run() {
    if (args.length !== 2) {
        console.error("Usage tspeg <input file> <output file>");
        process.exitCode = 1;
        return;
    }
    try {
        const inGram = fs.readFileSync(args[0], { encoding: "utf8" });
        const parser = buildParser(inGram);
        fs.writeFileSync(args[1], parser);
    } catch(err) {
        process.exitCode = 1;
        console.error(err);
    }
}

run();
