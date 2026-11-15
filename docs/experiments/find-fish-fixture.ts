import {gnomeGs4HardSudokus,almostDailyNightmareSudokus} from '../../src/examples/validExamples';
import {puzzleToSudoku} from '../../src/model/Sudoku';
import {solveLogically,candidatesFor,nextLogicStep,applyLogicStep} from '../../src/algorithm/solver/logical';
import {solveCheckUnique} from '../../src/algorithm/solver/solverBacktracking';
for(const puzzle of [...gnomeGs4HardSudokus,...almostDailyNightmareSudokus]) {
 const board=puzzleToSudoku(puzzle);
 if(solveLogically(board,3)||!solveLogically(board,4))continue;
 const input=board.getFlatValues().join(''),solution=solveCheckUnique(board),candidates=candidatesFor(board),fish=[];
 while(!board.isSolved()){const step=nextLogicStep(board,candidates,4)!;if(step.fish)fish.push(step.technique);applyLogicStep(board,candidates,step);}
 console.log(JSON.stringify({input,solution,fish}));break;
}
