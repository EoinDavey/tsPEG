- Switch to typescript factory functions
- Document line matching better, maybe with a good demo.
- Get rid of command line default regex modifiers, the grammar.peg file should be self contained.
- Get rid of automatic alias rules, probably should introduce a specific aliasing syntax. This is
  because it's sometimes confusing whether a rule is going to get it's own `type` or not, meaning
  sometimes you're forced to give things named attributes even when they don't need them.
- Update naming scheme algorithm, looking at src/builder.ts you can see how obtuse it is.
