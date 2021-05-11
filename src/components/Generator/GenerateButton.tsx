import {Button, CircularProgress} from "@material-ui/core";
import * as React from "react";
import {FlareRounded} from "@material-ui/icons";
import {makeStyles} from "@material-ui/core/styles";
import {ksuduoThemeNormal} from "../Theme/NormalKsuduoTheme";

interface GenerateButtonProps {
    isWorking: boolean,
    onClick?: React.MouseEventHandler<HTMLButtonElement>
}

const buttonStyles = makeStyles({
    root: {
        width: '100%',
        transition: 'background .5s linear',
        marginBottom: ksuduoThemeNormal.spacing(2)
    }
});

const innerStyles = makeStyles(theme => ({
    root: {
        position: 'relative',
        padding: '0 1.5em',
        [theme.breakpoints.up('sm')]: {
            marginLeft: '-1.5em',
            paddingLeft: '1.5em',
        },
    }
}));


const loaderStyles = makeStyles(theme => ({
    root: {
        position: 'absolute',
        left: 0,
        [theme.breakpoints.up('sm')]: {
            left: '-1.25em',
        },
        top: 'calc(50% - .5em)'
    }
}));

export const GenerateButton =
    (props: GenerateButtonProps) => {
        const [btnClass, innerClass, loaderClass] = [buttonStyles(), innerStyles(), loaderStyles()];
        return <Button
            className={btnClass.root + `${props.isWorking ? ' working' : ''}`}
            variant="contained"
            color={props.isWorking ? 'secondary' : 'primary'}
            onClick={props.onClick ?? void (0)}
            endIcon={<FlareRounded/>}>
            <div className={innerClass.root}>
                {props.isWorking ? <CircularProgress
                    className={loaderClass.root}
                    color={'inherit'} size={'1em'}/> : null}
                Generate Sudoku
            </div>
        </Button>
    }
