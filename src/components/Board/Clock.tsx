import * as React from "react";
import {
  Done,
  PauseCircleOutlineRounded,
  PlayCircleOutlineRounded,
  TimerRounded,
} from "@mui/icons-material";
import { Box, IconButton, LinearProgress } from "@mui/material";
import { formatTime } from "../../utility/formatTime";
import clsx from "clsx";
import { ksuduoThemeSecond } from "../Theme/SecondKsuduoTheme";
import Typography from "@mui/material/Typography";
import { ksuduoThemeNormal } from "../Theme/NormalKsuduoTheme";

interface ClockProps {
  secondsElapsed: number;
  isPaused: boolean;
  togglePaused: () => void;
  isWorking: boolean;
  solutionShown: boolean;
  solved: boolean;
  visible: boolean;
}

export const Clock = (props: ClockProps) => {
  if (props.isWorking) {
    return (
      <Box className="clock" sx={{flexWrap: "wrap"}}>
        <LinearProgress style={{ flexGrow: 1, flexBasis: "100%" }} />
        <Typography variant={"subtitle1"}>
          Generating sudoku from scratch. This may take a while...
        </Typography>
      </Box>
    );
  } else if (!props.visible) {
    return (
      <Box className="clock">
        <TimerRounded />
      </Box>
    );
  } else if (props.solutionShown) {
    return (
      <Box className="clock" sx={{justifyContent: "center"}}>
        <Done style={{ marginInlineEnd: ksuduoThemeNormal.spacing(1) }} />
        <Typography>Solution shown</Typography>
      </Box>
    );
  } else if (props.secondsElapsed === undefined || props.secondsElapsed < 0) {
    return (
      <Box className={clsx("clock", "pulse")}>
        <TimerRounded color={"primary"} className={"pulse"} />
      </Box>
    );
  } else if (props.solved) {
    return (
      <Box className={clsx("clock", "pulse")}>
        <Done style={{ fill: ksuduoThemeSecond.palette.secondary.main }} />
        Solved in {formatTime(props.secondsElapsed)}!
      </Box>
    );
  }
  return (
    <Box className="clock">
      <TimerRounded /> {formatTime(props.secondsElapsed)}
      <IconButton onClick={props.togglePaused}>
        {props.isPaused ? (
          <PlayCircleOutlineRounded color={"secondary"} />
        ) : (
          <PauseCircleOutlineRounded />
        )}
      </IconButton>
    </Box>
  );
};
