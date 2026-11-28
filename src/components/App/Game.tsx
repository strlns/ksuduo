import {playAquaticCue, playCompletionSweep} from '../../audio/AquaticAudio';
import {NextHintButton} from './NextHintButton';
import {AudioControl} from './AudioControl';
import type {AnnotationRequest, AnnotationScope} from '../Board/annotations';
import {Menu, MenuItem, Tooltip, useMediaQuery} from '@mui/material';
import {MoreHorizRounded} from '@mui/icons-material';
import {Checkbox, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions} from "@mui/material";
import {MessageQueue} from "../Message/MessageQueue";
import {Candidates, candidatesFor, nextHintStep, applyLogicStep, LogicStep, techniqueExplanation, rateLogical, logicLevelNames, LogicLevel} from "../../algorithm/solver/logical";
import { ThemeProvider } from "@mui/material/styles";
import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Board, OptionalCell, NotesHistoryControls } from "../Board/Board";
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
  ExpandMoreRounded,
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
import {HintHistory, type HintChoice} from '../../gameplay/HintHistory';
import {explainHintDependencies} from '../../gameplay/explainHintDependencies';

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
  achievedRating?: LogicLevel;
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
  achievedRating,
} = restoreGameStateOrInitialize();

export const Game = (props: GameProps) => {
  const [state, setState] = useState({
    sudoku: initialBoard,
    numberOfClues: DEFAULT_CLUES,
    currentDifficulty,
    achievedRating,
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
    secondaryHighlight: [],
    forceFocus: undefined,
    isWorking: false,
    isPaused: false,
    generatorMessage: "",
    secondsElapsed: 0,
    initialBoardIsSolved: false,
    gameMessages: [],
  };

  const [supportsInputModeAttribute, setSupportsInputModeAttribute] =
    useState(false);

  const desktopSettings = useMediaQuery("(min-width:900px) and (min-height:850px)");
  const [arrivalVersion, setArrivalVersion] = useState(0);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [boardCelebrating, setBoardCelebrating] = useState(false);
  const [winnerModalOpen, setWinnerModalOpen] = React.useState(false);
  const mobileHints = useMediaQuery('(pointer: coarse)');
  // UI session preferences deliberately stay outside GameState and persistence.
  const [skipHintConfirmation, setSkipHintConfirmation] = useState(false);
  const [hintConfirmationOpen, setHintConfirmationOpen] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(true);
  const [stepByStep, setStepByStep] = useState(false);
  const [stepByStepOffer, setStepByStepOffer] = useState(false);
  const consecutiveHolds = useRef(0);
  const resetHintMode = () => {
    consecutiveHolds.current = 0;
    setStepByStep(false);
    setStepByStepOffer(false);
    setHintConfirmationOpen(false);
  };


  const pageIsVisible = usePageVisibility();

  interface StateFromGen {
    generatorMessage?: string;
    sudoku?: Sudoku;
    achievedRating?: LogicLevel;
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
          achievedRating: rateLogical(board),
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

  const [boardFocusRequest, setBoardFocusRequest] = useState(0);
  const puzzleArrived = (focusBoard: boolean) => {
    playAquaticCue();
    setArrivalVersion(version => version + 1);
    if (focusBoard) setBoardFocusRequest(version => version + 1);
  };
  const generateBoard = (focusBoard: boolean) => {
    resetHintMode();
    setHintActivationKey(0);
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
        if (result[1]) puzzleArrived(focusBoard);
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
          if (result[1]) puzzleArrived(focusBoard);
          timer.start();
        }, 25);
      });
    }
  };

  const generateSudoku = (focusBoard = true) => {
    hintHistory.current.clear();
    setReviewIndex(undefined);
    setCompletedCells([]);
    logicRef.current = undefined;
    setLogicStep(undefined);
    setHintCandidates(undefined);
    notesHistoryRef.current?.clear();
    generateBoard(focusBoard);
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
    resetHintMode();
    setHintActivationKey(0);
    hintHistory.current.clear();
    setReviewIndex(undefined);
    setCompletedCells([]);
    notesHistoryRef.current?.clear();
    setLogicStep(undefined);
    setHintCandidates(undefined);
    logicRef.current = undefined;
    setSelectionResetKey(key => key + 1);
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
    hintHistory.current.clear();
    setReviewIndex(undefined);
    setCompletedCells([]);
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
      achievedRating,
      solutionShown,
    } = state;
    persist({
      board,
      isPaused,
      secondsElapsed,
      timerEnabled,
      currentDifficulty,
      achievedRating,
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

  const [completedCells, setCompletedCells] = useState<string[]>([]);
  const [completionVersion, setCompletionVersion] = useState(0);
  useEffect(() => {
    if (!completedCells.length) return;
    const timeout = window.setTimeout(() => setCompletedCells([]), 2300);
    return () => window.clearTimeout(timeout);
  }, [completedCells]);
  const previousValues = useRef(state.sudoku.getFlatValues());
  const checkCompletedUnits = (board = state.sudoku) => {
    const before = previousValues.current;
    const after = board.getFlatValues();
    const units = [...board.getRows(), ...board.getColumns(), ...board.getBlocks().map(block => block.cells)];
    const solution = board.getSolution();
    const newlyCompleted = units.filter(unit =>
      unit.every(c => c.value && c.value === solution[c.y * 9 + c.x]) &&
      unit.some(c => before[c.y * 9 + c.x] !== solution[c.y * 9 + c.x]));
    if (!state.solutionShown && newlyCompleted.length) {
      playCompletionSweep();
      setCompletedCells([...new Set(newlyCompleted.flatMap(unit => unit.map(c => `${c.x},${c.y}`)))]);
      setCompletionVersion(version => version + 1);
    }
    previousValues.current = after;
  };
  // New puzzles, reset, undo and reveal establish a baseline without celebrating.
  useEffect(() => {previousValues.current = state.sudoku.getFlatValues();}, [state.sudoku]);

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
        generateSudoku(false);
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

  /* Show the completed board before opening the result dialog. Cancel on undo,
     reset, generation or unmount so an old completion cannot interrupt play. */
  useEffect(() => {
    const solved = state.sudoku.isSolved();
    setWinnerModalOpen(false);
    const celebrate = solved && !state.solutionShown && !state.initialBoardIsSolved && !state.isWorking;
    setBoardCelebrating(celebrate);
    if (solved) timer.pause();
    else if (!state.isPaused) timer.resume();
    if (!celebrate) return;
    if (document.activeElement instanceof HTMLElement && document.activeElement.matches('.cell input')) document.activeElement.blur();
    const timeout = window.setTimeout(() => {
      setBoardCelebrating(false);
      setWinnerModalOpen(true);
    }, reducedMotion ? 1000 : 2400);
    return () => window.clearTimeout(timeout);
  }, [state.sudoku.isSolved(), state.solutionShown, state.initialBoardIsSolved, state.isWorking, reducedMotion]);

  const selectDifficulty: React.ChangeEventHandler<HTMLSelectElement> = (
    event
  ) => {
    setState((prevState) => ({
      ...prevState,
      difficulty: +event.target.value as DIFFICULTY_LEVEL,
    }));
  };

  const logicRef = useRef<{signature: string; candidates: Candidates} | undefined>(undefined);
  const hintHistory = useRef(new HintHistory());
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
  const [hintActivationKey, setHintActivationKey] = useState(0);
  const notesHistoryRef = useRef<NotesHistoryControls>(null);
  const [hasNotesHistory, setHasNotesHistory] = useState(false);
  const [selectionResetKey, setSelectionResetKey] = useState(0);
  const [hasSelection, setHasSelection] = useState(true);
  const [annotationRequest, setAnnotationRequest] = useState<AnnotationRequest | undefined>(undefined);
  const [hintMenuAnchor, setHintMenuAnchor] = useState<HTMLElement | null>(null);
  const [explainerExpanded, setExplainerExpanded] = useState(false);
  const [explainerHidden, setExplainerHidden] = useState(false);
  const assistantToggle = useRef<HTMLButtonElement>(null);
  const restoreToggleFocus = useRef(false);
  const toggleAssistant = () => {
    restoreToggleFocus.current = document.activeElement === assistantToggle.current;
    setExplainerHidden(hidden => !hidden);
  };
  React.useLayoutEffect(() => {
    if (restoreToggleFocus.current) assistantToggle.current?.focus({preventScroll: true});
    restoreToggleFocus.current = false;
  }, [explainerHidden]);
  const [reviewIndex, setReviewIndex] = useState<number | undefined>(undefined);
  const [patternReplayKey, setPatternReplayKey] = useState(0);
  const [canAnnotateHint, setCanAnnotateHint] = useState(false);
  const [hasNotes, setHasNotes] = useState(false);
  const [confirmation, setConfirmation] = useState<{title: string; description: string; action: () => void} | null>(null);
  const hasProgress = hasNotes || hasNotesHistory || !state.sudoku.isHistoryEmpty() ||
    state.sudoku.getFlatCells().some(c => !c.isInitial && !!c.value);
  const confirmAction = (title: string, description: string, action: () => void) => {
    if (hasProgress) setConfirmation({title, description, action});
    else action();
  };
  const annotate = (scope: AnnotationScope) => {
    setHintMenuAnchor(null);
    const apply = () => setAnnotationRequest(previous => ({id: (previous?.id ?? 0) + 1, scope}));
    if (scope === 'all') confirmAction('Annotate all', 'Fill every empty cell with currently allowed candidates? This replaces existing notes in those cells and keeps the hint deductions.', apply);
    else apply();
  };
  const solverCandidates = useMemo(() => logicRef.current?.signature === currentSignature
    ? Object.fromEntries([...logicRef.current.candidates].map(([i, values]) => [`${i % 9},${Math.floor(i / 9)}`, values])) : undefined, [currentSignature, logicStep]);
  const [generationInfoOpen, setGenerationInfoOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  /**
   * Fix a wrongly filled cell and tell the user about it.
   * @param cell
   */
  const fixError = (cell: CellData, choice: HintChoice, candidates: Candidates): void => {
    const sudoku = cloneDeep(state.sudoku);
    setLogicStep(undefined);
    setHintCandidates(undefined);

    const before = hintHistory.current.begin(sudoku, candidates, choice);
    sudoku.setValue(cell.x, cell.y, CellValue.EMPTY);
    hintHistory.current.commit(before, sudoku, candidates);

    setState((prevState) => ({
      ...prevState,
      sudoku,
      highlightedCell: sudoku.getCell(cell.x, cell.y),
      secondaryHighlight: [],
    }));

    addGameMessage({
      text: `You've made a mistake. Cell at ${cell.x + 1}/${
        cell.y + 1
      } was cleared for you. Hit 'Add Hint' again to get another hint.`,
      duration: 6000,
    });
  };

  /**
   * Give the user a hint and highlight how the given cell value could be deduced.
   */
  const giveHint = (): void => {
    if (!(state.isWorking || state.sudoku.isSolved())) {
      playAquaticCue();
      setHintActivationKey(key => key + 1);
      setReviewIndex(undefined);
      const sudoku = cloneDeep(state.sudoku);

      const signature = sudoku.getFlatValues().join('');
      const candidates = logicRef.current?.signature === signature ? logicRef.current.candidates : candidatesFor(sudoku);
      let choice = hintHistory.current.replay(sudoku);
      if (!choice) {
        const wronglyFilledCells = sudoku.getWronglyFilledCells();
        if (wronglyFilledCells.length) choice = {kind: 'correction', cell: pickRandomArrayValue(wronglyFilledCells)};
        else {
          let step = nextHintStep(sudoku, candidates);
          if (!step) {
            const fallback = getCellWithMinPossAndValueFromSolution(sudoku);
            if (fallback) step = {
              technique: 'Saved solution', placement: true, value: fallback[1], sources: [], targets: [fallback[0]],
              explanation: `Value ${fallback[1]} at r${fallback[0].y + 1}c${fallback[0].x + 1} was filled in from the saved solution.`,
            };
          }
          if (step) step = explainHintDependencies(sudoku, candidates, step, hintHistory.current.hints.map(hint => hint.step));
          if (step) choice = {kind: 'step', step};
        }
      }
      if (!choice) {
        addGameMessage({text: 'Error giving hint.', duration: 6000});
        return;
      }
      if (choice.kind === 'correction') {
        fixError(choice.cell, choice, candidates);
        return;
      }
      const {step} = choice;
      const before = hintHistory.current.begin(sudoku, candidates, choice);
      applyLogicStep(sudoku, candidates, step, true);
      if (step.placement) sudoku.getCell(step.targets[0].x, step.targets[0].y).isHint = true;
      hintHistory.current.commit(before, sudoku, candidates, notesHistoryRef.current?.snapshot());
      checkCompletedUnits(sudoku);
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
    }
  };

  const [undoRipple, setUndoRipple] = useState(0);
  const undo = () => {
    setUndoRipple(version => version + 1);
    setReviewIndex(undefined);
    setCompletedCells([]);
    setSelectionResetKey(key => key + 1);
    setLogicStep(undefined);
    setHintCandidates(undefined);
    const sudoku = cloneDeep(state.sudoku);
    const notesUndone = notesHistoryRef.current?.undo() ?? false;
    const candidates = hintHistory.current.undo(state.sudoku, notesUndone);
    if (!notesUndone && !sudoku.isHistoryEmpty()) sudoku.undo();
    setLogicStep(hintHistory.current.hints.at(-1)?.step);
    logicRef.current = candidates ? {signature: sudoku.getFlatValues().join(''), candidates} : undefined;
    setState((prevState) => ({
      ...prevState,
      sudoku,
      solutionShown: false,
      forceFocus: undefined,
      highlightedCell: undefined,
      secondaryHighlight: [],
    }));
  };

  const hintDisabled = state.isWorking || state.isPaused || state.sudoku.isSolved() || reviewIndex !== undefined;
  function requestHint() {
    if (hintDisabled) return;
    if (skipHintConfirmation) giveHint();
    else {setDontAskAgain(true); setHintConfirmationOpen(true);}
  }
  function heldHint() {
    if (hintDisabled) return;
    giveHint();
    if (++consecutiveHolds.current === 2) setStepByStepOffer(true);
  }

  const percentFilled = () =>
    (state.sudoku.getNumberOfCorrectlyFilledCells() / BOARD_SIZE) * 100;
  const difficultyLabel = () => state.achievedRating === undefined ? 'Unrated' : logicLevelNames[state.achievedRating];

  const settingsConfiguration = (<GeneratorConfiguration
                numberOfClues={state.numberOfClues}
                setNumberOfClues={updateNumberOfClues}
                difficulty={state.difficulty}
                difficultyOfCurrentPuzzle={state.currentDifficulty}
                setDifficulty={selectDifficulty}
                numberOfFilledCellsInCurrentPuzzle={state.sudoku.getNumberOfFilledCells()}
              />);

  const showInlineSettings = desktopSettings && !explainerExpanded;
  const hints = hintHistory.current.hints;
  const shownHintIndex = Math.min(reviewIndex ?? hints.length - 1, hints.length - 1);
  const preview = reviewIndex !== undefined ? hints[shownHintIndex] : undefined;
  const shownStep = preview?.step ?? logicStep;
  const hasEmptyHintCells = shownStep && [...shownStep.sources, ...shownStep.targets].some(c => !state.sudoku.getCell(c.x, c.y).value);
  const idleHintText = hintActivationKey
    ? 'Choose Next Hint to explain a move from this position.'
    : 'Choose Next Hint to see which digit to place or cross out, and why.';
  const branchFromHint = () => {
    if (!preview) return;
    const branch = hintHistory.current.branchFrom(preview, state.sudoku);
    if (!branch) return;
    notesHistoryRef.current?.restore(branch.pencil);
    logicRef.current = {signature: branch.board.getFlatValues().join(''), candidates: branch.candidates};
    setHintCandidates(undefined);
    setLogicStep(preview.step);
    setReviewIndex(undefined);
    setCompletedCells([]);
    setSelectionResetKey(key => key + 1);
    setState(prev => ({...prev, sudoku: branch.board, solutionShown: false,
      highlightedCell: undefined, secondaryHighlight: [], forceFocus: undefined}));
  };
  const smallTextClass = "small-text";

  const sideBySide = useMediaQuery("(min-width:760px)");
  const hintAssistant = (
    <div className={`explainer-slot${explainerHidden ? ' explainer-hidden' : ''}`}>
      {explainerHidden ? <Button className="show-assistant" size="small" aria-label="Show hint assistant" ref={assistantToggle} onClick={toggleAssistant}>Hints</Button> :
      <section className={`logic-step${explainerExpanded ? ' explainer-expanded' : ''}${shownStep ? '' : ' logic-step-empty'}`} aria-label="Solving explanation" aria-live="polite">
        <header className="explainer-header">
          <div className="explainer-heading">
            <strong>{shownStep ? `${shownStep.technique}${shownStep.priorEliminations?.length ? ' · after eliminations' : ''}` : hintActivationKey ? 'Board changed' : 'Need a hint?'}</strong>
            <span className="explainer-summary">{shownStep?.explanation ?? idleHintText}</span>
          </div>
          <div className="explainer-actions">
            <NextHintButton guarded={mobileHints && !stepByStep} disabled={hintDisabled} onHint={mobileHints && stepByStep ? giveHint : requestHint} onHold={heldHint}/>
            <Button size="small" aria-label="Hide hint assistant" ref={assistantToggle} onClick={toggleAssistant}>Hide</Button>
            <Button className="explainer-toggle" size="small" aria-expanded={explainerExpanded} aria-controls="step-explanation" onClick={() => setExplainerExpanded(expanded => !expanded)}>{explainerExpanded ? 'Collapse' : 'Explain'}</Button>
            <span className="explainer-menu"><Tooltip title="Annotation options"><IconButton size="small" aria-label="Hint and annotation options" onClick={event => setHintMenuAnchor(event.currentTarget)}><MoreHorizRounded/></IconButton></Tooltip></span>
          </div>
        </header>
        <div className="hint-navigation">
          {hints.length > 0 && <nav className="hint-history" aria-label="Hint history">
            <Button size="small" aria-label="Previous hint" disabled={shownHintIndex <= 0} onClick={() => setReviewIndex(shownHintIndex - 1)}>‹</Button>
            <span>Hint {shownHintIndex + 1} of {hints.length}</span>
            <Button size="small" aria-label="Next hint" disabled={shownHintIndex >= hints.length - 1} onClick={() => setReviewIndex(shownHintIndex + 1 === hints.length - 1 && logicStep ? undefined : shownHintIndex + 1)}>›</Button>
          </nav>}
        </div>
        <div id="step-explanation" className="explainer-text" tabIndex={0} aria-label="Step explanation">
          <p>{shownStep?.explanation ?? idleHintText}</p>
          {shownStep && <p>{techniqueExplanation(shownStep)}</p>}
          {!!shownStep?.priorEliminations?.length && <p>This single is available because earlier {shownStep.priorEliminations.join(' and ')} steps removed candidates that the current row, column and block alone would still allow.</p>}
          {shownStep && !shownStep.placement && <p>Solid mint outlines mark the pattern; dashed amber outlines and crossed-out digits mark eliminations. The remaining notes are kept.</p>}
          {preview && <p>Saved board after this hint · read-only. Return to the current board to enter numbers or notes.</p>}
        </div>
        <div className="hint-tools">
          {shownStep && <Button size="small" onClick={() => setPatternReplayKey(key => key + 1)}>Show pattern</Button>}
          {hasEmptyHintCells && !preview && <Tooltip title={canAnnotateHint ? 'Add missing candidate notes in the cells used by this explanation' : 'These cells already show all remaining candidates'}><span><Button size="small" disabled={!canAnnotateHint || state.isPaused || state.isWorking} onClick={() => annotate('explanation')}>{canAnnotateHint ? 'Annotate these cells' : 'Notes already shown'}</Button></span></Tooltip>}
        </div>
        <small className="explainer-status">{preview ? 'Reviewing a saved hint · Undo always acts on the current game' : shownStep ? (shownStep.placement ? 'Digit placed · Next Hint continues' : 'Candidates crossed out · Next Hint continues') : ''}</small>
      </section>}
      </div>
  );

  return (
    <Container style={{ padding: 0 }}>
      <MessageQueue messages={state.gameMessages}/>
      <div className="gameplay-area">
      {!sideBySide && hintAssistant}
      <Grid
        container
        spacing={3}
        style={{ padding: "2rem 0 0", position: "relative", zIndex: 3 }}
        className={`game${state.isWorking ? " working" : ""}`} sx={{justifyContent: "center"}}
      >
        <Grid className="board-column" size={{xs: 12, md: 8, lg: 6}} container sx={{justifyContent: "center"}}>
          <PaperBox className={`board-card${boardCelebrating ? " board-celebrating" : ""}`} sx={{...paperBoxDefaultLayoutSx, width: "100%"}}>
            {arrivalVersion > 0 && <span key={arrivalVersion} className="board-arrival" aria-hidden="true"/>}
            <Box sx={{p: 1}}>
              <LinearProgress
                value={preview ? preview.board.getNumberOfCorrectlyFilledCells() / BOARD_SIZE * 100 : percentFilled()}
                variant={"determinate"}
                style={{ marginTop: "12px" }}
              />
              <Typography
                component={"legend"}
                role={boardCelebrating ? 'status' : undefined}
                style={{
                  textAlign: "center",
                  marginTop: ksuduoThemeNormal.spacing(1),
                }}
                className={smallTextClass}
              >
                {boardCelebrating && !preview ? '✓ Puzzle complete · ' : ''}{(preview?.board ?? state.sudoku).getNumberOfCorrectlyFilledCells()} / {BOARD_SIZE}
              </Typography>
            </Box>
            {preview && <div className="review-actions" role="group" aria-label="Hint review">
              <strong>Viewing hint {shownHintIndex + 1} of {hints.length} · Read-only</strong>
              <Button size="small" onClick={() => setReviewIndex(undefined)}>Current board</Button>
              <Button size="small" onClick={() => setConfirmation({
                title: 'Play from this hint',
                description: `Continue from hint ${shownHintIndex + 1}? This replaces later moves, hints and pencil marks. Earlier moves can still be undone.`,
                action: branchFromHint,
              })}>Play from this hint</Button>
            </div>}
            <Board
                touchKeypad={mobileHints}
                boardFocusRequest={boardFocusRequest}
                preview={preview}
                completedCells={preview ? [] : completedCells}
                completionVersion={completionVersion}
                patternReplayKey={patternReplayKey}
                onHintAnnotationAvailable={setCanAnnotateHint}
                onSolveAttempt={() => {consecutiveHolds.current = 0;}}
                onNotesPresent={setHasNotes}
                onAnnotateAll={() => annotate('all')}
                confirmAction={confirmAction}
                onInvalidNote={text => addGameMessage({text, duration: 3500})}
                notesHistoryRef={notesHistoryRef}
                onNotesHistoryChange={setHasNotesHistory}
                hintActivationKey={hintActivationKey}
                selectionResetKey={selectionResetKey}
                onSelectionChange={setHasSelection}
                annotationRequest={annotationRequest}
                solverCandidates={solverCandidates}
                hintCandidates={solverCandidates ? hintCandidates : undefined}
                logicStep={logicStep}
              solutionIsFromApp={state.solutionShown}
              sudoku={state.sudoku}
              cellCallback={() => {
                consecutiveHolds.current = 0;
                hintHistory.current.clear();
                setReviewIndex(undefined);
                logicRef.current = undefined;
                setLogicStep(undefined);
                setHintCandidates(undefined);
                setState(prev => ({...prev, highlightedCell: undefined, secondaryHighlight: [], forceFocus: undefined}));
                checkCompletedUnits(); updateCallback();
              }}
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
                Clues: {(preview?.board ?? state.sudoku).getNumberOfHints()}
              </Typography>
            </Box>
          </PaperBox>
        </Grid>
        {sideBySide && hintAssistant}
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
                  disabled={state.sudoku.isHistoryEmpty() && !hasNotesHistory}
                  onClick={undo}
                >
                  Undo
                  {undoRipple > 0 && <span key={undoRipple} aria-hidden="true" className="move-bubbles undo-bubbles"/>}
                </Button>
                <Button45Mt
                  endIcon={<HighlightOffRounded />}
                  onClick={() => confirmAction("Reset puzzle", "Clear entered numbers and all notes and restart this puzzle?", resetSudoku)}
                  variant="outlined"
                  color={"primary"}
                >
                  Reset
                </Button45Mt>
                <Button45Mt
                  endIcon={<EmojiObjectsRounded />}
                  color="secondary"
                  data-aquatic-cue
                  onClick={requestHint}
                  disabled={hintDisabled}
                  variant="outlined"
                >
                  Add Hint
                </Button45Mt>
              <Button
                endIcon={<HighlightRounded />}
                disabled={
                  state.sudoku.isSolved() || !state.sudoku.hasSolutionSet()
                }
                onClick={() => confirmAction("Show solution", "Reveal the complete solution? This ends your current solving attempt.", showSolution)}
                variant="outlined"
              >
                Show Solution
              </Button>
              <Button className="annotate-all-action" disabled={state.isWorking || state.isPaused || state.sudoku.isSolved() || !!preview} onClick={() => annotate('all')}>Annotate all</Button>
              </ThemeProvider>
            </PaperBox>
          </Grid>
          <Grid size={12}>
            <PaperBox className="generation-card" sx={{...paperBoxDefaultLayoutSx, mt: [1, 2]}}>
              <GenerateButton
                onClick={() => confirmAction("Generate puzzle", "Replace this puzzle and its entered numbers and notes?", generateSudoku)}
                isWorking={state.isWorking}
                text="Generate sudoku"
              />
              <Button className="generation-info" size="small" startIcon={<InfoOutlined/>} onClick={() => setGenerationInfoOpen(true)} aria-label="About puzzle generation">
                {state.generatorMessage || "How puzzles are generated"}
              </Button>
              {showInlineSettings ? <section className="inline-settings" aria-label="Puzzle settings">
                <Typography component="h2" variant="subtitle2">Puzzle settings</Typography>
                {settingsConfiguration}
              </section> : <Button className="settings-trigger" variant="outlined" endIcon={<ExpandMoreRounded/>} aria-label="Puzzle settings" aria-haspopup="dialog" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(true)}>
                {['Easy', 'Medium', 'Hard', 'Easiest', 'Extra Hard'][state.difficulty]} · {state.numberOfClues} hints goal
              </Button>}

            </PaperBox>
          </Grid>

        </Grid>
      </Grid>
      </div>
      <footer className="game-footer">

            <PaperBox className="about-card" sx={{...paperBoxDefaultLayoutSx, mt: [1, 2]}}>
              <a className="app-identity" href="https://strlns.github.io/ksuduo/" title="Ksuduo home">
                <strong>Ksuduo</strong>{" "}<span>strlns.github.io/ksuduo/</span>
              </a>
              <About />
              <AudioControl />
            </PaperBox>

      </footer>
      <Dialog open={hintConfirmationOpen} onClose={() => setHintConfirmationOpen(false)} aria-labelledby="hint-confirm-title" maxWidth="xs" fullWidth>
        <DialogTitle id="hint-confirm-title">Add a hint?</DialogTitle>
        <DialogContent>This reveals and applies the next solving step.
          <FormControlLabel control={<Checkbox checked={dontAskAgain} onChange={event => setDontAskAgain(event.target.checked)}/>} label="Don't ask again this session"/>
        </DialogContent>
        <DialogActions><Button onClick={() => setHintConfirmationOpen(false)}>Cancel</Button><Button disabled={hintDisabled} onClick={() => {setSkipHintConfirmation(dontAskAgain); setHintConfirmationOpen(false); giveHint();}}>Add Hint</Button></DialogActions>
      </Dialog>
      <Dialog open={stepByStepOffer} onClose={() => setStepByStepOffer(false)} aria-labelledby="step-mode-title" maxWidth="xs" fullWidth>
        <DialogTitle id="step-mode-title">Enable step-by-step mode?</DialogTitle>
        <DialogContent>Follow the hints for this game with a single tap on Next Hint, without holding.</DialogContent>
        <DialogActions><Button onClick={() => setStepByStepOffer(false)}>Keep holding</Button><Button onClick={() => {setStepByStep(true); setStepByStepOffer(false);}}>Enable</Button></DialogActions>
      </Dialog>
      <Dialog open={!!confirmation} onClose={() => setConfirmation(null)} aria-labelledby="confirm-action-title" maxWidth="xs" fullWidth>
        <DialogTitle id="confirm-action-title">{confirmation?.title}?</DialogTitle>
        <DialogContent>{confirmation?.description}</DialogContent>
        <DialogActions>
          <Button autoFocus onClick={() => setConfirmation(null)}>Cancel</Button>
          <Button onClick={() => {const action = confirmation?.action; setConfirmation(null); action?.();}}>Confirm {confirmation?.title.toLowerCase()}</Button>
        </DialogActions>
      </Dialog>
      <Menu anchorEl={hintMenuAnchor} open={!!hintMenuAnchor} onClose={() => setHintMenuAnchor(null)} slotProps={{list: {'aria-label': 'Hint and annotation options'}}}>
        <MenuItem disabled={state.isPaused || state.isWorking || !canAnnotateHint || !!preview} onClick={() => annotate('explanation')}>Annotate explanation cells</MenuItem>
        <MenuItem disabled={state.isPaused || state.isWorking || !hasSelection || !!preview} onClick={() => annotate('row')}>Annotate selected row</MenuItem>
        <MenuItem disabled={state.isPaused || state.isWorking || !hasSelection || !!preview} onClick={() => annotate('column')}>Annotate selected column</MenuItem>
        <MenuItem disabled={state.isPaused || state.isWorking || !hasSelection || !!preview} onClick={() => annotate('block')}>Annotate selected block</MenuItem>
        <MenuItem disabled={state.isPaused || state.isWorking || !!preview} onClick={() => annotate('all')}>Annotate all empty cells</MenuItem>
      </Menu>
      <Dialog open={settingsOpen && !showInlineSettings} onClose={() => setSettingsOpen(false)} fullWidth maxWidth="sm" aria-labelledby="puzzle-settings-title">
        <DialogTitle id="puzzle-settings-title">Puzzle settings</DialogTitle>
        <DialogContent>              {settingsConfiguration}</DialogContent>
        <DialogActions><Button onClick={() => setSettingsOpen(false)}>Done</Button></DialogActions>
      </Dialog>
      <Dialog open={generationInfoOpen} onClose={() => setGenerationInfoOpen(false)} fullWidth maxWidth="sm" aria-labelledby="generation-info-title">
        <DialogTitle id="generation-info-title">How puzzles are generated</DialogTitle>
        <DialogContent>
          <p>Puzzles are generated from scratch in your browser. Every returned puzzle is solvable using the selected techniques. A separate backtracking solver checks final uniqueness.</p>
          <ul>
            <li><strong>Easiest:</strong> naked singles — only one candidate in a cell.</li>
            <li><strong>Easy:</strong> also hidden singles — only one place for a digit in a row, column or box.</li>
            <li><strong>Medium:</strong> also locked candidates — pointing and claiming between a box and a line.</li>
            <li><strong>Hard:</strong> also naked pairs — two cells reserve the same two candidates in a unit.</li>
            <li><strong>Extra Hard:</strong> also X-Wing and Swordfish (patterns across parallel lines), and XY-Wing (a pivot and two wings force a candidate elimination).</li>
          </ul>
          <p>Easiest guarantees a solve using naked singles alone. The hint assistant still prefers row, column and block explanations (hidden singles), so the same forced digit may be explained in a different way.</p>
          <p>The generator first tries up to three puzzles to match your requested grade. If Hard or Extra Hard is still missed, it can explore up to four additional minimal unique puzzles and restore clues until the permitted techniques solve them. For Medium, Hard and Extra Hard, a bounded extra pass can remove more clues and restore those that preserve the need for the requested technique. For Hard and Extra Hard, the generator also compares removals and exchanges to see which make advanced techniques necessary earlier. If either goal is missed, the generator looks for a closer match by exchanging clues or restoring them to a smaller puzzle. The displayed rating is the lowest level that solves the puzzle using this app’s techniques.</p>
          <p>If the search returns an easier puzzle, the game tells you; you can generate again. The message shows the actual count if the search misses the clue goal. Fewer clues do not necessarily mean a harder puzzle.</p>
          {state.generatorMessage && <p><strong>This puzzle:</strong> {state.generatorMessage}</p>}
        </DialogContent>
        <DialogActions><Button onClick={() => setGenerationInfoOpen(false)}>Close</Button></DialogActions>
      </Dialog>
      <Modal open={winnerModalOpen} onClose={() => setWinnerModalOpen(false)}>
        <WinnerMessage role="dialog" aria-modal="true" aria-labelledby="winner-heading">
          <Box sx={{display: "flex", justifyContent: "center"}}>
            <Icon children={<ThumbUp />} fontSize={"large"} />
          </Box>
          <Typography id="winner-heading" component={"h3"} variant={"h3"}>
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
              onClick={() => {
                setWinnerModalOpen(false);
                confirmAction("Generate puzzle", "Replace the completed puzzle and its notes?", () => generateBoard(true));
              }}
              isWorking={state.isWorking}
              text="Generate another sudoku with the same settings"
            />
          </Box>
        </WinnerMessage>
      </Modal>
    </Container>
  );
};
