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
  fewer clues. A bounded lower-tier-stall refinement can then improve easier Medium/Hard results (see the 2026-11-15 experiment). Randomness uses a seed-controllable Fisher–Yates shuffle.
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
- Added retained elimination notes, scoped/bulk annotation that respects current
  solver deductions, an expandable full explanation and fixed coordinate labels.
  Undo clears cell selection and focus; annotations remain separate from puzzle undo.
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

## 2026-11-14: difficulty hit-rate search experiment

Baseline: `bbced50`, Node 26, seeds 1–16, 28 requested clues, Medium and Hard.
Each run resets a 32-bit LCG: `state = (1664525 * state + 1013904223) mod 2^32`,
then divides by `2^32`; multiplication uses `Math.imul`. All shuffles and solution
construction use this stream. These are 16 trials per grade, not population estimates.

| Search | Medium matches | Hard matches | Mean Medium time | Mean Hard time |
| --- | ---: | ---: | ---: | ---: |
| Current, up to 3 attempts | 5/16 | 4/16 | 1.30 s | 1.29 s |
| Up to 3 attempts + 24 clue exchanges per attempt | 7/16 | 4/16 | 3.09 s | 3.41 s |
| Ordinary removal, up to 6 attempts | 8/16 | 5/16 | 2.15 s | 2.33 s |

Raw seed-by-seed observations: [grade-search.json](experiments/2026-11-14-grade-search.json).
Times measure generation including internal rating; independent validation is outside
that timer. These are single cloud measurements, without repetitions or phone timing.
The exchange and baseline runs were interleaved; the six-attempt control ran afterward.
All 96 results retained exactly 28 clues, passed independent `solveCheckUnique`, and
had a defined logical rating at or below the requested level.

- **Rejected experiment:** after ordinary removal, randomly restore an empty cell
  from the solution and remove a randomly selected existing clue. Keep the exchange
  only if the complete logical solve succeeds at the requested ceiling; otherwise
  restore the previous board. Stop at the requested rating or 24 exchanges, then
  use the existing best-of-three selection. This is a random walk, without a
  lower-grade monotonicity constraint or best-intermediate archive. Each loop also
  re-rates the puzzle, adding overhead. It does not improve Hard hit rate in this
  sample and loses to six ordinary attempts at both grades. Do not ship it.
- **Measured limitation:** ordinary generation only follows one irreversible clue
  removal path per attempt, stops at the clue target, and checks the achieved grade
  afterward. The ceiling prevents overly hard boards but does not steer toward the
  desired grade. This is a search limitation, not evidence of incorrect uniqueness.
- **Control, not a shipped change:** six attempts improve this sample modestly,
  especially Medium, but Hard still misses 11/16 times. More retries alone are not
  a sufficient search improvement. Production remains at three attempts.
- **Next scoped experiment:** retain the best intermediate puzzle and target clue
  exchanges around the cells where the next-lower technique tier stalls. Compare
  against ordinary restarts at equal elapsed-time budgets, using a separate seed
  set before adoption. Report hit rate, clue counts, median/tail runtime, and
  independent uniqueness/ceiling checks; retain ambiguous-board regression fixtures.
- Actual elapsed work (`performance.now()`) is the appropriate budget signal.
  Core count does not measure this worker's Sudoku throughput. Check deadlines
  between bounded operations, retain an iteration cap, and keep synchronous
  fallback conservative. A deadline checked between operations is not a hard
  interruption guarantee. No device benchmark or adaptive policy was added here.

## 2026-11-15: preserve the lower-tier stall during difficulty refinement

After the unchanged best-of-three search, Medium/Hard results below the requested
rating get one bounded refinement pass. It removes more clues while retaining a
complete solve at the ceiling. When the lower tier can no longer solve, it keeps
that intermediate and attempts to restore clues up to the original goal. Cells
already deducible by the lower tier are tried first; every restoration must leave
the lower tier stalled. This uses the technique engine to protect the advanced
elimination frontier instead of random clue exchanges. It does not add techniques.
If no advanced intermediate is found, the original best puzzle is returned.
Baseline requested-grade hits therefore remain intact. A successful refinement can
return fewer clues than the goal if restoring more would make the puzzle easier.

