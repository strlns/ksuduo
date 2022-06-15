## Ksuduo

https://strlns.github.io/ksuduo/index.html

### What does it do?

You can:

* generate sudokus on-the fly (no static input is used, generator is not very fast)
* play sudoku (state for current game is stored locally)

### Problems

This was my first project in both React and TypeScript, so there are MANY quirks.

Code problems:
* This uses quite a lot of class instances in state and prop values. At the time of writing I did not realize that this is an anti-pattern.
* Aiming to "keep it simple", this does not use a global store, also no reducers in places where it would make sense
* As a result: A lot of object-cloning and complicated stateful components
* Does not use `create-react-app`, quirky build setup and no HMR

App problems:
* Generator cannot reliably produce puzzles with less than 24 hints
* Generator is often slow
* No lazy loading
* UI is not very pretty, no dark mode

_author: Moritz Rehbach_
