# Overview

This demo is similar to `calculator_with_computed_properties` but allow the usage
of variables. The variables are stored in a context object that is passed to the
parser. The demo also accepts multiple expressions, one per line. To exit the
demo, type `exit`:

```
test = 5 * 4
20
test + 3
23
exit
```

# Running

- Run `tspeg grammar.gram parser.ts` to generate the parser.
- `tsc -p .` to compile the project.
- `node jsbuild/cli.js` to execute.
