import {withStyles} from "@material-ui/styles";
import {Button as MaterialButton, createStyles} from "@material-ui/core";

const styles = createStyles({
    root: {
        marginTop: '1rem',
        width: '100%'
    }
});

export const Button
    = withStyles(styles)(MaterialButton);