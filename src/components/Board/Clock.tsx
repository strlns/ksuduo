import * as React from "react";
import {Done, PauseCircleOutlineRounded, PlayCircleOutlineRounded, TimerRounded} from "@material-ui/icons";
import {Box, IconButton, LinearProgress} from "@material-ui/core";
import {formatTime} from "../../utility/formatTime";
import {makeStyles} from "@material-ui/styles";
import clsx from "clsx";
import {ksuduoThemeSecond} from "../Theme/SecondKsuduoTheme";

interface ClockProps {
    seconds: number,
    isPaused: boolean,
    setPaused: (val: boolean) => void,
    isWorking: boolean,
    solvedByApp: boolean,
    solved: boolean,
    visible: boolean
}

export const Clock = (props: ClockProps) => {
    const classes = makeStyles({
        root: {
            display: 'flex',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            minHeight: '3rem'
        }
    })();
    if (props.isWorking) {
        return <Box className={classes.root}>
            <LinearProgress style={{flexGrow: 1}}/>
        </Box>
    } else if (!props.visible) {
        return <Box className={classes.root}>
            <TimerRounded/>
        </Box>
    } else if (props.solvedByApp) {
        return <Box className={classes.root}>
            <Done/>
        </Box>
    } else if (props.seconds === undefined || props.seconds < 2) {
        return <Box className={clsx(classes.root, 'pulse')}>
            <TimerRounded color={"primary"} className={'pulse'}/>
        </Box>
    } else if (props.solved) {
        return <Box className={clsx(classes.root, 'pulse')}>
            <Done style={{fill: ksuduoThemeSecond.palette.secondary.main}}/>
            Solved in {formatTime(props.seconds)}!
        </Box>
    }
    return <Box className={classes.root}>
        <TimerRounded/> {formatTime(props.seconds)}
        <IconButton onClick={() => {
            props.setPaused(!props.isPaused)
        }}>
            {
                props.isPaused ? <PlayCircleOutlineRounded color={"secondary"}/> : <PauseCircleOutlineRounded/>
            }
        </IconButton>
    </Box>
}