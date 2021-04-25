# KSUDUO
## Simple Sudoku Generator

https://strlns.github.io/ksuduo/index.html

## What does it do?

It's a Sudoku game and Sudoku generator. The number of clues is configurable. It works by generating a full grid and
then deleting some cells. The generator works hard to guarantee that the puzzle has a unique solution (is a proper
SUDOKU). If possible, puzzle generation runs in a background thread (Web Worker)

#### Current caveats

* currently only one solver algorithm which I didn't write myself (https://github.com/mattflow/sudoku-solver)
* no Import/Export yet (but state is persisted in localStorage)

---

In case this repo is noticed by anyone:
It's my first React project. Suggestions and tips are very welcome. :)

**Especially** expansions of the below list of emojis.

🐻🔥😊🌿🏳️‍🌈🧑🏻‍🚀😍🙇🧙‍♀️ 🎰 🎱 🎲 🔮 ✨

If you ask me, these are enough emojis to earn me a GitHub star. ;)

This is a toy/learning project so I can get a basic understanding of:

* **TypeScript**
* **React** (without using _create-react-app_)
* **React Hooks / Function components**
* **Web Workers** (by accident because they were needed)
* myself (no not really)

---

_author: Moritz Rehbach_
