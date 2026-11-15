# Verification

Use Node 26 and install with `npm ci`.

- `npm test`: deterministic fixtures for solver correctness, ambiguous-board
  rejection, technique ceilings and grades, seeded generation replay, logical
  eliminations, saved-game/class compatibility, worker fallback, hints and notes.
- `npm run test:legacy`: randomized console diagnostics using the current generator
  and logical engine; `--verbose` output and puzzle drawings remain available via
  `npm run test:legacy:verbose`. These supplement deterministic regression tests.
- `npm run build`: TypeScript checks and production assets, including the worker,
  fonts and images. Tests run locally; the Pages workflow typechecks and builds.
- `npm run preview`: manually check real generation, worker and synchronous paths,
  hints, undo/reset, notes, pause/resume, saved-game restore and mobile layouts.

Component tests use fixed generation results and do not establish real worker or
native mobile keyboard behavior. Browser emulation supplements tests; real-device
checks remain necessary. An open port or successful build alone does not validate
puzzle correctness. Preserve the regression fixtures described in the
[generator development log](GENERATOR_DEVELOPMENT_LOG.md).
