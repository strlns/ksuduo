import {createMuiTheme} from "@material-ui/core/styles";

const headingFont = '"Bangers Regular", "DejaVu Sans", Roboto, Helvetica, sans-serif"';
const bodyFont = '"DejaVu Sans", Roboto, Helvetica, sans-serif;'
export const ksuduoThemeNormal = createMuiTheme({
        // unfortunately, the Button component only
        // suports the values primary|secondary|default|inherit
        // for the color property (of which "default" is not supported by createMuiTheme)
        // and I'm not yet able to customize the types.
        // so I use 2 different themes for more colors.
        palette: {
            primary: {
                main: '#162467',
                contrastText: '#fff'
            },
            secondary: {
                main: '#8592c6',
                contrastText: '#fff'
            }
        },
        typography: {
            body1: {
                fontFamily: bodyFont,
                fontSize: '1rem',
            },
            h2: {
                fontFamily: headingFont,
                fontSize: '2.5rem',
            },
            h3: {
                fontFamily: headingFont,
                fontSize: '2rem',
            },
            subtitle1: {
                fontSize: '.75em'
            }
        },
        overrides: {
            MuiIconButton: {
                root: {
                    display: 'block'
                }
            }
        }
    })
;