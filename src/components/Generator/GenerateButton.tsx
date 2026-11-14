import {Button, CircularProgress} from '@mui/material';
import * as React from 'react';
import {FlareRounded} from '@mui/icons-material';

interface GenerateButtonProps {
    isWorking: boolean;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    text: string;
}

export const GenerateButton = ({isWorking, onClick, text}: GenerateButtonProps) => (
    <Button
        className={isWorking ? 'working' : undefined}
        variant="contained"
        color={isWorking ? 'secondary' : 'primary'}
        onClick={onClick}
        aria-busy={isWorking}
        sx={{width: '100%', mb: 2, transition: 'background .5s linear'}}
        // A fixed icon slot keeps the label centered and avoids a layout shift.
        endIcon={<span style={{display: 'inline-flex', width: '1em', height: '1em', alignItems: 'center', justifyContent: 'center'}}>
            {isWorking ? <CircularProgress color="inherit" size="1em" aria-label="Generating sudoku"/> : <FlareRounded fontSize="inherit"/>}
        </span>}
        title={text}
    >
        {text}
    </Button>
);
