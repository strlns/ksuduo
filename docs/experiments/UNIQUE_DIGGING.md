# Unique digging and repair hypothesis

Experiment: Hard removal may cross the logical ceiling temporarily, while every
accepted removal remains independently unique. At the clue goal, restore random
solution clues until the current technique ceiling solves the puzzle, then remove
redundant repair clues. This explores a sibling removal path which the previous
ceiling-at-every-step algorithm cannot reach directly. Final rating and uniqueness
remain mandatory. No new techniques or difficulty relabelling.

Only ambiguity is used as a proven descendant-pruning condition. Logical failure
is not a proof about every descendant. Sudoku row/column/digit symmetries preserve
technique structure and cannot reliably raise difficulty. No stronger monotonicity
claim is made about the deterministic app grader.

Run Node 26 with `node --import tsx --import ./tests/legacy-globals.mjs
 docs/experiments/unique-digging.ts`. Compare seeds 33–48 against the actual previous
production generator at 24 clues; retain grades, clue counts, timings and independent
uniqueness results. This is an experiment pending measurement, not a proven gain.

The initial replacement lost baseline Hard hits despite faster attempts. Revised
hypothesis: preserve the entire old search and refine result, then try at most four
unique-digging/repair paths only if Hard is still missed. Stop between attempts at
4 seconds extra (one attempt/750 ms synchronous). These are soft budgets: an
individual bounded attempt can overrun. No baseline result is replaced unless a
complete Hard solve is established. Measure this separately before adoption.

Second observation: stopping unique digging at 24 clues often never reaches a
meaningfully different state. The next variant digs to a uniqueness-minimal leaf
(or 17 clues), repairs to the logical ceiling, and restores clues toward the goal
only while retaining Hard. This permits fewer clues than requested, reported by
the existing board count. The UI goal range stays unchanged in this slice.

## Results

Seeds 33–48, Hard, 24-clue goal, Node 26. All outputs independently unique
and at or below the logical ceiling. Times include concurrent verification and
are descriptive, not controlled device benchmarks.

| Experiment | Hard hits | Median / maximum seconds | Clue range |
| --- | --- | --- | --- |
| unique-replacement-results / baseline | 6/16 | 2.70 / 4.32 | 24–27 |
| unique-replacement-results / candidate | 3/16 | 2.02 / 4.84 | 24–27 |
| unique-shallow-results / baseline | 6/16 | 2.70 / 5.78 | 24–27 |
| unique-shallow-results / candidate | 7/16 | 3.83 / 7.74 | 24–27 |
| unique-minimal-results / baseline | 6/16 | 3.19 / 5.54 | 24–27 |
| unique-minimal-results / candidate | 9/16 | 4.47 / 9.93 | 24–27 |

Raw JSON files beside this document retain every observation. The final minimal
variant is adopted for its additional Hard hits while preserving the previous
result on failure. This small development corpus is not a population estimate or
an equal-time comparison against additional ordinary restarts. A separate held-out
corpus, fixed-time controls and mobile latency measurements remain necessary to
establish broader performance claims. Intermediate variants used the same seeds
for development; these are not independent confirmatory trials.

Validation: full suite 715 tests passed for the initial unique-digging change;
all 49 generator/logical/boundary tests passed on the final strategy, plus the new
minimal-repair regression. Production build and legacy diagnostics passed.
