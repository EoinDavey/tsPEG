# Overview

This example uses the & operator to match **but not consume** input, allowing us to match a context sensitive language.

This parser matches any sequence like 'aaaabbbbcccc'' where the number of a's, b's and c's are
all equal.
e.g. We want to match 'aabbcc', 'aaabbbccc' but not 'aaaaabbc' or 'aaabbb'.
This set of strings is not a context-free language
(See [Pumping Lemma](https://en.wikipedia.org/wiki/Pumping_lemma_for_context-free_languages))
but we can still define a parser for it by using the lookahead operator &.

# Running
- `tspeg grammar.peg parser.ts` to generate the parser.
- `tsc -p .` to compile.
- `node jsbuild/test.js` to run tests.
