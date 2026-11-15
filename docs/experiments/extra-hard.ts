import {generateLogical} from '../../src/algorithm/generator/generatorLogical';
import {rateLogical,candidatesFor,nextLogicStep,applyLogicStep} from '../../src/algorithm/solver/logical';
import {solveCheckUnique} from '../../src/algorithm/solver/solverBacktracking';
import {Sudoku} from '../../src/model/Sudoku';
import {writeFileSync} from 'node:fs';
const results=[];
for (const seed of [49,50,51,52]) for (const clues of [20,24,28]) for (const level of [3,4] as const) {
 let state=seed; Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 const start=performance.now(); const board=generateLogical(clues,level);const ms=performance.now()-start;
 const grade=rateLogical(board), unique=Array.isArray(solveCheckUnique(board));
 if(grade===undefined||grade>level||!unique)throw Error('Invalid puzzle');
 const solving=Sudoku.cloneWithoutHistory(board), candidates=candidatesFor(solving), techniques=new Set<string>();
 for(let i=0;i<810&&!solving.isSolved();i++) {
  const step=nextLogicStep(solving,candidates,level); if(!step)throw Error('Missing path');
  for(const c of step.targets) if(step.placement ? step.value!==board.getSolution()[c.y*9+c.x] : step.value===board.getSolution()[c.y*9+c.x])throw Error('Unsound step');
  techniques.add(step.technique);applyLogicStep(solving,candidates,step);
 }
 const row={seed,clues,level,ms,grade,retained:board.getNumberOfHints(),unique,puzzle:board.getFlatValues().join(''),solution:board.getSolution().join(''),techniques:[...techniques]};
 results.push(row);console.log(JSON.stringify(row));writeFileSync('/tmp/extra-hard-results.json',JSON.stringify(results,null,2));
}
