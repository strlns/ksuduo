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
it. Impossible marks are rejected with a brief explanation of the conflicting unit. The compact digit strip lets you toggle marks without returning to the keyboard.
**Annotate** fills the selected cell’s notes with its remaining candidates. The
explainer’s **⋯** menu can annotate its explanation cells, the selected row/column/box,
or all empty cells. These actions respect eliminations from the current solving session. **Clear cell** removes its marks; **Clear all notes** removes marks across
the entire puzzle. Notes are saved separately from the game and don't affect the hint solver.
Marks conflicting with current entries are hidden and reappear if those entries
are undone or cleared. Annotate again to populate all currently allowed digits. Filled cells hide their notes, and undo can reveal them again.

**Add Hint** takes one logical step. It may fill a forced digit or eliminate a
candidate. Hints choose among only-place-in-a-block, row or column explanations without
favoring a unit type, before cell-based naked singles. The explanation stays visible so
you can follow it at your own pace. Hidden and naked single highlights fade after
eight seconds. Selecting another cell removes the extra hint-cell emphasis;
complex proof highlights and their annotations stay visible.
Solid outlines show the source pattern; dashed outlines and crossed-out digits
show candidate eliminations. Candidate eliminations are shown only in the cells involved in that hint; your
other notes remain visible. Notes from elimination steps are kept after the explanation
is hidden and saved with your other annotations. Placement hints do not annotate the board.
The assistant starts as a compact summary. **Explain** expands the explanation;
**Collapse** returns to the summary, and **Hide** reduces it to a **Hints** button.
On desktops and wide tablets the assistant sits beside the board, so changing
hints never moves the grid. Its reading panel scrolls at a fixed height. On
phones, expanding it takes space in the layout above the board.
**Show pattern** briefly emphasizes sources, then eliminations, while retaining
the proof underneath. **Annotate these cells** fills missing notes in explanation
cells; it reports **Notes already shown** when Add Hint already populated them.
It does not restore eliminated candidates. The **⋯** menu holds other annotation
scopes. Color guidance appears only for elimination techniques.

The expanded panel can browse this session's earlier hints. Each historical view
uses a saved board and candidate snapshot and is read-only. **Current board**
returns to live play. Browsing never applies a hint, writes notes or changes undo.
**Undo** always changes the live game, returns to its newest surviving explanation,
and removes undone hints from the browser. New entries, reset, reveal and
generation clear this session history. Easiest guarantees a naked-single solve,
while the assistant deliberately prefers row/column/block (hidden-single)
explanations. Singles that still depend on prior candidate eliminations identify
the techniques used; this describes direct prerequisites rather than a full proof graph.

Subtle row/column labels are off by default and turn on when you request a hint.
Use the tiny grid icon beside the pencil to toggle them: **r2c6 means row 2, column 6**.
The labels always reserve their space, so toggling them does not move the board.
Reset clears all annotations. Undo reverses number entries and annotations added by elimination hints;
manual notes and annotation buttons do not create undo steps. Manual edits made after a hint are preserved.
The annotation undo history lasts for the current session, while the notes themselves survive reloads.
Undo followed by Add Hint replays the same solving steps and explanations, including
candidate eliminations, until a new number entry, reset, reveal or generation discards
that path. The Hints count includes original clues and cells currently filled by Add
Hint; candidate eliminations and manual entries do not increase it. Hint attribution
survives saving, reload and undo. The replay path lasts for the current session.
Undo clears the selected cell and input focus; click a cell to select it again. An older saved puzzle outside the supported
techniques can still receive a clearly labelled value from its saved solution.

On phones, the board is constrained by width and the small viewport height (`svh`),
which reserves room for visible browser controls without following address-bar
animation. The footer sits below gameplay and uses ordinary scrolling.

## Add to your home screen

