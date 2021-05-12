import * as React from "react";
import {Game} from "./Game";
import {ThemeProvider} from "@material-ui/styles";
import {ksuduoThemeNormal} from "../Theme/NormalKsuduoTheme";
import {GitHub} from "@material-ui/icons";
import {Box, Container, IconButton, Link, Typography} from "@material-ui/core";

export const App = () => {
    return <React.StrictMode>
        <ThemeProvider theme={ksuduoThemeNormal}>
            <Container style={{position: 'relative', paddingBottom: '3rem'}}>
                <Game/>
                <Box position="absolute" bottom={0} left={0}>
                    <Link style={{display: 'flex', alignItems: 'center'}} href="https://github.com/strlns/ksuduo"
                          title="Source code" className={'link-inherit'}>
                        <IconButton>
                            <GitHub/>
                        </IconButton>
                        <Typography variant={"subtitle1"}
                                    style={{
                                        color: 'black', userSelect: 'none', pointerEvents: 'none'
                                    }}>
                            View on GitHub
                        </Typography>
                    </Link>
                </Box>
            </Container>
        </ThemeProvider>
    </React.StrictMode>
}