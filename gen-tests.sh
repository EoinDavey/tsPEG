#!/bin/bash

set -e

for dir in src/test/*; do
    if ! [[ -d ${dir} ]]; then
        continue
    fi
    if ! [[ -f ${dir}/grammar.peg ]]; then
        continue
    fi
    if [[ -e ${dir}/flags.txt ]]; then
        node ./tsbuild/cli.js $(cat ${dir}/flags.txt) ${dir}/grammar.peg ${dir}/parser.ts
    else
        node ./tsbuild/cli.js ${dir}/grammar.peg ${dir}/parser.ts
    fi
done;
