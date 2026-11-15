import {generateLogical} from '../../src/algorithm/generator/generatorLogical';
import {generateLogical as baseline} from './generator-baseline';
import {rateLogical} from '../../src/algorithm/solver/logical';
import {solveCheckUnique} from '../../src/algorithm/solver/solverBacktracking';
import {writeFileSync} from 'node:fs';
const rows = [];
for (const seed of Array.from({length:16},(_,i)=>i+17)) for (const clues of [24,28]) for (const [name,generate] of [['baseline',baseline],['frontier',generateLogical]] as const) {
 let state=seed; Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 const start=performance.now(); const board=generate(clues,3); const ms=performance.now()-start;
 const grade=rateLogical(board); const unique=Array.isArray(solveCheckUnique(board));
 if (!unique || grade===undefined || grade>3) throw Error('invalid');
 rows.push({seed,clues,name,ms,grade,retained:board.getNumberOfHints(),unique});
 console.log(JSON.stringify(rows.at(-1)));
 writeFileSync('/tmp/generator-results.json',JSON.stringify(rows,null,2));
}
