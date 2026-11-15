# Extra Hard and clue-range experiment

Extra Hard appends saved ID 4 and logical ceiling 4. Existing ceilings stay intact.
It adds basic X-Wing (two base/two cover lines) and Swordfish (three/three); no fins.
The pigeonhole argument reserves one digit in each cover line, permitting only
eliminations outside the base lines. Each base must have 2..N candidate positions,
all confined to exactly N cover lines. Both orientations are supported.

Independent row/column matching fixtures check each elimination, near misses,
no-op patterns and lower-level exclusion. Source/target candidate marks plus
mint/amber coordinate labels visualize the pattern. Full hints explain the rule.

Generation retains the bounded minimal-unique repair strategy and extends it to
Extra Hard. Measure seeds 49–52 at 20/24/28 clue goals for Hard and Extra Hard,
checking independent uniqueness and every deduction against the known solution.
Run Node 26: `node --import tsx --import ./tests/legacy-globals.mjs docs/experiments/extra-hard.ts`.
Output is `/tmp/extra-hard-results.json`. Results pending; range changes await data.

XY-Wing added to Extra Hard after fish-only generation samples missed the grade.
The pivot AB sees AC and BC; a cell seeing both wings cannot hold C. Independent
exhaustion of the three bivalue assignments checks this implication. Existing
levels remain unchanged. A historical fixed puzzle now has a complete Extra Hard
path but no Hard path; every deduction is checked against the independent solution.

Clue range decision: widen Hard/Extra Hard upward to 28, retaining minimum 21.
The 20-clue trials so far retain 23–24 clues, while 28-clue Hard puzzles occur.
Lower targets would mostly add missed-goal messages; more clues can still need
advanced solving. Final measurement results will be retained below.
