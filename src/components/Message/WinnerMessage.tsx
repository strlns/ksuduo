import {Box, BoxProps, Theme} from "@material-ui/core";
import * as React from "react";
import {ModalBaseStyles} from "./ModalBaseStyles";
import {makeStyles} from "@material-ui/core/styles";
import clsx from 'clsx';

// IDE complains about unused `ref` paramter, React complains about missing `ref` paramter at runtime (in dev mode).
// Win Win!
// noinspection JSUnusedLocalSymbols
export const WinnerMessage = React.forwardRef((props: React.PropsWithChildren<BoxProps>, ref) => {
    const winnerClasses = makeStyles((theme: Theme) => ({
        root: {
            fontSize: '2rem',
            fontWeight: 'bold',
            backgroundColor: '#B6FFF1',
        }
    }));
    return <Box className={clsx(winnerClasses().root, ModalBaseStyles().root)}>
        {props.children}
    </Box>
})