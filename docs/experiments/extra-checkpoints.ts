import {generateLogical as baseline} from './pre-extra-checkpoints';
import {generateLogical as checkpoint} from '../../src/algorithm/generator/generatorLogical';
import {rateLogical,candidatesFor,nextLogicStep,applyLogicStep} from '../../src/algorithm/solver/logical';
import {solveCheckUnique} from '../../src/algorithm/solver/solverBacktracking';
import {Sudoku} from '../../src/model/Sudoku';
import {writeFileSync} from 'node:fs';
const results=[];
for (const seed of [53,54,55,56,57,58,59,60]) for(const [name,generate] of [['baseline',baseline],['checkpoint',checkpoint]] as const) {
 let state=seed;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 const start=performance.now();const board=generate(24,4);const ms=performance.now()-start;
 const grade=rateLogical(board),unique=Array.isArray(solveCheckUnique(board));if(!unique||grade===undefined||grade>4)throw Error('Invalid');
 const solve=Sudoku.cloneWithoutHistory(board),candidates=candidatesFor(solve),techniques=new Set<string>();
 while(!solve.isSolved()) {const step=nextLogicStep(solve,candidates,4)!;if(!step)throw Error('stalled');
 for(const c of step.targets)if(step.placement?step.value!==board.getSolution()[c.y*9+c.x]:step.value===board.getSolution()[c.y*9+c.x])throw Error('Invalid deduction');
 techniques.add(step.technique);applyLogicStep(solve,candidates,step);}
 const row={seed,name,ms,grade,clues:board.getNumberOfHints(),unique,puzzle:board.getFlatValues().join(''),solution:board.getSolution().join(''),techniques:[...techniques]};
 results.push(row);console.log(JSON.stringify(row));writeFileSync('/tmp/extra-checkpoints.json',JSON.stringify(results,null,2));
}
