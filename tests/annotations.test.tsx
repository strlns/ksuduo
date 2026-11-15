// @vitest-environment jsdom
import {act, cleanup, render, screen, fireEvent, waitFor} from '@testing-library/react';
import {afterEach, expect, it} from 'vitest';
import {Board} from '../src/components/Board/Board';
import {makeBoard} from './fixtures';
import type {LogicStep} from '../src/algorithm/solver/logical';
import {annotationsFor} from '../src/components/Board/annotations';
afterEach(()=>{cleanup();localStorage.clear();});
const props=(board:ReturnType<typeof makeBoard>)=>({sudoku:board,highlightedCell:undefined,secondaryHighlight:[],forceFocus:undefined,solutionIsFromApp:false,isPaused:false,togglePaused:()=>{},supportsInputMode:true});
it('retains elimination notes after the explanation is hidden and reloads them',async()=>{
 const board=makeBoard(),source=board.getCell(2,0),target=board.getCell(3,0);
 const step:LogicStep={technique:'Locked candidates',explanation:'test',sources:[source],targets:[target],value:2,placement:false};
 const {rerender,unmount}=render(<Board {...props(board)} logicStep={step} hintCandidates={{'2,0':[1,4],'3,0':[6]}}/>);
 const input=()=>screen.getByRole('textbox',{name:'Row 1, column 4'});
 expect(input().getAttribute('aria-description')).toContain('Eliminated 2');
 rerender(<Board {...props(board)}/>);
 expect(input().getAttribute('aria-description')).toBe('Notes: 6');
 expect(JSON.parse(localStorage.getItem('ksuduo-notes')!).notes['3,0']).toEqual([6]);
 unmount();render(<Board {...props(board)}/>);
 expect(input().getAttribute('aria-description')).toBe('Notes: 6');
});
it('has an off-by-default coordinate legend that hints enable and users can hide',()=>{
 const board=makeBoard(),{container,rerender}=render(<Board {...props(board)}/>);
 const frame=container.querySelector('.board-frame')!;
 expect(frame.classList.contains('coordinates-visible')).toBe(false);
 expect(screen.getByRole('button',{name:'Coordinate labels'}).getAttribute('aria-pressed')).toBe('false');
 const step:LogicStep={technique:'Hidden single',explanation:'test',sources:[board.getCell(2,0)],targets:[board.getCell(2,0)],value:4,placement:true};
 rerender(<Board {...props(board)} logicStep={step}/>);
 expect(frame.classList.contains('coordinates-visible')).toBe(true);
 fireEvent.click(screen.getByRole('button',{name:'Coordinate labels'}));
 expect(frame.classList.contains('coordinates-visible')).toBe(false);
 expect(container.querySelectorAll('.coordinate-columns span')).toHaveLength(9);
 expect(container.querySelectorAll('.coordinate-rows span')).toHaveLength(9);
});
it('annotates the whole board without restoring a solver-eliminated candidate',()=>{
 const board=makeBoard(),{rerender}=render(<Board {...props(board)}/>);
 rerender(<Board {...props(board)} solverCandidates={{'3,0':[6]}} annotationRequest={{id:1,scope:'all'}}/>);
 expect(screen.getByRole('textbox',{name:'Row 1, column 4'}).getAttribute('aria-description')).toBe('Notes: 6');
 expect(JSON.parse(localStorage.getItem('ksuduo-notes')!).notes['3,0']).toEqual([6]);
});
it('scopes extra annotations to the selected row, column, block or explanation',()=>{
 const board=makeBoard(),cell=board.getCell(2,0);
 for(const scope of ['row','column','block'] as const){
  const notes=annotationsFor(board,cell,scope);
  expect(Object.keys(notes).length).toBeGreaterThan(0);
  for(const key of Object.keys(notes)){
   const [x,y]=key.split(',').map(Number);
   if(scope==='row')expect(y).toBe(cell.y);
   if(scope==='column')expect(x).toBe(cell.x);
   if(scope==='block')expect(Math.floor(x/3)+3*Math.floor(y/3)).toBe(cell.blockIndex);
  }
 }
 const step:LogicStep={technique:'test',explanation:'test',sources:[cell],targets:[board.getCell(3,0)],value:2,placement:false};
 expect(Object.keys(annotationsFor(board,cell,'explanation',step)).sort()).toEqual(['2,0','3,0']);
});
it('undoes retained elimination annotations without undoing a number entry', () => {
 const board=makeBoard(), controls={current:null as import('../src/components/Board/Board').NotesHistoryControls|null};
 const {rerender}=render(<Board {...props(board)} notesHistoryRef={controls}/>);
 const step:LogicStep={technique:'Locked candidates',explanation:'test',sources:[board.getCell(2,0)],targets:[board.getCell(3,0)],value:2,placement:false};
 rerender(<Board {...props(board)} notesHistoryRef={controls} logicStep={step} hintCandidates={{'3,0':[6]}}/>);
 expect(JSON.parse(localStorage.getItem('ksuduo-notes')!).notes['3,0']).toEqual([6]);
 fireEvent.click(screen.getByRole('button',{name:'Annotate selected cell'}));
 act(()=>{expect(controls.current!.undo()).toBe(true);});
 rerender(<Board {...props(board)} notesHistoryRef={controls}/>);
 expect(screen.getByRole('textbox',{name:'Row 1, column 4'}).getAttribute('aria-description')).toBeNull();
 expect(JSON.parse(localStorage.getItem('ksuduo-notes')!).notes['3,0']).toBeUndefined();
 expect(screen.getByRole('textbox',{name:'Row 1, column 3'}).getAttribute('aria-description')).toBe('Notes: 1, 2, 4');
});

