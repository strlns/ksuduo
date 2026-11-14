import * as React from 'react';
import {Game} from './Game';
import {ThemeProvider} from '@mui/material/styles';
import {ksuduoThemeNormal} from '../Theme/NormalKsuduoTheme';
import {GitHub} from '@mui/icons-material';
import {Box, Container, Link, Typography} from '@mui/material';

export const App = () => (
    <React.StrictMode>
        <ThemeProvider theme={ksuduoThemeNormal}>
            <Container sx={{position: 'relative', pb: 3}}>
                <Game/>
                <Box sx={{display: 'flex', justifyContent: 'center', mt: 3}}>
                    <Link sx={{display: 'inline-flex', alignItems: 'center', gap: 1, color: 'text.secondary', textDecoration: 'none'}}
                        href="https://github.com/strlns/ksuduo" title="Source code" className="link-inherit">
                        <GitHub fontSize="small"/>
                        <Typography variant="subtitle1">View on GitHub</Typography>
                    </Link>
                </Box>
            </Container>
        </ThemeProvider>
    </React.StrictMode>
);
