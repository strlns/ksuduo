# Migration verification

Verified locally on Node 26.13.1:

- Migration checkpoint: 642 Vitest tests passed across 7 files.
- Final checkpoint including the separate generator fix: 655 tests passed across 8 files.
- TypeScript app, test and configuration checks passed.
- Vite production build passed, emitting separate worker, image and local font assets.
- npm installation audit: 0 vulnerabilities; direct dependency tree resolves cleanly.
- Real browser: existing saved game from the Webpack build restored under Vite.
- Production preview: new puzzle generation, hints and explanation, undo, timer toggle,
  pause/resume, show solution, reset and native difficulty/slider controls checked.
- Desktop and 390px phone layouts inspected.
- Production browser console had no warnings or errors during these checks.
- Application font/CSS/image/script asset references are local. External URLs are
  ordinary user-activated source/documentation links, not CDN resources.

The original randomized diagnostic runner was exercised in Node. It failed on an
ambiguous board returned by its test-only generator helper. The original pre-migration
source failed on that diagnostic too. See KNOWN_ISSUES.md; no algorithms were changed.

GitHub Actions and deployment cannot be exercised until the commits are pushed and
the repository's Pages source is switched to GitHub Actions. Nothing has been pushed
or deployed by this migration task.

Next browser automation work: fixed gameplay fixtures and a complete solve/winner
flow, worker-blocking scenarios, storage restrictions and repeated generation. The
current React regression tests exercise generation with fixed worker replies and
synchronous results; they do not replace cross-browser end-to-end tests.

## Separately requested algorithm correction

After the migration checkpoint, deterministic regressions reproduced an ambiguous
four-cell rectangle accepted by the gameplay shortcut, plus the test-only generator's
missing rollback. Both were corrected separately. The original `test:legacy` runner
subsequently passed, including its random generation and human-techniques checks.
