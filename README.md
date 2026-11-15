# Ksuduo

[Play Ksuduo](https://strlns.github.io/ksuduo/) — Sudoku puzzles generated from
scratch in your browser, with step-by-step hints and pencil notes. Your game is
saved on your device. No account is needed.

I started Ksuduo in 2021 as my first project to learn React and TypeScript. In
2026, I picked it up again with AI-assisted coding to improve the generator,
solving explanations and interface.

## Playing

Open **Puzzle settings** to choose a difficulty and adjust the clue target where
available, then generate a puzzle. The generation info button explains the levels
and the achieved rating. On phones, the square board fills the available width and the controls stay compact.
Scroll vertically to reach About; settings and detailed information open in dialogs.
Enter numbers with your keyboard or device keypad. Undo, reset, pause and a timer
are available; Show Solution reveals the completed board.

The **pencil icon** toggles Notes mode (highlighted when active). Type a digit or use the note buttons to add or remove
it. The compact digit strip lets you toggle marks without returning to the keyboard.
**Annotate** annotates the selected cell with digits allowed by its current row, column
and box. **Clear cell** removes its marks; **Clear all notes** removes marks across
the entire puzzle. Notes are saved separately from the game and don't affect the hint solver.
Marks conflicting with current entries are hidden and reappear if those entries
are undone or cleared. Annotate again to populate all currently allowed digits. Filled cells hide their notes, and undo can reveal them again.

**Add Hint** takes one logical step. It may fill a forced digit or eliminate a
candidate. Hints choose among only-place-in-a-block, row or column explanations without
favoring a unit type, before cell-based naked singles. The explanation stays visible so
you can follow it at your own pace.
Solid outlines show the source pattern; dashed outlines and crossed-out digits
show candidate eliminations. Candidate eliminations are shown only in the cells involved in that hint; your
other notes remain visible. Placement hints do not annotate the board. An older saved puzzle outside the supported
techniques can still receive a clearly labelled value from its saved solution.

## Difficulty and solving techniques

Ksuduo has its own small library of solving techniques, shared by the generator
and hints:

| Level | Techniques allowed |
| --- | --- |
| Easiest | Naked singles: only one candidate in a cell |
| Easy | Also hidden singles: only one place for a digit in a row, column or box |
| Medium | Also locked candidates: pointing and claiming between a box and a line |
| Hard | Also naked pairs: two cells reserve the same two candidates in a unit |

Every accepted clue removal must leave a puzzle solvable within the selected
techniques. A separate backtracking solver checks final uniqueness.

The generator tries up to three puzzles to match your requested grade. The displayed
rating is the lowest level that solves the puzzle using **this app's techniques**,
not a universal measure of human difficulty. If the search returns an easier puzzle,
the game tells you; you can generate again. It may also retain extra clues to stay
within the technique limit. Fewer clues do not necessarily mean a harder puzzle.

## Run locally

Use Node 26 (selected by `.nvmrc`):

```sh
nvm install
nvm use
npm ci
npm run dev
```

Open http://127.0.0.1:8080. The app uses React 19, MUI 9, TypeScript 7 and Vite 8.
Fonts, scripts, images and styles are served locally, without CDN dependencies.
Puzzle generation normally runs in a Web Worker; a capability probe selects the
synchronous fallback when workers are unavailable.

```sh
npm test                 # Vitest regression tests
npm run test:watch       # watch tests while developing
npm run typecheck
npm run build            # production files in dist/
npm run preview          # inspect the production build
```

Tests cover solver fixtures, uniqueness, difficulty boundaries, logical candidate
eliminations, saved games, class cloning, hints, notes and worker fallback. Fixed
puzzles verify that each advanced grade fails at the level below it. Browser smoke
checks supplement the automated component tests; they aren't a cross-browser guarantee.

The original randomized diagnostics and terminal puzzle drawings remain available:

```sh
npm run test:legacy
npm run test:legacy:verbose
npm run serve-tests      # browser console diagnostics on port 8081
```

These randomized diagnostics exercise the current generator and logical solver.
For implementation details, confirmed problems and future work, see the
[generator development log](docs/GENERATOR_DEVELOPMENT_LOG.md) and [known issues](docs/KNOWN_ISSUES.md).
Improvements should add understandable regression fixtures, not pursue a coverage
percentage for its own sake.

## Deploying

The [GitHub Pages workflow](.github/workflows/pages.yml) typechecks and builds pull
requests and pushes to `master`; successful pushes to `master` deploy the site.
Run `npm test` locally before pushing: the deployment workflow does not run tests.
For your own fork, select **GitHub Actions** as the Pages source and allow `master`
in the `github-pages` deployment environment. No personal access token or committed
build files are needed. Relative asset paths support hosting below `/ksuduo/`.

## Credits

Created by Moritz Rehbach. Licensed under GPL-3.0-or-later.
The water background is supplied by the project owner. IBM Plex Sans and IBM Plex
Mono are self-hosted through Fontsource; their packages include the font licenses.
