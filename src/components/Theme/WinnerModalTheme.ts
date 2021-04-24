import {createMuiTheme} from "@material-ui/core/styles";
import {ksuduoThemeNormal} from "./NormalKsuduoTheme";

export const ksuduoThemeSecondWinnerModal = createMuiTheme({
        typography: {
            ...ksuduoThemeNormal.typography
        },
        palette: {
            primary: {
                main: '#ff3A09',
            },
            secondary: {
                main: '#008000',
                dark: '#008000',
                light: '#d0eac9'
            }
        },
    })
;