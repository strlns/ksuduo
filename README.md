## Ksuduo

https://strlns.github.io/ksuduo/index.html

### What does it do?

This is my first project in both React and TypeScript.

This (sudoku game, sudoku generator, sudoku solver) has been done (better) by lots of people, often better. This should
be playable though.

You can:

* generate sudokus on-the fly
* play sudoku (state for current game is stored locally)

---

Problems:

* Does not use `create-react-app`, quirky build setup and no HMR
* Generator does not work perfectly, it's often slow and cannot reliably produce puzzles with less than 24 hints. It
  should never produce an invalid sudoku though.

* Looks, no dark mode

_author: Moritz Rehbach_
