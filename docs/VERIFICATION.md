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

Extra Hard adds matching-oracle X-Wing/Swordfish fixtures, XY-Wing assignment
checks, known-solution deduction replay, save ID compatibility and fish line labels.
Presentation shuffles must preserve independently checked uniqueness and measured
grade. Sound entry cues cover both keypress and input paths and identify Sudoku
conflicts, without revealing a solution digit. Sound remains opt-in in all modes.

Browser checks for this change: 360/390/768/1280 widths without page or action-label
overflow; 800×600, 960×700, 1100×700 and 1440×900 resized layouts; fixed Extra Hard
hint walkthrough with mint base/amber cover labels; opt-in audio startup and entry
cue playback without Web Audio errors. At 1100×700 the populated play area ended
at about 662px, keeping the board and controls within the viewport. Smaller sizes
retain vertical scrolling. Subjective sound quality and real mobile devices remain
manual checks.

Hint UX: expanded mobile explanations occupy normal flow, with scrollable text
and readable board sizing. Focus hint hides unrelated displayed notes only; stored
notes survive toggling. Note hint cells retains solver eliminations. Bulk annotation
is available by the pencil toggle and play actions. Reset, reveal, generation and
bulk note replacement/clearing require confirmation when entries/history or notes
exist, including restored notes. Cancelling leaves values and notes unchanged.
At 390×844, expanding a hint moved the board from y≈120 to y≈286; the explanation
ended at y≈229, leaving both unobscured. Confirmation dialogs default focus to
Cancel. The completion dialog closes before a next-puzzle confirmation opens.

Animation polish: successful generation increments a presentation key for one
non-interactive ripple; hints and timer renders do not restart it. The completion
message contains six one-shot bubbles behind its content. Browser checks at
390×844 verified both effects, normal input/click handling, no page errors and
`prefers-reduced-motion: reduce` hiding the effects. No loops, timers or external
animation assets are used.

Winning/rating correction: a gameplay regression fills 50 of 51 empty cells with
hints, enters the last digit manually, and expects the celebration (not a solution
reveal). The completion message now has a larger checkmark, expanding halo and ten
larger bubbles lasting 3.8 seconds; reduced motion retains the static checkmark.
The board footer uses a separate achieved logical rating, saved at array index 8.
Older eight-field saves are rated from their givens at restore. Requested settings
remain independent. Generation-error responses retain the existing achieved rating.
