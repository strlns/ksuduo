import {Box, type BoxProps} from '@mui/material';
import * as React from 'react';
import {modalBaseSx} from './ModalBaseStyles';

export const WinnerMessage = React.forwardRef<HTMLDivElement, BoxProps>((props, ref) => (
    <Box {...props} ref={ref} tabIndex={-1} sx={[modalBaseSx, {fontSize: '2rem', fontWeight: 'bold'}]}>
        {props.children}
    </Box>
));
