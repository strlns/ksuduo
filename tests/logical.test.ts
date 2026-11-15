import {expect, it, vi, afterEach} from 'vitest';
import {candidatesFor, nextLogicStep, applyLogicStep, solveLogically, rateLogical} from '../src/algorithm/solver/logical';
import {generateLogical} from '../src/algorithm/generator/generatorLogical';
import {solveCheckUnique} from '../src/algorithm/solver/solverBacktracking';
import {Sudoku} from '../src/model/Sudoku';
import {makeBoard, solution} from './fixtures';
afterEach(() => vi.restoreAllMocks());
it('solves a fixed puzzle with singles without mutating it', () => {
 const board = makeBoard(); const before = board.getFlatValues();
 expect(solveLogically(board, 1)).toBe(true); expect(board.getFlatValues()).toEqual(before);
});
it.each([0,1,2,3] as const)('generated level %i has a complete permitted path and a unique solution', level => {
 let seed=42; vi.spyOn(Math, 'random').mockImplementation(() => ((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296));
 const board=generateLogical(28,level);
 expect(board.getNumberOfHints()).toBeLessThan(81);
 expect(solveLogically(board,level)).toBe(true);
 expect(solveCheckUnique(board)).toEqual(board.getSolution());
});
it('every deduction on fixed generated puzzles preserves the known solution', () => {
 let seed=2; vi.spyOn(Math, 'random').mockImplementation(() => ((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296));
 const board=generateLogical(24,3); const knownSolution=board.getSolution(); const candidates=candidatesFor(board);
 for(let i=0;i<810 && !board.isSolved();i++) {
  const step=nextLogicStep(board,candidates,3); expect(step).toBeDefined();
  for(const c of step!.targets) {
   if(step!.placement) expect(step!.value).toBe(knownSolution[c.y*9+c.x]);
   else expect(step!.value).not.toBe(knownSolution[c.y*9+c.x]);
  }
  applyLogicStep(board,candidates,step!);
 }
 expect(board.isSolved()).toBe(true);
});
it('locked candidates eliminate only on the intersecting line outside the source box', () => {
 const board=new Sudoku(); const candidates=candidatesFor(board);
 // Digit 1 in the top-left box is confined to its first row.
 for(const c of board.getBlocks()[0].cells) if(c.y!==0) candidates.set(c.y*9+c.x,[2,3,4,5,6,7,8,9]);
 const step=nextLogicStep(board,candidates,2)!;
 expect(step.technique).toBe('Locked candidates'); expect(step.value).toBe(1);
 expect(step.sources.map(c=>c.y)).toEqual([0,0,0]);
 expect(step.targets.every(c=>c.y===0 && c.x>=3)).toBe(true);
 expect(nextLogicStep(board,candidates,1)).toBeUndefined();
});
it('naked pairs remove their digits only from peers in the shared unit', () => {
 const board=new Sudoku(); const candidates=candidatesFor(board);
 candidates.set(0,[1,2]); candidates.set(4,[1,2]);
 const step=nextLogicStep(board,candidates,3)!;
 expect(step.technique).toBe('Naked pair');
 expect(step.targets.every(c=>c.y===0 && c.x!==0 && c.x!==4)).toBe(true);
 expect(nextLogicStep(board,candidates,2)).toBeUndefined();
});
it('uniqueness solver rejects conflicting givens and exhausted searches', () => {
 const invalid=solution.slice(); invalid[0]=invalid[1];
 expect(Array.isArray(solveCheckUnique(invalid))).toBe(false);
 expect(Array.isArray(solveCheckUnique(makeBoard(),1))).toBe(false);
});

const ratedFixtures = [
 [1, '000003000042000190090500802000070009028000040000002600000050000300000504000340201'],
 [2, '007802000152090006003000000400100060006500000300004802060240005000060410000000000'],
 [3, '060080200080160070000007000030000000042300910008021307000208000300090000010004060'],
] as const;
it.each(ratedFixtures)('grade %i fixture needs its technique level and remains unique', (level, text) => {
 const board=new Sudoku();board.initWithNumbers([...text].map(Number),false);
 expect(solveLogically(board,(level-1) as 0|1|2)).toBe(false);
 expect(solveLogically(board,level)).toBe(true);
 expect(rateLogical(board)).toBe(level);
 const solution=solveCheckUnique(board);expect(Array.isArray(solution)).toBe(true);
 const candidates=candidatesFor(board);let eliminations=0;
 for(let i=0;i<810&&!board.isSolved();i++) {
  const step=nextLogicStep(board,candidates,level)!;expect(step).toBeDefined();
  for(const cell of step.targets) {
   if(step.placement) expect(step.value).toBe((solution as number[])[cell.y*9+cell.x]);
   else {expect(step.value).not.toBe((solution as number[])[cell.y*9+cell.x]);eliminations++;}
  }
  applyLogicStep(board,candidates,step);
 }
 expect(board.isSolved()).toBe(true);if(level>1)expect(eliminations).toBeGreaterThan(0);
});
it('rejects rating an ambiguous rectangle',()=>{
 const board=new Sudoku();board.initWithNumbers(solution,false);
 for(const [x,y] of [[3,0],[4,0],[3,3],[4,3]] as const)board.clearCell(board.getCell(x,y),false);
 expect(rateLogical(board)).toBeUndefined();
});
it('bounded generation can achieve Hard and reports its actual grade',()=>{
 let seed=4;vi.spyOn(Math,'random').mockImplementation(()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296));
 expect(rateLogical(generateLogical(24,3,1))).toBe(3);
});

it('reproduces the same generated puzzle when the random seed is reset',()=>{
 let seed=17;vi.spyOn(Math,'random').mockImplementation(()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296));
 const first=generateLogical(28,1,1).getFlatValues();seed=17;
 expect(generateLogical(28,1,1).getFlatValues()).toEqual(first);
});
it('chooses freely between unit explanations while keeping grading cell-first', async()=>{
 const {nextHintStep,unitSingleSteps}=await import('../src/algorithm/solver/logical');
 const board=makeBoard(), candidates=candidatesFor(board), before=board.getFlatValues();
 expect(nextLogicStep(board,candidates)?.technique).toBe('Naked single');
 const choices=unitSingleSteps(board,candidates);
 expect(new Set(choices.map(s=>s.explanation.match(/in (row|column|block)/)![1]))).toEqual(new Set(['row','column','block']));
 const random=vi.spyOn(Math,'random');
 for(let i=0;i<choices.length;i++) {
  random.mockReturnValue((i+.5)/choices.length);
  const hint=nextHintStep(board,candidates)!;
  expect(hint).toEqual(choices[i]);
  expect(hint.value).toBe(solution[hint.targets[0].y*9+hint.targets[0].x]);
 }
 expect(board.getFlatValues()).toEqual(before);
});
it('gameplay still falls back to a naked single when no unit has a unique place', async()=>{
 const {nextHintStep}=await import('../src/algorithm/solver/logical');
 const board=new Sudoku(), candidates=candidatesFor(board); candidates.set(0,[1]);
 expect(nextHintStep(board,candidates)?.technique).toBe('Naked single');
});
