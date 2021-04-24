import * as React from "react";
import {PauseCircleOutlineRounded, PlayCircleOutlineRounded, TimerRounded} from "@material-ui/icons";
import {Box, IconButton} from "@material-ui/core";

interface ClockProps {
    seconds: number,
    isPaused: boolean,
    setPaused: (val: boolean) => void,
}

const formatTime = (seconds: number) => {
    if (!seconds) return '';
    return seconds > 60 ? `${Math.floor(seconds / 60)}min ${seconds % 60}s` : `${seconds}s`;
}

export const Clock = (props: ClockProps) => {
    return <Box flexDirection={"row"} display="flex" justifyContent="space-evenly" alignItems={"center"}>
        <TimerRounded/> {formatTime(props.seconds)}
        <IconButton onClick={() => {
            props.setPaused(!props.isPaused)
        }}>
            {props.isPaused ? <PlayCircleOutlineRounded/> : <PauseCircleOutlineRounded/>}
        </IconButton>
    </Box>
}