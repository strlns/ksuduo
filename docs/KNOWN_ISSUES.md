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
