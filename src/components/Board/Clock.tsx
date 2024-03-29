import * as React from "react";
import {Done, PauseCircleOutlineRounded, PlayCircleOutlineRounded, TimerRounded} from "@material-ui/icons";
import {Box, IconButton, LinearProgress} from "@material-ui/core";
import {formatTime} from "../../utility/formatTime";
import {makeStyles} from "@material-ui/core/styles";
import clsx from "clsx";
import {ksuduoThemeSecond} from "../Theme/SecondKsuduoTheme";
import Typography from "@material-ui/core/Typography";
import {ksuduoThemeNormal} from "../Theme/NormalKsuduoTheme";

interface ClockProps {
    secondsElapsed: number,
    isPaused: boolean,
    togglePaused: () => void,
    isWorking: boolean,
    solutionShown: boolean,
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
        return <Box className={classes.root} flexWrap={'wrap'}>
            <LinearProgress style={{flexGrow: 1, flexBasis: '100%'}}/>
            <Typography variant={'subtitle1'}>Generating sudoku from scratch. This may take a while...</Typography>
        </Box>
    } else if (!props.visible) {
        return <Box className={classes.root}>
            <TimerRounded/>
        </Box>
    } else if (props.solutionShown) {
        return <Box className={classes.root} justifyContent={'center'}>
            <Done style={{marginInlineEnd: ksuduoThemeNormal.spacing(1)}}/>
            <Typography>Solution shown</Typography>
        </Box>
    } else if (props.secondsElapsed === undefined || props.secondsElapsed < 2) {
        return <Box className={clsx(classes.root, 'pulse')}>
            <TimerRounded color={"primary"} className={'pulse'}/>
        </Box>
    } else if (props.solved) {
        return <Box className={clsx(classes.root, 'pulse')}>
            <Done style={{fill: ksuduoThemeSecond.palette.secondary.main}}/>
            Solved in {formatTime(props.secondsElapsed)}!
        </Box>
    }
    return <Box className={classes.root}>
        <TimerRounded/> {formatTime(props.secondsElapsed)}
        <IconButton onClick={props.togglePaused}>
            {
                props.isPaused ? <PlayCircleOutlineRounded color={"secondary"}/> : <PauseCircleOutlineRounded/>
            }
        </IconButton>
    </Box>
}