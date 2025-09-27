#!/usr/bin/env node

import * as fs from "fs";
import path from "path";
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

async function main() {
    // We have to use dynamic import for yargs as it only supports ESM and we
    // are currently exporting to CSM. This is not required for high enough
    // node version but this works too.
    const yargsPackage = await import("yargs");
    const helpersPackage = await import('yargs/helpers');

    const yargs = yargsPackage.default;
    const { hideBin } = helpersPackage;

    yargs(hideBin(process.argv))
      .command("$0 <grammar> [output_file]", "Build parser from grammar",
        _yargs => {
            _yargs.positional('grammar', {
                describe: 'Grammar input file',
                type: 'string',
            }).positional('output_file', {
                describe: 'Output file: If provided write the generated parser to this file, otherwise output to stdout.',
                type: 'string',
            });
            return _yargs.options({
                "num-enums": {
                    type: "boolean",
                    default: false,
                    desc: "Use numeric enums for AST kinds",
                },
                "erasable-syntax": {
                    type: "boolean",
                    default: false,
                    desc: "Ensures the generated parser compiles under --erasableSyntaxOnly compiler flag. For example, uses string or number constants instead of an enum for AST kinds. See https://www.typescriptlang.org/tsconfig/#erasableSyntaxOnly.",
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
                        "--regex-flags=u will enable unicode support",
                },
            });
        },
        argv => {
            const grammarFile = argv.grammar as string;
            const outputFile = argv.output_file as string | undefined;
            const regexFlags = argv["regex-flags"];
            const includeGrammar = argv["include-grammar-comment"];
            try {
                validateRegexFlags(regexFlags);
                const inGram = fs.readFileSync(grammarFile, { encoding: "utf8" });
                validateIncludeGrammarFlag(includeGrammar, inGram);
                const parser = buildParser(inGram, argv["num-enums"], argv["enable-memo"], regexFlags, includeGrammar, argv["erasable-syntax"]);
                if(outputFile !== undefined) {
                    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
                    fs.writeFileSync(outputFile, parser);
                } else {
                    process.stdout.write(parser);
                }
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
}

main().catch(error => {
    console.error(`An error occured: ${error}`);
    process.exit(1);
});
