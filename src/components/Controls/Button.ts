import {withStyles} from "@material-ui/styles";
import {Button as MaterialButton} from "@material-ui/core";

export const Button = withStyles({
    root: {
        marginTop: '2rem',
        width: '100%'
    }
})(MaterialButton);