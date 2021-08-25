import { IconButton, Theme, Typography } from "@material-ui/core";
import { CloseRounded } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import * as React from "react";
import { PaperBox } from "../MaterialUiTsHelper/PaperBox";

interface GameMessageBoxProps {
    message: GameMessage
}

export type GameMessage = {
    text: string,
    /*messages are not "self-destructing", timer is set on add.*/
    duration: number,
    dismissable?: boolean,
    dismiss?: () => void,
    key? : number
};

export const GAME_MSG_BOX_WIDTH = '24em';

export const GAME_MSG_BOX_SPACE = '.25rem'

export const GameMessageBox = React.memo(
    ({message}: GameMessageBoxProps) => {

        const classes = makeStyles((theme: Theme) => ({
            root: {
                width: GAME_MSG_BOX_WIDTH, 
                maxWidth: '80vw',
                zIndex: 999, 
                border: `1px solid ${theme.palette.text.primary}`,
                margin: GAME_MSG_BOX_SPACE,
                flexShrink: 0
            }
        }))();
        return <PaperBox
            display='flex'
            flexDirection='column'
            p={1} 
            className={classes.root}>
                {message.dismissable ?
                    <IconButton 
                    style={{flexShrink: 0, alignSelf: 'flex-end'}} 
                    size='small'
                    edge='end' 
                    title="Close" 
                    onClick={message.dismiss}>
                        <CloseRounded/>
                    </IconButton>
                : null}
                <Typography style={{fontSize: '.875rem'}}>
                    {message.text}
                </Typography>
            </PaperBox>
    }
);