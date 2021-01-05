#!/usr/bin/env node

import * as fs from "fs";
import * as yargs from "yargs";
import { SyntaxErrs, buildParser } from "./gen";
import { CheckError } from "./checks";

// TODO format syntax errors better

yargs.command("$0 <grammar> <output_file>", "build parser from grammar",
    _yargs => _yargs.options({
        "num-enums": {
            type: "boolean",
            default: false,
            desc: "Use numeric enums for AST kinds",
        },
    }),
    argv => {
        const grammarFile = argv.grammar as string;
        const outputFile = argv.output_file as string;
        try {
            const inGram = fs.readFileSync(grammarFile, { encoding: "utf8" });
            const parser = buildParser(inGram, argv["num-enums"]);
            fs.writeFileSync(outputFile, parser);
        } catch(err) {
            process.exitCode = 1;
            if(err instanceof CheckError) {
                console.error(err.message);
            } else if(err instanceof SyntaxErrs) {
                for(const se of err.errs)
                    console.log(se.toString());
            } else {
                console.error(err);
            }
        }
    })
    .strict()
    .scriptName("tspeg")
    .help()
    .parse();
