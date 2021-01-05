# Changelog

## 3.0.1 - 2021/01/05

### Added

- Added support for left recursion (#17).

### Changed

- Add `$` symbol for matching EOF.
- Parsers no longer fail if EOF is not met (unless specified with `$`).
- `ParseResult` objects now return a list of `SyntaxErr`s.
- `SyntaxErr` objects now return more detailed `MatchAttempts` rather than just strings.

### Removed

- Removed useless expected rules computation (never worked properly).

## 3.0.0

Unpublished due to CI failures, can't be undone. All 3.0.0 changes are in 3.0.1

## 2.1.0 - 2020/09/29

### Added

- Added static checks for banned match names
- Added static checks for undefined rules (#13).

### Fixed

- Fixed template string support in code blocks
- Reduced size of npm package (#14).

## 2.0.1 - 2020/09/24

### Changed

- Updated README with latest docs + screenshots

## 2.0.0 - 2020/09/23

### Added

- Special error is raised when EOF is not reached during parse.
- Numbers can now be used in names of IDs (not in first position).
- Added `num-enums` flag to specify numeric kind enums.
- Support for C-style comments (#2)
- Add `--version` and `--help` CLI flags

### Changed

- No longer need to escape braces ({}) in code sections in computed properties. (#12)
- Type declarations for computed properties properly support whitespace. (#4)
- `mark` parser method is now public.
- Enums are now string valued by default. (#3)

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
