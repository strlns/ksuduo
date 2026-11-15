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
