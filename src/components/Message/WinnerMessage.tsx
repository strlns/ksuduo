import {Box, withStyles} from "@material-ui/core";

export const WinnerMessage = withStyles(
    {
        root: {
            color: 'green',
            fontSize: '2rem',
            fontWeight: 'bold',
            position: 'absolute',
            top: '12rem',
            background: 'lightgreen',
            padding: '1rem',
            borderRadius: '.75rem',
            maxWidth: '30rem',
            left: '50%',
            transform: 'translateX(-50%)',
            filter: 'drop-shadow(2px 4px 6px black)',
            zIndex: 99
        }
    }
)(Box);