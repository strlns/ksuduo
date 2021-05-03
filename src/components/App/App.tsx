import * as React from "react";
import {Game} from "./Game";
import {ThemeProvider} from "@material-ui/styles";
import {ksuduoThemeNormal} from "../Theme/NormalKsuduoTheme";
import {GitHub} from "@material-ui/icons";
import {Box, Container, IconButton, Link, Typography} from "@material-ui/core";

export const App = () => (
    <React.StrictMode>
        <ThemeProvider theme={ksuduoThemeNormal}>
            <Container style={{position: 'relative', paddingBottom: '3rem'}}>
                <Game/>
                <Box position="fixed" bottom={0} left={0} display={'inline-flex'} flexDirection={'column'}>
                    <Link href="https://github.com/strlns/ksuduo" title="Source code">
                        <IconButton>
                            <GitHub/>
                        </IconButton>
                    </Link>
                    <Typography variant={"subtitle1"}
                                style={{
                                    alignSelf: 'flex-end', padding: '0 0 .5rem .75rem',
                                    color: '#cfcfcf', userSelect: 'none', pointerEvents: 'none'
                                }}>
                        View on GitHub
                    </Typography>
                </Box>
            </Container>
        </ThemeProvider>
    </React.StrictMode>
)