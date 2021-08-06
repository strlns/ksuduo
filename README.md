## Ksuduo

https://strlns.github.io/ksuduo/index.html

### What does it do?

You can:

* generate sudokus on-the fly (no static input is used, generator is not very fast)
* play sudoku (state for current game is stored locally)

This is my first project in both React and TypeScript, so there are quirks and the code is far from perfect.

---

Problems:
* Generator cannot reliably produce puzzles with less than 24 hints
* Generator is often slow
* No lazy loading
* UI is not very pretty, no dark mode
* Does not use `create-react-app`, quirky build setup and no HMR

_author: Moritz Rehbach_
