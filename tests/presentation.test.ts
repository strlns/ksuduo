import {expect,it,vi} from 'vitest';
import {randomizePresentation} from '../src/algorithm/generator/randomizePresentation';
import {makeBoard} from './fixtures';
import {solveCheckUnique} from '../src/algorithm/solver/solverBacktracking';
it('randomizes geometry and digits while preserving givens, solution and input',()=>{
 const board=makeBoard(),before=board.getFlatValues();let seed=94;
 const random=vi.spyOn(Math,'random').mockImplementation(()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32));
 try {const result=randomizePresentation(board);expect(result.getNumberOfHints()).toBe(board.getNumberOfHints());expect(result.getFlatValues()).not.toEqual(before);expect(solveCheckUnique(result)).toEqual(result.getSolution());expect(board.getFlatValues()).toEqual(before);}finally{random.mockRestore();}
});
