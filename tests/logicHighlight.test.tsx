// @vitest-environment jsdom
import {createRef} from 'react';
import {cleanup, render, screen} from '@testing-library/react';
import {afterEach, expect, it} from 'vitest';
import Cell from '../src/components/Cell/Cell';
import {NotesContext, LogicStepContext} from '../src/components/Board/NotesContext';
import {makeBoard} from './fixtures';
import type {LogicStep} from '../src/algorithm/solver/logical';
afterEach(cleanup);
it.each(['Locked candidates','Naked pair'])('visualizes %s sources and crossed-out eliminations', technique=>{
 const board=makeBoard(),source=board.getCell(2,0),target=board.getCell(3,0);
 const step:LogicStep={technique,explanation:'test',sources:[source],targets:[target],value:2,placement:false};
 const renderCell=(cell:typeof source)=><Cell cell={cell} ref={createRef()} setCellValue={()=>{}} setFocusedCell={()=>{}} isHighlighted={false} isSecondarilyHighlighted={false} supportsInputMode/>;
 const {container}=render(<LogicStepContext.Provider value={step}><NotesContext.Provider value={{'2,0':[2,4], '3,0':[6]}}>{renderCell(source)}{renderCell(target)}</NotesContext.Provider></LogicStepContext.Provider>);
 expect(container.querySelectorAll('.logic-source')).toHaveLength(1);
 expect(container.querySelectorAll('.logic-target')).toHaveLength(1);
 expect(container.querySelector('.candidate-removed')?.textContent).toBe('2');
 expect(container.querySelector('.candidate-source')?.textContent).toBe('2');
 expect(screen.getByRole('textbox',{name:'Row 1, column 4'}).getAttribute('aria-description')).toContain('Eliminated 2');
});
