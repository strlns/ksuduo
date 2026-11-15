import {Dialog, DialogTitle, DialogContent, DialogActions} from "@mui/material";
import {MessageQueue} from "../Message/MessageQueue";
import {Candidates, candidatesFor, nextHintStep, applyLogicStep, LogicStep} from "../../algorithm/solver/logical";
import { ThemeProvider } from "@mui/material/styles";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Board, OptionalCell } from "../Board/Board";
import "../../css/app.css";
import generateRandomSudoku, {
  DIFFICULTY_LEVEL,
  GENERATOR_CODE,
  GeneratorResult,
} from "../../algorithm/generator/generator";
import {
  CheckCircleRounded,
  EmojiObjectsRounded,
  HighlightOffRounded,
  HighlightRounded,
  InfoOutlined,
  ThumbUp,
  UndoRounded,
} from "@mui/icons-material";
import {
  Box,
  Container,
  Grid,
  Icon,
  IconButton,
  LinearProgress,
  Modal,
  Switch,
  Typography,
} from "@mui/material";
import { Button, Button45Mt } from "../Controls/Button";
import GeneratorConfiguration from "../Generator/GeneratorConfiguration";
import { Sudoku } from "../../model/Sudoku";
import {
  PaperBox,
  paperBoxDefaultLayoutSx,
} from "../MaterialUiTsHelper/PaperBox";
import { cloneDeep } from "lodash-es";

import SudokuWorker from "../../worker/sudoku.worker?worker";
import {
  GeneratorResultFromWorker,
  MSGEVT_SOURCE,
  WORKER_ACTIONS,
} from "../../worker/protocol";
import testWorker from "../../worker/testWorkerActuallyWorks";
import { GameStateSerializable, persist } from "../../persistence/localStorage";
import { ksuduoThemeSecond } from "../Theme/SecondKsuduoTheme";
import { GenerateButton } from "../Generator/GenerateButton";
import { Clock } from "../Board/Clock";
import isInputModeAttributeSupported from "../../utility/isInputModeAttributeSupported";
import { BOARD_SIZE, DEFAULT_CLUES } from "../../model/Board";
import { WinnerMessage } from "../Message/WinnerMessage";
import { formatTime } from "../../utility/formatTime";
import { Timer } from "../../model/Timer";
import { ksuduoThemeNormal } from "../Theme/NormalKsuduoTheme";
import About from "./About";
import { usePageVisibility } from "../../utility/usePageVisibility";
import { CellData, CellValue } from "../../model/CellData";
import { restoreGameStateOrInitialize } from "../../persistence/restoreGameStateOrInitialize";
import { getCellWithMinPossAndValueFromSolution } from "../../algorithm/solver/solver";
import { pickRandomArrayValue } from "../../utility/pickRandom";
import type {GameMessage} from "../Message/GameMessageBox";
import { hashCode } from "../../utility/stringHash";

let sudokuWorker: Worker;
let useWebWorker = false;
if (window.Worker) {
  try {
    sudokuWorker = new SudokuWorker();
  } catch {
    /** Nothing to handle here. See {@link useWebWorker}.*/
  }
}

const checkWebWorkerSupport = async (): Promise<boolean> => {
  return Boolean(sudokuWorker) && await testWorker();
};

let timer = new Timer();

export interface GameState {
  sudoku: Sudoku;
  generatorMessage: string;
  numberOfClues: number;
  difficulty: DIFFICULTY_LEVEL;
  currentDifficulty: DIFFICULTY_LEVEL;
  highlightedCell: OptionalCell;
  secondaryHighlight: CellData[];
  isWorking: boolean;
  forceFocus: OptionalCell;
  initialBoardIsSolved: boolean;
  solutionShown: boolean;
  isPaused: boolean; //paused by user
  secondsElapsed: number;
  timerEnabled: boolean;
  gameMessages: GameMessage[];
}

