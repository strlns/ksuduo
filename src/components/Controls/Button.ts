import {withStyles} from "@material-ui/styles";
import {Button as MaterialButton, createStyles, Theme} from "@material-ui/core";

const styles = createStyles({
    root: {
        width: '100%'
    }
});

const boardButtonStyles = createStyles((theme: Theme) => ({
    root: {
        flexBasis: "calc(50% - .5rem)",
        marginTop: theme.spacing(1)
    }
}));

export const Button
    = withStyles(styles)(MaterialButton);

export const Button45Mt
    = withStyles(boardButtonStyles)(MaterialButton);