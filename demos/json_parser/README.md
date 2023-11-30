# Overview

This is an implementation of a JSON parser based on the
[RFC 4627](https://www.ietf.org/rfc/rfc4627.txt) specification of JSON. It is almost
a direct implementation of the grammar specified there so the RFC can be used to understand
the grammar file.

This grammar uses lots of tsPEG features including computed properties, the header
and regex modifiers.

## Running

You can generate the parser and run the test with:
1. `tspeg grammar.peg parser.ts`.
2. `tsc -p .`.
2. `node jsbuild/test.js`.
