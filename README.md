# KSUDUO
## Simple Sudoku Generator

https://strlns.github.io/ksuduo/index.html

## What does it do?

It's a Sudoku game and Sudoku generator. The number of clues is configurable. It works by generating a full grid and
then deleting some cells. The generator works hard to guarantee that the puzzle has a unique solution (is a proper
SUDOKU). If possible, puzzle generation runs in a background thread (Web Worker)

#### Laundry list / Nice-to-have features:

* Own solver algorithm (not really needed). Credits to https://github.com/mattflow/sudoku-solver !
* Import/Export, preferably in simple text format like OpenSudok
* Note-taking feature
* State is persisted in localStorage already, but only for one game. Some kind of High-Score or Load/Save feature would
  be nice.
* Improve puzzle generation

---

This is a toy/learning project so I can get a basic understanding of:

* **TypeScript**
* **React** (without using _create-react-app_)
* **React Hooks / Function components**
* **Web Workers** (by accident because they were needed)
* myself (no not really)

In the end I spent way more time on it than planned, to make it playable. Lesson: React is fun!

---

_author: Moritz Rehbach_
