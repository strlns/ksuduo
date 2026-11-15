import {Box, type BoxProps} from '@mui/material';
import * as React from 'react';
import {modalBaseSx} from './ModalBaseStyles';

export const WinnerMessage = React.forwardRef<HTMLDivElement, BoxProps>((props, ref) => (
    <Box className="victory-panel" {...props} ref={ref} tabIndex={-1} sx={[modalBaseSx, {fontSize: '2rem', fontWeight: 'bold'}]}>
        <div className="victory-bubbles" aria-hidden="true">
            {[5, 13, 23, 34, 44, 56, 66, 77, 87, 95].map((left, i) => <span key={left} style={{
                left: `${left}%`, width: `${24 + i % 4 * 12}px`, height: `${24 + i % 4 * 12}px`,
                animationDelay: `${i * .11}s`,
            }}/>) }
        </div>
        <div className="victory-crown" aria-hidden="true"><span>✓</span></div>
        <div className="victory-content">{props.children}</div>
    </Box>
));
