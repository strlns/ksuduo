import * as React from "react";
import {Game} from "./Game";
import {ThemeProvider} from "@material-ui/styles";
import {ksuduoThemeNormal} from "../Theme/NormalKsuduoTheme";
import {GitHub} from "@material-ui/icons";
import {Box, IconButton, Link} from "@material-ui/core";

export const App = () => {
    return <ThemeProvider theme={ksuduoThemeNormal}>
        <Game/>
        <Box position="fixed" bottom={0} left={0}>
            <Link href="https://github.com/strlns/ksuduo" title="Source code">
                <IconButton>
                    <GitHub/>
                </IconButton>
            </Link>
        </Box>
    </ThemeProvider>
}