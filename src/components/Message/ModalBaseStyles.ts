import {makeStyles} from "@material-ui/core/styles";
import {Theme} from "@material-ui/core";

export const ModalBaseStyles = makeStyles(
    (theme: Theme) => ({
        root: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            padding: '1rem',
            width: '100%',
            maxWidth: '92vw',
            maxHeight: '80vh',
            [theme.breakpoints.up('md')]: {
                maxWidth: '75vw',
                maxHeight: '50vh',
                padding: '3rem'
            },
            overflow: 'auto',
            backgroundColor: theme.palette.background.default,
            transform: 'translateX(-50%) translateY(-50%)',
            filter: 'drop-shadow(2px 4px 6px black)',
            zIndex: 9999,
            '& h3': {
                textAlign: 'left'
            }
        }
    })
);