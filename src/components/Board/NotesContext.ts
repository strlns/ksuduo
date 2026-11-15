import {createContext} from 'react';
export const NotesContext = createContext<Record<string, number[]>>({});

import type {LogicStep} from '../../algorithm/solver/logical';
export const LogicStepContext = createContext<LogicStep | undefined>(undefined);

export const SelectedCellContext = createContext<string | undefined>(undefined);
