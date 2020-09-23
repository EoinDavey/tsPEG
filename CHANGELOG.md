# Changelog

## [Unreleased]

### Added

- Special error is raised when EOF is not reached during parse.
- Numbers can now be used in names of IDs (not in first position).
- Added `num-enums` flag to specify numeric kind enums.

### Changed

- No longer need to use braces ({}) in code sections in computed properties.
- `mark` parser method is now public.
- Enums are now string valued by default.

### Fixed

- Bump lodash dependency from 4.17.15 to 4.17.19
- Name collision avoidance has been avoided.
- Type expressions no longer require whitespace in computed properties.

## 1.3.2 - 2020/07/11

### Fixed

- Add workaround for Safari/iOS/WebKit issues. See https://bugs.webkit.org/show_bug.cgi?id=214181
  for details on bug. 

## 1.3.1 - 2020/04/13

### Fixed

- Update typo in README
- Fix off-by-one error in position tracking

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