it.each(['rows', 'columns'] as const)('labels fish base and crossing %s and keeps eliminated notes across hints', orientation => {
 const board=makeBoard(), source=board.getCell(2,0),target=board.getCell(3,0);
 const step:LogicStep={technique:'Swordfish',explanation:'test',sources:[source],targets:[target],value:2,placement:false,
   fish:{orientation,bases:[0,3,6],covers:[1,4,7]}};
 const {container,rerender}=render(<Board {...props(board)} logicStep={step} hintCandidates={{'2,0':[2,4],'3,0':[6]}}/>);
 expect(container.querySelectorAll(`.coordinate-${orientation} .fish-base-label`)).toHaveLength(3);
 expect(container.querySelectorAll('.fish-cover-label')).toHaveLength(3);
 expect(container.querySelector('.coordinates-visible')).toBeTruthy();
 expect(container.querySelector('.candidate-removed')?.textContent).toBe('2');
 rerender(<Board {...props(board)}/>);
 expect(container.querySelectorAll('.fish-base-label,.fish-cover-label')).toHaveLength(0);
 expect(screen.getByRole('textbox',{name:'Row 1, column 4'}).getAttribute('aria-description')).toBe('Notes: 6');
});

it('focuses hint notes without deleting unrelated annotations', () => {
 const board=makeBoard(), step:LogicStep={technique:'Locked candidates',explanation:'test',sources:[board.getCell(2,0)],targets:[board.getCell(3,0)],value:2,placement:false};
 const {rerender}=render(<Board {...props(board)} annotationRequest={{id:1,scope:'all'}}/>);
 const unrelated=()=>screen.getByRole('textbox',{name:'Row 1, column 6'});
 expect(unrelated().getAttribute('aria-description')).toContain('Notes:');
 const saved=localStorage.getItem('ksuduo-notes');
 rerender(<Board {...props(board)} logicStep={step} focusHint/>);
 expect(unrelated().getAttribute('aria-description')).toBeNull();
 expect(localStorage.getItem('ksuduo-notes')).toBe(saved);
 rerender(<Board {...props(board)} logicStep={step} focusHint={false}/>);
 expect(unrelated().getAttribute('aria-description')).toContain('Notes:');
});
