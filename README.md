# KSUDUO
## Simple Sudoku Generator

https://strlns.github.io/ksuduo/index.html

## What does it do?

It's a Sudoku game and Sudoku generator. The number of clues is configurable. It works by generating a full grid and
then deleting some cells. The generator works hard to guarantee that the puzzle has a unique solution (is a proper
SUDOKU). If possible, puzzle generation runs in a background thread (Web Worker)

---

This is a toy/learning project so I can get a basic understanding of:

* **TypeScript**
* **React** (without using _create-react-app_)
* **React Hooks / Function components**
* **Web Workers** (by accident because they were needed)
* myself (no not really)

In the end I spent way more time on it than planned, to make it playable. :)

#### Laundry list / Nice-to-have features:

* Own solver algorithm (not really needed). Credits to https://github.com/mattflow/sudoku-solver !
* Import/Export, preferably in simple text format like OpenSudok
* Note-taking feature
* State is persisted in localStorage already, but only for one game. Some kind of High-Score or Load/Save feature would
  be nice.
* Improve puzzle generation

---

### Note on 'tests'

This does not follow npm convention and there is no "test" script that executes in Node context.
(let alone a testing framework)

"serve-tests" is used to quickly test problems using the desired modules, but in browser context.
"serve-debug" is the same but the idea is that I would use React components there if I want to.
"serve-tests" should just do console I/O

### Compatibility, Babel, Webpack configuration.

Babel is used to polyfill for older browsers and to provide a fast build (`ts-loader` is slow without HMR)
However, `useBuiltIns: "usage"` does not quite work when using `material-ui`, or not at all for Internet Explorer 11.

See https://github.com/mui-org/material-ui/issues/17789

Sane conclusion: No support for IE.

### Remainders of `prop-types` in Webpack production output

Funnily, I spent hours trying to remove remainders of prop-types and things
like `"SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED"` from the compiled output.

Then I ran `build` in an ejected project bootstrapped with `create-react-app`, and found the same garbage in its output.
So we just ignore this stuff.

---

As usual, `WebpackDefinePlugin` is used for debugging and

```JavaScript
if (IS_DEVELOPMENT) {
   //...
}
```

becomes

```JavaScript
if (false) {
   //...
}
```

so there is no need to comment out often-used debugging code.

---

_author: Moritz Rehbach_
