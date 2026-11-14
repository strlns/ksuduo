import {createTheme} from '@mui/material/styles';
import {ksuduoThemeNormal} from './NormalKsuduoTheme';

export const ksuduoThemeSecond = createTheme(ksuduoThemeNormal, {
    palette: {
        primary: {main: '#ffa985', contrastText: '#26170e'},
        secondary: {main: '#83dbb1', dark: '#399c74', light: '#c8f2dc', contrastText: '#07251a'},
    },
});
