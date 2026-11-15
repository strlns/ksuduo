import {generateLogical as baseline} from './pre-unique-digging';
import {generateLogical as candidate} from '../../src/algorithm/generator/generatorLogical';
import {rateLogical} from '../../src/algorithm/solver/logical';
import {solveCheckUnique} from '../../src/algorithm/solver/solverBacktracking';
import {writeFileSync} from 'node:fs';
const results=[];
for(let seed=33;seed<49;seed++) for(const [name,generate] of [['baseline',baseline],['candidate',candidate]] as const){
 let state=seed;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/2**32);
 const start=performance.now();const board=generate(24,3);const ms=performance.now()-start;
 const grade=rateLogical(board),unique=Array.isArray(solveCheckUnique(board));
 if(!unique||grade===undefined||grade>3)throw Error('Invalid result');
 const row={seed,name,ms,grade,clues:board.getNumberOfHints(),unique};results.push(row);console.log(row);
 writeFileSync('/tmp/unique-digging.json',JSON.stringify(results,null,2));
}
