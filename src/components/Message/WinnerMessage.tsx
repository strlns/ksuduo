import {Box, type BoxProps} from '@mui/material';
import * as React from 'react';
import {modalBaseSx} from './ModalBaseStyles';

export const WinnerMessage = React.forwardRef<HTMLDivElement, BoxProps>((props, ref) => (
    <Box {...props} ref={ref} tabIndex={-1} sx={[modalBaseSx, {fontSize: '2rem', fontWeight: 'bold'}]}>
        <div className="victory-bubbles" aria-hidden="true">
            {[12, 27, 41, 58, 73, 88].map((left, i) => <span key={left} style={{
                left: `${left}%`, width: `${12 + i % 3 * 8}px`, height: `${12 + i % 3 * 8}px`,
                animationDelay: `${i * .07}s`,
            }}/>) }
        </div>
        <div className="victory-content">{props.children}</div>
    </Box>
));
