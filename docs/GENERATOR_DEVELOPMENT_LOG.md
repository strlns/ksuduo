# Generator development log

## Current implementation

- `generator.ts` is the shared worker/synchronous entry point: validate options,
  generate, reject a non-unique final puzzle or an exceeded technique ceiling,
  and report the achieved grade and retained clue count.
- `generateFullSolution.ts` builds a complete solution with randomized backtracking
  and row/column/box masks. The model's compatibility methods use this constructor
  too; there is no separate restart-until-lucky implementation.
- `generatorLogical.ts` tries removing each clue once, rolling back unless a full
  logical solve succeeds. Up to three attempts prefer the requested grade, then
  fewer clues. Randomness uses a seed-controllable Fisher–Yates shuffle.
- `logical.ts` is the single candidate/technique engine for generation, grading,
  hints and partial-solution diagnostics. Grading is deterministic; hints choose
  freely among unit-only-place explanations before cell-only singles.
- Final uniqueness uses the independent backtracker. The explicit saved-solution
  fallback remains for older games outside the supported technique library.

| Level (saved ID) | Technique ceiling |
| --- | --- |
| Easiest (3) | Naked singles |
| Easy (0) | Also hidden singles |
| Medium (1) | Also locked candidates: pointing and claiming |
| Hard (2) | Also naked pairs |

## Next possible steps

- Measure clue-target and requested-grade success over a larger fixed-seed corpus
  before changing search heuristics or adding retries. Keep ceiling/uniqueness
  checks and honest achieved-rating messages.
- Add hidden pairs/triples or X-wing only with independent elimination fixtures,
  difficulty-boundary tests and a visual explanation.
- Add cancellation/cooperative yielding; synchronous fallback can block the UI.
- Distinguish search-budget exhaustion from unsatisfiability in solver diagnostics.
- Expand real-device iOS/Android keyboard and hint/notes replay tests. Browser
  emulation does not verify native keyboard behavior.

## Notes: implemented fixes

- Replaced heuristic-only difficulty with complete logical-solvability checks and
  an achieved rating; difficulty is specific to this app's technique library.
- Added a production final uniqueness rejection for every mode and missed-target
  result; development assertions are not safety gates.
- Replaced defective indirect scanning with unit-intersection locked candidates;
  added correct naked singles and naked pairs with candidate-elimination hints.
- Fixed acceptance of conflicting givens and explicit search-budget exhaustion;
  retained exhaustive default solving for compatibility with valid hard fixtures.
- Retained the ambiguous 6/7 rectangle and captured diagnostic board as regression
  tests. The historical false positive was constructed; no ambiguous final
  gameplay generation run was reproduced before the fix.
- Replaced unbounded legacy seed generation and mutable best-board aliases with
  the current shared constructor and cloned results.
- Removed the obsolete constraint/human generators, defective human solver,
  candidate pickers, unused scan/dispatch helpers and dead solver counters.
  Terminal diagnostics now test the current implementations and still draw boards.
- Preserved regression seeds while redirecting generator tests to the current
  public entry point; partial-solution tests use the shared logical engine.
- Fixed a diagnostic that shadowed its sampled puzzle and silently resampled it.
- Kept the conservative singles predicate only for historical regression checks;
  it is not a gameplay uniqueness shortcut.
- Stopped deterministic unit-single scans at their first usable result; gameplay
  retains all alternatives. Eight seeded cases retained identical puzzles/grades.
- Paired hint foreground/background styles so source/target overlays cannot make
  digits dark-on-dark; browser contrast checks measured 8.32:1.

## Notes: caveats and experiments

- Requested grade and clue count are best-effort. A level is a ceiling, not a
  guarantee the returned puzzle needs its strongest permitted technique.
- Randomized DFS is not uniform sampling; puzzles need not be minimal or symmetric.
- Unit-first versus cell-first re-rating matched in all 12 sampled puzzles (seeds
  1/4/14, four levels, 24 clues, one attempt); both matched 8 requested grades.
  No evidence justified changing grading order to match hint presentation.
- A second removal pass changed no clue counts or grades in 12 sampled cases
  (seeds 4/14/42, same settings); it was not adopted. Small samples do not prove
  retries can never help.
- Crypto randomness was not adopted: it does not address constraint-search quality.
- Timing samples were noisy; no speed guarantee is claimed.
- Preserve class cloning, existing saves, worker probing and synchronous fallback.
  Notes are separate user annotations; the solver does not trust them.

## Validation

Run `npm test`, `npm run test:legacy`, and `npm run build` locally. Pages runs
installation, typechecking and the build, not the test suite. Retain the ambiguous
fixtures, known-solution partial checks, seeded replay, logical-level boundaries
and final-return rejection tests when extending or refactoring the engine.
