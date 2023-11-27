# Overview

Example implementation of a CLI app which takes an expression
like '(10+2) / 4' and outputs the answer.

- `grammar.gram`: The tsPEG grammar specification.
- `eval.ts`: Functions for evaluating the parse tree.
- `cli.ts`: CLI wrapper.

# Running

- Run `tspeg grammar.gram parser.ts` to generate the parser.
- `tsc -p .` to compile the project.
- `node jsbuild/cli.js` to execute.
