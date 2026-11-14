# Algorithm follow-up

The migration deliberately leaves the Sudoku algorithms intact. The original random
console runner is available with `npm run test:legacy`; it can expose existing
algorithm bugs and is intentionally separate from deterministic CI checks.

## Trivially solvable generator can return a board with multiple solutions

Observed while running `testTriviallySolvableBoardsHaveOneSolution(8)` during the
migration. Re-running the same original tests and algorithm/model source from the
pre-migration Git HEAD in a temporary checkout also failed with `MULTIPLE_SOLUTIONS`.
That baseline used the new dependency installation, so it establishes that the
failure does not depend on the React/Vite/MUI source changes.

One failing board, retained for a later algorithm fix:

```
423000581576481392918532467091370245752149638034000179269710850185000720347825916
```

`solveCheckUnique` correctly identifies this as having multiple solutions. The
random generator test fails because `generateTriviallySolvableBoard` returned it,
not because the backtracking solver was unable to solve a unique puzzle. Investigate
the removal loop and `isTriviallySolvable` together. Do not weaken uniqueness
assertions to make the diagnostic pass.

### Gameplay reachability

`generateTriviallySolvableBoard` is only called by its legacy test, not by the app.
It checks the predicate before clearing another cell and does not restore the last
removal when that crosses the solvability boundary. For the captured board above,
`isTriviallySolvable` returns **false**. This failure is therefore evidence against
the test helper, not proof that gameplay generation returns ambiguous puzzles.

Easy/Medium/Hard use `generateSudoku` in `generatorConstraintBased.ts`, which calls
the shared predicate **after** removal and otherwise uses the uniqueness solver.
Easiest uses `generateBoardSolvableUsingEasyTechniques`, a separate path. Both still
deserve independent fixed-seed generation coverage in the algorithm pass.

## Follow-up fix after the migration checkpoint

The test-helper failure is fixed in a separate commit. The helper now restores a
removal when the resulting board no longer passes the trivial-solvability check.

A new independent regression also demonstrated a critical false positive in the
shared predicate: starting from `tests/fixtures.ts`'s solution, remove cells
(3,0), (4,0), (3,3), (4,3). The remaining 6/7 rectangle has two solutions, but the
old predicate returned true because its candidate-pair check was skipped when all
remaining cells had at most two possibilities. Unlike the original helper failure,
this shortcut is used by Easy/Medium/Hard generation.

The predicate now conservatively accepts only boards that can be fully and validly
completed by repeated single-candidate fills, on a clone. Other boards go through
the existing uniqueness solver. Regression tests cover the ambiguous rectangle,
invalid filled boards, forced-cell chains, four fixed helper seeds, and two fixed
seeds in each of the regular gameplay difficulties. The original randomized console
runner passed after the fixes. This is a correctness guard, not a claim of complete
algorithm coverage or an algorithm performance redesign.
