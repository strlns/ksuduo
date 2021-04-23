import {createMuiTheme} from "@material-ui/core/styles";

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
    })
;