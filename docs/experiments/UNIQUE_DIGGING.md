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
