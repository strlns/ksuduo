# Current limitations

- Generation may retain more or fewer clues or return an easier grade than requested;
  achieved results are reported. The grade measures this app's techniques, not
  universal human difficulty.
- Generation has a bounded removal/attempt count but no cancellation or overall
  wall-clock deadline. Difficulty refinement limits additional work with a deadline
  checked between logical solves. Synchronous fallback can block the main thread.
- Explicit backtracking search limits fail safely, but their failure code does not
  distinguish exhaustion from no solution. Default solving remains exhaustive.
- Older saved puzzles can exceed the current technique library; hints then reveal
  a clearly labelled digit from the saved solution.
- Notes are separate from puzzle undo. Conflicting marks are hidden and may return
  after clearing or undoing an entry. Clear-all notes is persisted separately.
- Focus changes reduce keyboard jumps, but iOS/Android native keyboard behavior
  needs real-device testing. Compact mobile controls retain native vertical scroll.

See the [generator development log](GENERATOR_DEVELOPMENT_LOG.md) for the current
pipeline, implemented fixes, preserved regression evidence and next possible steps.
