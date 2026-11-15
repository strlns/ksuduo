# AI explainers

- [Sudoku: the shape of uniqueness](sudoku-proof-and-generator-lab/index.html):
  an interactive essay on symmetries, trades, unavoidable sets, the 17-clue proof,
  and possible generator improvements.

Open `sudoku-proof-and-generator-lab/index.html` directly in a browser, or serve
this directory with any static HTTP server. No build, package installation or
external runtime dependencies are needed. Keep the HTML, CSS and three JavaScript
files together. These docs are independent of the application build.

The archived essay reviews repository revision
`f9682f9315f5af4bd56af9b939b59d13d1b13f4a`; its observations and proposed
improvements describe that snapshot. Repository links resolve to files in the
local checkout. The primary-paper links remain external reading references.
Personal names and account-identifying URLs have been removed from this copy;
Site configuration and hosting metadata are not included.

The original standalone verifier is included. With Node.js installed, run:

```sh
node docs/ai/sudoku-proof-and-generator-lab/verify.cjs
```

It independently checks all 65,536 clue masks against the 288 complete 4×4 grids,
the minimal-puzzle census and unavoidable sets, plus the 9×9 trade and supported
transformations. Verification is optional and does not generate assets.
