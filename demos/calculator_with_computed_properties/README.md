# Overview

This demo is functionally the same as the `calculator` but uses computed properties
to compute the expressions value rather than separate evaluation functions. All of
the computation logic is included in grammar.gram

# Running

- Run `tspeg grammar.gram parser.ts` to generate the parser.
- `tsc -p .` to compile the project.
- `node jsbuild/cli.js` to execute.
