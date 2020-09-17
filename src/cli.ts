#!/usr/bin/env node

import * as fs from "fs";
import * as yargs from "yargs";

import { buildParser } from "./gen";

yargs.command("$0 <grammar> <output_file>", "build parser from grammar",
        {},
        argv => {
            const grammarFile = argv.grammar as string;
            const outputFile = argv.output_file as string;
            try {
                const inGram = fs.readFileSync(grammarFile, { encoding: "utf8" });
                const parser = buildParser(inGram);
                fs.writeFileSync(outputFile, parser);
            } catch(err) {
                process.exitCode = 1;
                console.error(err);
            }
        })
    .strict()
    .scriptName("tspeg")
    .help()
    .parse();
