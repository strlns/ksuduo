import {Box, BoxProps} from "@material-ui/core";
import * as React from "react";
import {ModalBaseStyles} from "./ModalBaseStyles";
import {makeStyles} from "@material-ui/styles";
import clsx from 'clsx';

export const WinnerMessage = React.forwardRef((props: React.PropsWithChildren<BoxProps>) => {
    const winnerClasses = makeStyles({
        root: {
            color: 'green',
            fontSize: '2rem',
            fontWeight: 'bold',
            background: 'lightgreen',
        }
    });
    console.log(clsx(winnerClasses().root, ModalBaseStyles().root));
    return <Box className={clsx(winnerClasses().root, ModalBaseStyles().root)}>
        {props.children}
    </Box>
})