The extra pass has at most 81 removal/81 restoration probes and checks elapsed time
between operations: 3 seconds for worker generation, 750 ms for the synchronous
one-attempt fallback. This limits *additional* work, not total generation time or
an individual logical solve. Final uniqueness and achieved-rating checks remain.

Fixed LCG seeds 17–32 (separate from the previous experiment), Hard, three attempts:

| Clue goal | Baseline Hard | Refined Hard | Baseline median / max | Refined median / max |
| --- | ---: | ---: | ---: | ---: |
| 24 | 5/16 | 5/16 | 2.83 / 4.90 s | 3.33 / 6.12 s |
| 28 | 1/16 | 2/16 | 1.99 / 2.86 s | 2.66 / 3.98 s |

All 64 outputs passed independent uniqueness and logical ceiling checks. Retained
counts were 24–27 for the 24-clue goal and exactly 28 for the 28-clue goal. Seed 18
at 28 clues is the added Hard hit and is retained as a deterministic regression.
This is a modest, narrow improvement, not evidence of reliable Hard hit rates.
Timing includes concurrent local verification and is descriptive only; this run
is **not** an equal-time comparison against additional restarts. Medium hit rates,
phone timings and larger/equal-time corpora remain unmeasured. Do not infer that
this search beats more restarts for a fixed runtime budget.

Raw observations: [frontier-search.json](experiments/2026-11-15-frontier-search.json).
Reproduce with Node 26:
`node --import tsx --import ./tests/legacy-globals.mjs docs/experiments/2026-11-15-frontier-search.ts`.
The archived baseline module is a measurement control, never imported by the app.


## 2026-11-15: minimal unique digging and repair

Hard now preserves the existing search result, then, only after a missed grade,
tries up to four alternative full solutions. Each is dug to a minimal unique leaf
(or 17 clues) using independent uniqueness checks. Random solution clues are
restored until the existing Hard solver can finish; redundant repair clues are
removed with logical checks. If Hard is reached below the clue goal, restoration
is allowed only while retaining that rating. An alternative replaces the original
only if rated Hard. All production final uniqueness/ceiling checks still apply.

This crosses intermediate states outside the logical ceiling, exploring paths
which ceiling-constrained digging rejects. Ambiguity is monotone under removal:
removing more clues cannot eliminate either existing solution. Therefore a failed
uniqueness removal stays failed throughout a descending pass. This establishes
minimality after a complete pass; it does **not** establish a monotone difficulty
score, or prove that solver failure makes a whole subtree useless. Row/column/
digit symmetries preserve the technique patterns and are not a difficulty lever.

Additional exploration checks a 4-second deadline between at most four attempts;
the synchronous path permits one attempt with a 750-ms start budget. An attempt
can overrun that deadline. Each attempt has bounded removal/restoration passes.
This adds latency on misses. Clue goals remain best-effort; the UI range is unchanged.
No techniques or saved difficulty IDs changed. Candidate-count-driven deletion is
not used: removal is shuffled, with uniqueness or logical-solvability acceptance.

See [experiment notes](experiments/UNIQUE_DIGGING.md) for measured alternatives,
raw observations, reproducibility and limitations. The initial replacement and
shallow exploration variants were rejected. Stronger trajectory heuristics,
equal-time restart controls and additional techniques remain separate work.

## Extra Hard catalogue and presentation

Saved difficulty ID 4 appends Extra Hard; existing IDs/ceilings remain intact.
Logical level 4 adds X-Wing, XY-Wing and basic Swordfish (both fish orientations,
no fins). Hints show candidates, eliminations, fish line labels and an XY pivot.
Independent matching/assignment fixtures and a complete historical unique puzzle
validate eliminations. Hard/Extra Hard clue goals now span 21–28: low-goal trials
retained 23–24 clues, so the lower bound remains 21. Achieved grades stay explicit.

Extra Hard extends the bounded unique-digging/repair fallback. Early checkpoint
experimentation was rejected (3/8 versus 4/8 hits); see experiments/EXTRA_HARD.md
and raw observations for the development samples and timing limitations.
Final cosmetic automorphisms are accepted only after equal-rating and independent
uniqueness checks. Clue exchanges preserve correctness only with the uniqueness
checks; no predictable monotone difficulty transformation has been established.