On iPhone/iPad, use Safari’s **Share → Add to Home Screen** and enable **Open as
Web App** if offered. On Mac with macOS Sonoma or later, use **File → Add to Dock**
or **Share → Add to Dock**. Safari installs through these menu actions; the manifest
does not produce an automatic install prompt. See Apple’s instructions for
[iPhone](https://support.apple.com/en-az/guide/iphone/iphea86e5236/26/ios/26) and
[Mac](https://support.apple.com/en-ie/104996).
On Android, use your browser’s Install app or Add to Home screen action when available. Ksuduo includes
a manifest and local icons for a standalone window. It requires a network connection
to load: there is no service worker or offline app cache that can pin an old release.
Reopening or reloading fetches the current app under the host’s normal HTTP caching.
Your saved game and notes remain in local storage, separately for each origin.
The manifest’s `id`, `start_url`, `scope` and icons resolve relative to its directory,
so the same build works at `/ksuduo/` on Pages and on another HTTPS host. Apple touch
icons and standalone metadata are included. Installing does not require an offline cache.

## Difficulty and solving techniques

Ksuduo has its own small library of solving techniques, shared by the generator
and hints:

| Level | Techniques allowed |
| --- | --- |
| Easiest | Naked singles: only one candidate in a cell |
| Easy | Also hidden singles: only one place for a digit in a row, column or box |
| Medium | Also locked candidates: pointing and claiming between a box and a line |
| Hard | Also naked pairs: two cells reserve the same two candidates in a unit |
| Extra Hard | Also X-Wing, XY-Wing and basic Swordfish, with visual elimination hints |

Ordinary clue removal preserves a complete logical solving path. Advanced search
can dig through harder unique puzzles and restore clues until the selected
techniques solve them. A separate backtracking solver checks final uniqueness.

The generator first tries up to three puzzles, with bounded refinement and
additional minimal-puzzle repair attempts for missed Hard/Extra Hard grades.
Hard and Extra Hard clue goals span 21–28. The displayed
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

## AI explainers

[Sudoku: the shape of uniqueness](docs/ai/sudoku-proof-and-generator-lab/index.html)
is a standalone interactive essay on unavoidable sets and generator search.
The build copies `docs/ai/` into `dist/docs/ai/`, including the
[overview](docs/ai/index.html), so it is available under `/ksuduo/docs/ai/` in
both deployments. See [docs/ai](docs/ai/README.md) for opening and verifying it;
the source can also be opened without a build.

## Deploying

The [GitHub Pages workflow](.github/workflows/pages.yml) typechecks and builds pull
requests and pushes to `master`; successful pushes to `master` deploy the site.
Run `npm test` locally before pushing: the deployment workflow does not run tests.
For your own fork, select **GitHub Actions** as the Pages source and allow `master`
in the `github-pages` deployment environment. No personal access token or committed
build files are needed. Relative asset paths support hosting below `/ksuduo/`.

### Own server: paperclip-factory.de

Run `./deploy-paperclip-factory.sh` from a clean, committed checkout. The script
uses the same `netcup` SSH alias and `/paperclip-factory.de/httpdocs` root as
squeaklite. It assumes an SSH agent with a loaded key and a trusted host in
`known_hosts`; it never prompts for credentials or changes SSH configuration.
Run `npm ci` once beforehand. No SSH credentials belong in GitHub Actions.

The script builds locally, uploads the complete `dist/` (including `.htaccess`)
to a uniquely named `_ksuduo-<UTC timestamp>-<commit>` directory, validates the
upload, then replaces only `ksuduo/`. The previous directory is kept under
`.ksuduo-releases/<release>-previous/`; `release.txt` records its Git commit.
Upload failures leave the live app intact. A failed final rename restores the
previous directory. The two directory renames can leave a brief gap for requests.
Previous releases are retained until you remove them manually. To roll back,
move the current `ksuduo/` aside and rename the desired previous directory to
`ksuduo/` on the server. An interrupted upload may leave its staging directory;
an interrupted activation may leave `.ksuduo-deploy-lock`, which must be removed
before retrying after checking that no deployment is still running.

`public/.htaccess` revalidates unversioned files and gives content-hashed assets
a year of immutable caching on Apache with `mod_headers` and `AllowOverride
FileInfo`. Other servers need equivalent response headers. GitHub Pages keeps
its own cache policy. The second host has its own local-storage game and notes.

### Optional pre-push hook

The versioned `.githooks/pre-push` deploys when pushing a non-deleted `master` ref
to `origin`. Enable it locally with:

```sh
git config --local core.hooksPath .githooks
```

If you already use hooks, integrate its command into your existing pre-push hook
instead of replacing your hook configuration. The hook checks that the commit
being pushed is the checked-out HEAD, and deployment requires a clean tree.
Other branches, other remotes and branch deletion do not deploy. Build, SSH or
upload failures abort the push. A pre-push hook runs **before** the Git push;
if the remote later rejects that push, the server copy may already be updated.
Use the standalone script after a successful push if that ordering is undesirable.
The hook is opt-in; building, committing and preparing this script do not deploy.
Disable it with `git config --local --unset core.hooksPath` if you enabled it above.

## Credits

Created by Moritz Rehbach. Licensed under GPL-3.0-or-later.
The water background is supplied by the project owner. IBM Plex Sans and IBM Plex
Mono are self-hosted through Fontsource; their packages include the font licenses.

## Optional sound

The footer sound button cycles **Off → Music + FX → FX only → Music only → Off**. Sound starts
only when you enable it and defaults to Off on each visit. The music is a slow,
original D-minor ambient progression with soft synth tones, long dark stereo reverb,
sparse upper notes and very soft filtered harmonic sweeps;
hints use soft midrange zaps, while completed units use a legato aquatic sweep with small variations.
Effects have a gently brighter, softened top end and a quiet filtered tape delay
with slow, randomized drift. Frequent interactions stay softer than occasional accents,
but have a clear midrange body and a short bass underlay. FX have a separate, long,
dark stereo hall; their level does not modulate the music. Occasional wrong entries
can add one of three quiet open intervals matching the current chord, spaced at
least twelve seconds apart and only when music and FX are both enabled. Music only disables all interaction
and activation effects. Audio pauses when the tab is hidden. The control observes
the real AudioContext: successful foreground recovery keeps the mode; failed,
interrupted or stalled recovery returns to Off so one tap can start again. Everything is synthesized locally with Web Audio: no external
music, tracking, downloads or cached audio files.
