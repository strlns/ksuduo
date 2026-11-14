# Ksuduo

A browser-only Sudoku generator and game. Puzzles are generated from scratch on
your computer, and the current game is saved locally.

Live site: https://strlns.github.io/ksuduo/

## Development

```sh
nvm install
nvm use
npm ci
npm run dev
```

Node 26 is selected by `.nvmrc`. Vite serves the app at http://127.0.0.1:8080 with
React Fast Refresh. `npm run serve` remains an alias. All fonts, scripts, images,
and styles are bundled and served locally; there are no CDN dependencies.

```sh
npm test                 # deterministic Vitest regression suite
npm run test:watch       # Vitest in watch mode
npm run typecheck        # app, configuration and tests
npm run build            # typecheck, then production build in dist/
npm run preview          # serve the production build locally
```

## Original diagnostics

The original handwritten, randomized tests and puzzle drawings are retained:

```sh
npm run test:legacy
npm run test:legacy:verbose
npm run serve-tests           # browser console runner at http://127.0.0.1:8081
npm run serve-tests-verbose
```

`drawPuzzle` and `drawPuzzleWithPossibilities` work in both a styled browser console
and plain terminal stdout. CLI assertion failures produce a nonzero exit code.
The random diagnostics can reveal existing algorithm bugs; they are intentionally
separate from deterministic CI. See [known issues](docs/KNOWN_ISSUES.md).

The Vitest suite covers the original fixed solver examples, coordinate mapping,
human-solver partial solutions, class cloning and undo/reset behavior, structured
worker replies, saved-game compatibility, timer intervals, worker capability/failure
paths, and React gameplay controls using fixed generated boards. It does not claim
complete algorithm coverage. Real-browser gameplay automation is a future step.

## GitHub Pages

[The workflow](.github/workflows/pages.yml) runs tests and builds on pull requests
and pushes to `master`. Successful pushes to `master` deploy `dist/` to Pages.
The **Run workflow** button also supports manual deployment from `master`.

One-time setup for the previous branch-based deployment:

1. Open **Settings → Pages → Build and deployment**.
2. Change **Source** from **Deploy from a branch** to **GitHub Actions**.
3. Push the reviewed commits to `master`, or run **Test and deploy to GitHub Pages**
   from the Actions tab after the workflow is on that branch.

The `github-pages` environment must allow deployment from `master` (update any old
rule that only allows the former `github-pages` publishing branch). GitHub supplies
the deployment token; no personal access token or built bundles in Git are needed.
Relative asset URLs preserve hosting under `/ksuduo/`, including the worker.

## Scope of the modernization

React 19, MUI 9, TypeScript 7, Vite 8 and Vitest replace the old Webpack/Babel/JSS
stack. The class-based state, cloning, controlled-input workaround, Sudoku algorithms,
saved-game format, difficulty choices and worker/synchronous generation paths remain.
The small lifecycle adjustments prevent duplicate initialization under modern React,
clean up the timer on unmount, and handle blocked or unresponsive worker probes.

The water background is supplied by the project owner. IBM Plex Sans and IBM Plex
Mono are self-hosted through Fontsource. See the included package font licenses.

_Author: Moritz Rehbach. GPL-3.0-or-later._