// only used to detect initial render for timer.
interface GameProps {}

/**
 * This component wraps way too much state.
 * Better decompose logic in next project, maybe using redux.
 * Done: Board.tsx doesn't re-render every 1000ms.
 */
const {
  board: initialBoard,
  secondsElapsed: initialSeconds,
  isPaused: initialIsPaused,
  solutionShown: initialSolutionShown,
  timerEnabled: initialTimerEnabled,
  currentDifficulty,
} = restoreGameStateOrInitialize();

export const Game = (props: GameProps) => {
  const [state, setState] = useState({
    sudoku: initialBoard,
    numberOfClues: DEFAULT_CLUES,
    currentDifficulty,
    difficulty: currentDifficulty ?? DIFFICULTY_LEVEL.EASY,
    highlightedCell: undefined as OptionalCell,
    secondaryHighlight: [],
    isWorking: false,
    generatorMessage: "",
    forceFocus: undefined as OptionalCell,
    initialBoardIsSolved: initialBoard.isSolved(),
    solutionShown: initialSolutionShown,
    secondsElapsed: initialSeconds,
    isPaused: initialIsPaused,
    timerEnabled: initialTimerEnabled,
    gameMessages: [],
  } as GameState);

  const resetStateCommons = {
    solutionShown: false,
    highlightedCell: undefined,
    isWorking: false,
    isPaused: false,
    generatorMessage: "",
    secondsElapsed: 0,
    initialBoardIsSolved: false,
    gameMessages: [],
  };

  const [supportsInputModeAttribute, setSupportsInputModeAttribute] =
    useState(false);

  const [winnerModalOpen, setWinnerModalOpen] = React.useState(false);

  const pageIsVisible = usePageVisibility();

  interface StateFromGen {
    generatorMessage?: string;
    sudoku?: Sudoku;
  }

  const stateFromGenerator = (
    result: GeneratorResult | GeneratorResultFromWorker
  ): StateFromGen => {
    const board =
      result[1] instanceof Sudoku ? result[1] : new Sudoku(result[1]);
    switch (result[0]) {
      case GENERATOR_CODE.OK:
      case GENERATOR_CODE.COULD_NOT_ACHIEVE_CLUES_GOAL:
        return {
          sudoku: board,
          generatorMessage: result[2] ?? "",
        };
      case GENERATOR_CODE.UNKNOWN_ERROR:
      default:
        if (IS_DEVELOPMENT) {
          console.error(result);
        }
        return {
          generatorMessage: result[2],
        };
    }
  };

  const generateSudokuThen = (callback: () => void) => {
    if (IS_DEVELOPMENT) {
      console.log(
        useWebWorker
          ? "Using web worker, test succeeded."
          : "Falling back to synchronous puzzle generation."
      );
    }
    if (useWebWorker) {
      if (state.isWorking) return;
      timer.clearInterval();
      setState((prevState) => ({
        ...prevState,
        isWorking: true,
        generatorMessage: "",
      }));
      sudokuWorker.postMessage({
        source: MSGEVT_SOURCE,
        data: [WORKER_ACTIONS.GENERATE, state.numberOfClues, state.difficulty],
      });
      const listener = (event: MessageEvent) => {
        const result = event.data as GeneratorResultFromWorker;
        sudokuWorker.removeEventListener("message", listener);
        if (!Array.isArray(event.data)) {
          throw new Error("Unexpected response");
        }
        setState((prevState) => ({
          ...prevState,
          ...resetStateCommons,
          currentDifficulty: state.difficulty,
          ...stateFromGenerator(result),
        }));
        callback();
        timer.start();
      };
      sudokuWorker.addEventListener("message", listener);
    } else {
      if (IS_DEVELOPMENT) {
        console.log("Falling back to synchronous generation.");
      }
      requestAnimationFrame(() => {
        setState((prevState) => ({ ...prevState, isWorking: true }));
        setTimeout(() => {
          const result = generateRandomSudoku(
            state.numberOfClues,
            state.difficulty,
            true
          );
          setState((prevState) => ({
            ...prevState,
            ...resetStateCommons,
            currentDifficulty: state.difficulty,
            ...stateFromGenerator(result),
          }));
          callback();
          timer.start();
        }, 25);
      });
    }
  };

  const generateSudoku = () => {
    generateSudokuThen(() => {});
  };

  const updateNumberOfClues = (numberOfClues: number): void => {
    setState((prevState) => ({
      ...prevState,
      numberOfClues,
    }));
  };
  //set up a ref to access the gameMessages array inside a setTimeout call
  const addGameMessage = (message: GameMessage): void => {
    message.dismissable =
      message.dismissable === undefined ? true : message.dismissable;
    message.key = hashCode(`${Date.now()} ${message.text}`);
    message.dismiss = () => setState(prev => ({
      ...prev, gameMessages: prev.gameMessages.filter(entry => entry !== message),
    }));
    setState(prev => ({...prev, gameMessages: [...prev.gameMessages.slice(0, 4), message]}));
  };

  const resetSudoku = () => {
    const sudoku = cloneDeep(state.sudoku);
    sudoku.reset();
    setState((prevState) => ({
      ...prevState,
      sudoku: sudoku,
      ...resetStateCommons,
    }));
    if (state.sudoku.isEmpty()) {
      generateSudoku();
    } else {
      timer.start();
    }
  };

  const showSolution = () => {
    const sudoku = cloneDeep(state.sudoku);
    sudoku.showSolution();
    setState((prevState) => ({
      ...prevState,
      sudoku,
      ...resetStateCommons,
      solutionShown: true,
    }));
  };

  const persistState = () => {
    const {
      sudoku: board,
      isPaused,
      secondsElapsed,
      timerEnabled,
      currentDifficulty,
      solutionShown,
    } = state;
    persist({
      board,
      isPaused,
      secondsElapsed,
      timerEnabled,
      currentDifficulty,
      solutionShown,
    } as GameStateSerializable);
  };

  const persistAndPause = () => {
    timer.pause();
    setState((prevState) => ({
      ...prevState,
    }));
    persistState();
  };

  const resume = () => {
    if (!state.isPaused) {
      timer.resume();
      setState((prevState) => ({
        ...prevState,
      }));
    }
  };

  useEffect(() => {
    if (pageIsVisible) {
      resume();
    } else {
      persistAndPause();
    }
  }, [pageIsVisible]);

  const updateCallback = useCallback(() => {
    setState((prevState) => ({ ...prevState, isWorking: false }));
    if (!state.sudoku.isEmpty()) {
      persistState();
    }
  }, [state.sudoku.getFlatValuesAsString()]);

  const togglePaused = useCallback(() => {
    setState((prevState) => ({ ...prevState, isPaused: !prevState.isPaused }));
  }, []);

  /**
   * Duties on initial render.
   */
  useEffect(() => {
    let active = true;
    setSupportsInputModeAttribute(isInputModeAttributeSupported());
    /**
     * jump through some hoops, because presence of window.Worker alone doesn't guarantee that
     * the Worker actually works (CORS, Blockers...). Verify with a test message that the Web Worker works.
     */
    checkWebWorkerSupport().then((value) => {
      if (!active) return;
      useWebWorker = value;
      if (state.sudoku.isEmpty()) {
        generateSudoku();
      }
    });
    timer.callback = () =>
      setState((prevState) => ({
        ...prevState,
        secondsElapsed: timer.secondsElapsed,
      }));
    if (!state.isPaused) {
      timer.start(state.secondsElapsed);
    }
    return () => {
      active = false;
      timer.clearInterval();
    };
  }, []);

  useEffect(() => {
    if (state.isPaused) {
      timer.pause();
    } else {
      timer.resume();
    }
  }, [state.isPaused]);

  /*Trigger persisting. */
  useEffect(updateCallback, [
    state.highlightedCell,
    state.difficulty,
    state.sudoku,
    state.isPaused,
  ]);

  /*Stop timer on completion. */
  useEffect(() => {
    setWinnerModalOpen(
      state.sudoku.isSolved() &&
        !state.solutionShown &&
        !state.initialBoardIsSolved
    );
    if (state.sudoku.isSolved()) {
      timer.pause();
    } else if (!state.isPaused) {
      timer.resume();
    }
  }, [state.sudoku.isSolved()]);

  const selectDifficulty: React.ChangeEventHandler<HTMLSelectElement> = (
    event
  ) => {
    setState((prevState) => ({
      ...prevState,
      difficulty: +event.target.value as DIFFICULTY_LEVEL,
    }));
  };

  const logicRef = useRef<{signature: string; candidates: Candidates} | undefined>(undefined);
  const [logicStep, setLogicStep] = useState<LogicStep | undefined>(undefined);
  const [hintCandidates, setHintCandidates] = useState<Record<string, number[]> | undefined>(undefined);
  const currentSignature = state.sudoku.getFlatValues().join('');
  useEffect(() => {
    if (logicRef.current?.signature !== currentSignature) {
      logicRef.current = undefined;
      setLogicStep(undefined);
      setHintCandidates(undefined);
    }
  }, [currentSignature]);
  const [generationInfoOpen, setGenerationInfoOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hintTimeoutRef: { current: undefined | number } = useRef(undefined);

  /**
   * Fix a wrongly filled cell and tell the user about it.
   * @param cell
   */
  const fixError = (cell: CellData): void => {
    const sudoku = cloneDeep(state.sudoku);

    sudoku.setValue(cell.x, cell.y, CellValue.EMPTY);

    setState((prevState) => ({
      ...prevState,
      sudoku,
      highlightedCell: sudoku.getCell(cell.x, cell.y),
    }));

    addGameMessage({
      text: `You've made a mistake. Cell at ${cell.x + 1}/${
        cell.y + 1
      } was cleared for you. Hit 'Add Hint' again to get another hint.`,
      duration: 6000,
    });

    if (hintTimeoutRef.current !== undefined) {
      clearTimeout(hintTimeoutRef.current);
    }

    hintTimeoutRef.current = window.setTimeout(() => {
      setState((prevState) => ({
        ...prevState,
        highlightedCell: undefined,
      }));
    }, 5000);
  };

  /**
   * Give the user a hint and highlight how the given cell value could be deduced.
   */
  const giveHint = (): void => {
    if (!(state.isWorking || state.sudoku.isSolved())) {
      const sudoku = cloneDeep(state.sudoku);

      const wronglyFilledCells = state.sudoku.getWronglyFilledCells();
      if (wronglyFilledCells.length > 0) {
        fixError(pickRandomArrayValue(wronglyFilledCells));
        return;
      }

      const signature = sudoku.getFlatValues().join('');
      const candidates = logicRef.current?.signature === signature ? logicRef.current.candidates : candidatesFor(sudoku);
      const step = nextHintStep(sudoku, candidates);
      if (step) {
        if (hintTimeoutRef.current !== undefined) clearTimeout(hintTimeoutRef.current);
        applyLogicStep(sudoku, candidates, step, true);
        logicRef.current = {signature: sudoku.getFlatValues().join(''), candidates};
        setLogicStep(step);
        setHintCandidates(step.placement ? undefined : Object.fromEntries(
          [...step.sources, ...step.targets].map(cell => [`${cell.x},${cell.y}`, candidates.get(cell.y * 9 + cell.x) ?? []])
        ));
        setState(prev => ({...prev, sudoku,
          highlightedCell: sudoku.getCell(step.targets[0].x, step.targets[0].y),
          forceFocus: sudoku.getCell(step.targets[0].x, step.targets[0].y),
          secondaryHighlight: [...step.sources, ...step.targets].map(c => sudoku.getCell(c.x, c.y)),
          solutionShown: sudoku.isSolved(),
        }));
        return;
      }
      setLogicStep(undefined);
      setHintCandidates(undefined);
      const cellWithVal = getCellWithMinPossAndValueFromSolution(sudoku);

      if (cellWithVal) {
        const hintCellData = {
          ...cellWithVal[0],
          value: cellWithVal[1],
          isInitial: true,
        };
        sudoku.setValueUseCell(hintCellData);
        setState((prevState) => ({
          ...prevState,
          sudoku,
          highlightedCell: sudoku.getCell(hintCellData.x, hintCellData.y),
          forceFocus: sudoku.getCell(hintCellData.x, hintCellData.y),
          secondaryHighlight: [],
          solutionShown:
            prevState.sudoku.getNumberOfFilledCells() === BOARD_SIZE - 1,
        }));
        addGameMessage({
          text: `Value ${hintCellData.value} at (${hintCellData.x + 1}|${hintCellData.y + 1}) was filled in from solution.`,
          duration: 6000,
        });
      } else {
        addGameMessage({
          text: "Error giving hint.",
          duration: 6000,
        });
      }

      if (hintTimeoutRef.current !== undefined) {
        clearTimeout(hintTimeoutRef.current);
      }

      hintTimeoutRef.current = window.setTimeout(() => {
        setState((prevState) => ({
          ...prevState,
          highlightedCell: undefined,
          secondaryHighlight: [],
        }));
      }, 5000);
    }
  };

  const undo = () => {
    const sudoku = cloneDeep(state.sudoku);
    sudoku.undo();
    setState((prevState) => ({
      ...prevState,
      sudoku,
      solutionShown: false,
    }));
  };

  const percentFilled = () =>
    (state.sudoku.getNumberOfCorrectlyFilledCells() / BOARD_SIZE) * 100;
  const difficultyLabel = () => {
    switch (state.currentDifficulty) {
      case DIFFICULTY_LEVEL.EASY_NEW:
        return "Easiest";
      case DIFFICULTY_LEVEL.EASY:
        return "Easy";
      case DIFFICULTY_LEVEL.MEDIUM:
        return "Medium";
      default:
        return "Hard";
    }
  };

  const smallTextClass = "small-text";

  return (
    <Container style={{ padding: 0 }}>
      <MessageQueue messages={state.gameMessages}/>
      {logicStep && <section className="logic-step" aria-live="polite">
        <strong>{logicStep.technique}</strong><p>{logicStep.explanation}</p>
        <p>{logicStep.placement ? 'The forced value has been filled.' : 'Crossed-out candidates are eliminated. Outlined cells show the source pattern; dashed cells show where candidates are removed.'} Highlighted cells show the pattern and affected cells. Press Add Hint for the next step.</p>
        <Button onClick={() => {setLogicStep(undefined); setHintCandidates(undefined);}}>Hide explanation</Button>
      </section>}
      <Grid
        container
        spacing={3}
        style={{ padding: "2rem 0 0", position: "relative", zIndex: 3 }}
        className={`game${state.isWorking ? " working" : ""}`} sx={{justifyContent: "center"}}
      >
        <Grid className="board-column" size={{xs: 12, md: 8, lg: 6}} container sx={{justifyContent: "center"}}>
          <PaperBox className="board-card" sx={{...paperBoxDefaultLayoutSx, width: "100%"}}>
            <Box sx={{p: 1}}>
              <LinearProgress
                value={percentFilled()}
                variant={"determinate"}
                style={{ marginTop: "12px" }}
              />
              <Typography
                component={"legend"}
                style={{
                  textAlign: "center",
                  marginTop: ksuduoThemeNormal.spacing(1),
                }}
                className={smallTextClass}
              >
                {state.sudoku.getNumberOfCorrectlyFilledCells()} / {BOARD_SIZE}
              </Typography>
            </Box>
            <Board
                hintCandidates={hintCandidates}
                logicStep={logicStep}
              solutionIsFromApp={state.solutionShown}
              sudoku={state.sudoku}
              cellCallback={updateCallback}
              highlightedCell={state.highlightedCell}
              secondaryHighlight={state.secondaryHighlight}
              forceFocus={state.forceFocus}
              isPaused={state.isPaused}
              togglePaused={togglePaused}
              supportsInputMode={supportsInputModeAttribute}
            />
            <Box sx={{p: 1, display: "flex", justifyContent: "space-between"}}>
              <Typography component={"small"} className={smallTextClass}>
                Difficulty: {difficultyLabel()}
              </Typography>
              <Typography component={"small"} className={smallTextClass}>
                Hints: {state.sudoku.getNumberOfHints()}
              </Typography>
            </Box>
          </PaperBox>
        </Grid>
        <Grid
          className="game-controls"
          size="grow"
          container sx={{alignItems: "stretch", alignContent: "flex-start"}}
        >
          <Grid size={12}>
            <PaperBox
              className={`${smallTextClass} timer-card`} sx={{...paperBoxDefaultLayoutSx}}
            >
              <Clock
                secondsElapsed={state.secondsElapsed}
                isPaused={state.isPaused}
                togglePaused={togglePaused}
                isWorking={state.isWorking}
                solutionShown={state.solutionShown}
                solved={state.sudoku.isSolved()}
                visible={state.timerEnabled}
              />
              <Box sx={{justifyContent: "center", display: "flex"}}>
                <label
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Switch
                    checked={state.timerEnabled}
                    onChange={(event, value: boolean) => {
                      setState((prevState) => ({
                        ...prevState,
                        timerEnabled: value,
                      }));
                    }}
                  />
                  {`${
                    state.timerEnabled
                      ? "Click to hide timer"
                      : "Click to show timer"
                  }`}
                </label>
              </Box>
            </PaperBox>
          </Grid>
          <Grid size={12}>
            <PaperBox className="play-actions" sx={{...paperBoxDefaultLayoutSx, marginTop: [1, 2, 3], flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap"}}
            >
              <ThemeProvider theme={ksuduoThemeSecond}>
                <Button
                  endIcon={<UndoRounded />}
                  variant="outlined"
                  disabled={state.sudoku.isHistoryEmpty()}
                  onClick={undo}
                >
                  Undo
                </Button>
                <Button45Mt
                  endIcon={<HighlightOffRounded />}
                  onClick={resetSudoku}
                  variant="outlined"
                  color={"primary"}
                >
                  Reset
                </Button45Mt>
                <Button45Mt
                  endIcon={<EmojiObjectsRounded />}
                  color="secondary"
                  onClick={giveHint}
                  variant="outlined"
                >
                  Add Hint
                </Button45Mt>
              </ThemeProvider>
            </PaperBox>
          </Grid>
          <Grid size={12}>
            <PaperBox className="solution-card" sx={{...paperBoxDefaultLayoutSx, mt: [1, 2]}}>
              <Button
                endIcon={<HighlightRounded />}
                disabled={
                  state.sudoku.isSolved() || !state.sudoku.hasSolutionSet()
                }
                onClick={showSolution}
                variant="contained"
              >
                Show Solution
              </Button>
            </PaperBox>
          </Grid>
          <Grid size={12}>
            <PaperBox className="generation-card" sx={{...paperBoxDefaultLayoutSx, mt: [1, 2]}}>
              <GenerateButton
                onClick={generateSudoku}
                isWorking={state.isWorking}
                text="Generate sudoku"
              />
              <Button className="generation-info" size="small" startIcon={<InfoOutlined/>} onClick={() => setGenerationInfoOpen(true)} aria-label="About puzzle generation">
                {state.generatorMessage || "How puzzles are generated"}
              </Button>
              <Button size="small" onClick={() => setSettingsOpen(true)}>Puzzle settings</Button>

            </PaperBox>
          </Grid>
          <Grid size={12}>
            <PaperBox className="about-card" sx={{...paperBoxDefaultLayoutSx, mt: [1, 2]}}>
              <About />
            </PaperBox>
          </Grid>
        </Grid>
      </Grid>
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} fullWidth maxWidth="sm" aria-labelledby="puzzle-settings-title">
        <DialogTitle id="puzzle-settings-title">Puzzle settings</DialogTitle>
        <DialogContent>              <GeneratorConfiguration
                numberOfClues={state.numberOfClues}
                setNumberOfClues={updateNumberOfClues}
                difficulty={state.difficulty}
                difficultyOfCurrentPuzzle={state.currentDifficulty}
                setDifficulty={selectDifficulty}
                numberOfFilledCellsInCurrentPuzzle={state.sudoku.getNumberOfFilledCells()}
              /></DialogContent>
        <DialogActions><Button onClick={() => setSettingsOpen(false)}>Done</Button></DialogActions>
      </Dialog>
      <Dialog open={generationInfoOpen} onClose={() => setGenerationInfoOpen(false)} fullWidth maxWidth="sm" aria-labelledby="generation-info-title">
        <DialogTitle id="generation-info-title">How puzzles are generated</DialogTitle>
        <DialogContent>
          <p>Puzzles are generated from scratch in your browser. Each accepted clue removal leaves a puzzle solvable using the selected techniques. A separate backtracking solver checks final uniqueness.</p>
          <ul>
            <li><strong>Easiest:</strong> naked singles — only one candidate in a cell.</li>
            <li><strong>Easy:</strong> also hidden singles — only one place for a digit in a row, column or box.</li>
            <li><strong>Medium:</strong> also locked candidates — pointing and claiming between a box and a line.</li>
            <li><strong>Hard:</strong> also naked pairs — two cells reserve the same two candidates in a unit.</li>
          </ul>
          <p>The generator tries up to three puzzles to match your requested grade. The displayed rating is the lowest level that solves the puzzle using this app’s techniques, not a universal measure of human difficulty.</p>
          <p>If the search returns an easier puzzle, the game tells you; you can generate again. It may retain extra clues to stay within the technique limit. Fewer clues do not necessarily mean a harder puzzle.</p>
          {state.generatorMessage && <p><strong>This puzzle:</strong> {state.generatorMessage}</p>}
        </DialogContent>
        <DialogActions><Button onClick={() => setGenerationInfoOpen(false)}>Close</Button></DialogActions>
      </Dialog>
      <Modal open={winnerModalOpen} onClose={() => setWinnerModalOpen(false)}>
        <WinnerMessage>
          <Box sx={{display: "flex", justifyContent: "center"}}>
            <Icon children={<ThumbUp />} fontSize={"large"} />
          </Box>
          <Typography component={"h3"} variant={"h3"}>
            Good job!
          </Typography>
          <Typography style={{ margin: "1em 0" }}>
            You successfully completed the sudoku in{" "}
            {formatTime(state.secondsElapsed)}
          </Typography>

          <Box sx={{display: "flex", flexDirection: "column"}}>
            <Button
              style={{ marginBottom: ".75rem" }}
              title="Close this message"
              onClick={() => setWinnerModalOpen(false)}
              endIcon={<CheckCircleRounded />}
            >
              Close this message
            </Button>

            <GenerateButton
              onClick={() =>
                generateSudokuThen(() => setWinnerModalOpen(false))
              }
              isWorking={state.isWorking}
              text="Generate another sudoku with the same settings"
            />
          </Box>
        </WinnerMessage>
      </Modal>
    </Container>
  );
};
