## Ksuduo

https://strlns.github.io/ksuduo/index.html

### What does it do?

You can:

* generate sudokus on-the fly
* play sudoku (state for current game is stored locally)

This is my first project in both React and TypeScript, so there are quirks and the code is far from perfect.

---

Problems:

* Generator does not work perfectly, it's often slow and cannot reliably produce puzzles with less than 24 hints. It
  should never produce an invalid sudoku though.
  - Every puzzle is generated in JS without any static input.
  - This is the cause for slowness and also leads to somewhat similar-looking puzzles in each run
* Looks
  - UI is not very pretty
  - no dark mode
* Does not use `create-react-app`, quirky build setup and no HMR

_author: Moritz Rehbach_
