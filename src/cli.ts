#!/usr/bin/env node

import * as fs from "fs";
import * as yargs from "yargs";
import { SyntaxErrs, buildParser } from "./gen";
import { CheckError } from "./checks";

// TODO format syntax errors better

function validateRegexFlags(regexFlags: string): void {
    for(const flag of regexFlags)
        if(!"gimus".includes(flag))
            throw new Error(`--regex-flags must only contain valid regex flags: unexpected ${flag}`);
}

function validateIncludeGrammarFlag(includeGrammar: boolean, s: string): void {
    if(!includeGrammar)
        return;

    if(s.includes('*/'))
        throw new Error("--include-grammar-comment must be false when grammar contains the sequence '*/'");
}

yargs.command("$0 <grammar> <output_file>", "build parser from grammar",
    _yargs => _yargs.options({
        "num-enums": {
            type: "boolean",
            default: false,
            desc: "Use numeric enums for AST kinds",
        },
        "enable-memo": {
            type: "boolean",
            default: false,
            desc: "Enable memoisation, get better performance for increased memory usage",
        },
        "include-grammar-comment": {
            type: "boolean",
            default: true,
            desc: "Include the input grammar as a comment at the start of the parser file.",
        },
        "regex-flags": {
            type: "string",
            default: "",
            desc: "Additional regex flags to be supplied to regex literals. e.g. " +
                "--regexFlags=u will enable unicode support",
        },
    }),
    argv => {
        const grammarFile = argv.grammar as string;
        const outputFile = argv.output_file as string;
        const regexFlags = argv["regex-flags"];
        const includeGrammar = argv["include-grammar-comment"];
        try {
            validateRegexFlags(regexFlags);
            const inGram = fs.readFileSync(grammarFile, { encoding: "utf8" });
            validateIncludeGrammarFlag(includeGrammar, inGram);
            const parser = buildParser(inGram, argv["num-enums"], argv["enable-memo"], regexFlags, includeGrammar);
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
