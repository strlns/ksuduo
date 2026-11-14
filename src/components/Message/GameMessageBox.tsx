import {IconButton, Typography} from '@mui/material';
import {CloseRounded} from '@mui/icons-material';
import * as React from 'react';
import {PaperBox} from '../MaterialUiTsHelper/PaperBox';

interface GameMessageBoxProps {message: GameMessage}
export type GameMessage = {
    text: string;
    duration: number;
    dismissable?: boolean;
    dismiss?: () => void;
    key?: number;
};
export const GAME_MSG_BOX_WIDTH = '24em';
export const GAME_MSG_BOX_SPACE = '.25rem';

export const GameMessageBox = React.memo(({message}: GameMessageBoxProps) => (
    <PaperBox sx={{...({
        width: GAME_MSG_BOX_WIDTH, maxWidth: '80vw', zIndex: 999,
        border: '1px solid', borderColor: 'divider', m: GAME_MSG_BOX_SPACE, flexShrink: 0,
    }), display: "flex", flexDirection: "column", p: 1}}>
        {message.dismissable ? <IconButton sx={{flexShrink: 0, alignSelf: 'flex-end'}}
            size="small" edge="end" title="Close" onClick={message.dismiss}>
            <CloseRounded/>
        </IconButton> : null}
        <Typography sx={{fontSize: '.875rem'}}>{message.text}</Typography>
    </PaperBox>
));
