import {Button, CircularProgress} from "@material-ui/core";
import * as React from "react";
import {FlareRounded} from "@material-ui/icons";
import {makeStyles} from "@material-ui/styles";

interface GenerateButtonProps {
    isWorking: boolean,
    onClick?: React.MouseEventHandler<HTMLButtonElement>
}

const useStyles = makeStyles({
    root: {
        width: '100%',
        transition: 'background .5s linear',
    }
});

export const GenerateButton =
    (props: GenerateButtonProps) => {
        const classes = useStyles();
        return <Button
            className={classes.root + `${props.isWorking ? ' working' : ''}`}
            variant="contained"
            color={props.isWorking ? 'secondary' : 'primary'}
            onClick={props.onClick ?? void (0)}
            endIcon={<FlareRounded/>}>
            <span style={{position: 'relative', padding: '0 1.5em'}}>
                {props.isWorking ? <CircularProgress
                    style={{position: 'absolute', left: '-1.25em', top: 'calc(50% - .5em)'}}
                    color={'inherit'} size={'1em'}/> : null}
                Generate Sudoku
            </span>
        </Button>
    }
