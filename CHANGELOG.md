# Changelog

## 1.3.0 - 2020/03/30

### Added

- Documentation update.
- Compile time regex correctness check.
- Export parse function, don't always require explicit `Parser` instantiation.
- Add test() function to `Parser`, only checks if grammar matches, doesn't return AST.
- Add special `@` rule for storing parser position on AST.
- Add lots of tests.

### Fixed

- CLI usage messages
