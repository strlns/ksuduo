import * as React from "react";
import {PauseCircleOutlineRounded, PlayCircleOutlineRounded, TimerRounded} from "@material-ui/icons";
import {Box, IconButton} from "@material-ui/core";
import {formatTime} from "../../utility/formatTime";

interface ClockProps {
    seconds: number,
    isPaused: boolean,
    setPaused: (val: boolean) => void,
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