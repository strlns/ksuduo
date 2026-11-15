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
    <PaperBox sx={{display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.25,
        width: '100%', minWidth: 0, border: '1px solid', borderColor: 'divider'}}>
        <Typography sx={{fontSize: '.875rem', lineHeight: 1.45, overflowWrap: 'anywhere', flex: 1}}>{message.text}</Typography>
        {message.dismissable ? <IconButton sx={{flexShrink: 0, alignSelf: 'flex-start'}}
            size="small" edge="end" title="Dismiss notification" aria-label="Dismiss notification" onClick={message.dismiss}>
            <CloseRounded/>
        </IconButton> : null}
    </PaperBox>
));
