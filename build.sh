#!/bin/bash

set -e

tsc

for dir in src/test/*; do
    echo $dir
    if ! [[ -d $dir ]]; then
        continue
    fi
    if ! [[ -f $dir/grammar.peg ]]; then
        continue
    fi
    node ./tsbuild/cli.js $dir/grammar.peg $dir/parser.ts
done;
