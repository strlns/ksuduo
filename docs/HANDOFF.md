# Cloud continuation

Continue this project in a fresh cloud workspace using the complete source archive.
Do not use the old public GitHub checkout as the migration baseline: the local
migration checkpoint has deliberately not been pushed or deployed yet.

## User priorities and boundaries

- Technical modernization first; preserve all existing gameplay, quirks and local
  saves. Keep the class instances, cloning and mutation patterns until regression
  coverage supports a separate refactor. Avoid a large React rewrite.
- Worker capability probing and synchronous fallback are important.
- All assets must remain self-hosted. No CDN scripts or fonts.
- The current dark cyan water background, board, fonts and buttons are a useful
  interim design. Later: revise the design, especially buttons and dropdown, to
  give it more personality. Do not overinterpret earlier comments about a specific
  MUI feel. Design is lower priority than generator bugs after handover.
- Next: discuss and improve the generator with the user, retaining failing fixtures.
  The test-only generator rollback and the shared trivial-solvability false positive
  were fixed after the migration, in a separate commit. Read KNOWN_ISSUES.md first.
- No push or deployment until the user explicitly requests it. The user wants to
  continue reviewing and iterating from a phone before deciding to push.
- The user plans to connect GitHub later. The repository is strlns/ksuduo, default
  branch master. The Pages workflow is committed locally. Pages currently uses the
  github-pages branch; switch its source to GitHub Actions before the new workflow
  deploys. Check the github-pages environment branch protection too.

## Getting started

Install Node 26 and run `npm ci`, `npm test`, and `npm run build`. The lockfile includes
portable platform dependencies. Use `npm run dev -- --host 0.0.0.0` if the cloud
preview requires a public bind address.

`npm test` is deterministic; the original `npm run test:legacy` diagnostics retain
random generation and can fail on existing algorithm bugs. Do not suppress those
failures or quietly change the algorithms as part of infrastructure work.

Read the README, tests, and known issues before changes. The React tests use a fixed
worker reply or synchronous generator result, while the real browser verifies that
Vite can load the emitted worker. Automated Playwright fixtures would be useful
later; no Playwright infrastructure was added in this migration.
