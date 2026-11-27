import {createTheme} from '@mui/material/styles';

export const ksuduoThemeNormal = createTheme({
    palette: {
        mode: 'dark',
        primary: {main: '#76dbcf', contrastText: '#05202a'},
        secondary: {main: '#b9b3d6', contrastText: '#071b27'},
        background: {default: '#061722', paper: '#102734'},
        text: {primary: '#e4f0f3', secondary: '#adbec7'},
        divider: '#294552',
    },
    breakpoints: {values: {xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920}},
    shape: {borderRadius: 5},
    typography: {
        fontFamily: '"IBM Plex Sans", sans-serif',
        body1: {fontSize: '1rem'},
        h2: {fontSize: '2.5rem'},
        h3: {fontSize: '2rem'},
        subtitle1: {fontSize: '.75em'},
        button: {fontWeight: 600},
    },
    components: {
        MuiPaper: {styleOverrides: {root: {
            backgroundImage: 'linear-gradient(145deg, #8ce8d807, transparent 45%, #afa0d505)',
            border: '1px solid #294552',
            boxShadow: '0 12px 36px #00000030',
        }}},
        MuiButton: {
            defaultProps: {disableElevation: true},
            styleOverrides: {
                root: {
                    minHeight: 40,
                    borderRadius: '9px 4px 9px 4px',
                    letterSpacing: '.055em',
                    fontSize: '.8rem',
                    transition: 'background .18s, box-shadow .18s, transform .18s',
                    '&:active': {transform: 'translateY(1px)'},
                },
                outlined: {
                    background: 'linear-gradient(180deg, #ffffff0a, #ffffff02)',
                    borderColor: 'currentColor',
                    borderBottomWidth: 3,
                    boxShadow: 'inset 0 1px #ffffff10, 0 2px 3px #00000030',
                    '&:hover': {backgroundColor: '#ffffff0d', boxShadow: 'inset 0 1px #ffffff20, 0 3px 8px #00000040', transform: 'translateY(-1px)'},
                    '&.Mui-disabled': {borderBottomWidth: 3, boxShadow: 'none'},
                },
                contained: {
                    backgroundImage: 'linear-gradient(180deg, #ffffff24, #0000000a)',
                    borderBottom: '3px solid #00000030',
                    boxShadow: 'inset 0 1px #ffffff55, 0 2px 6px #00000025',
                    '&:hover': {boxShadow: 'inset 0 1px #ffffff65, 0 4px 12px #00000040', transform: 'translateY(-1px)'},
                },
            },
        },
        MuiLinearProgress: {styleOverrides: {root: {height: 4, borderRadius: 4}}},
    },
});
