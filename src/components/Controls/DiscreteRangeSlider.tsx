import {withStyles} from "@material-ui/styles";
import {Slider} from "@material-ui/core";
import {ksuduoThemeNormal} from "../Theme/NormalKsuduoTheme";

export const DiscreteRangeSlider = withStyles({
    root: {
        // color: '#3880ff',
        height: 2,
        padding: '15px 0',
        marginBottom: ksuduoThemeNormal.spacing(4),
        flexGrow: 1,
    },
    // active: {},
    valueLabel: {
        transition: 'none',
        left: 'calc(-50%)',
        backgroundColor: '#fff',
        borderRadius: 99,
        border: '2px solid currentColor',
        top: 'calc(.25rem)',
        '& > *': {
            width: '1.25rem',
            height: '1.25rem'
        },
        '& *': {
            background: 'transparent',
            color: 'currentColor',
        },
    },
    track: {
        height: 2,
    },
    rail: {
        height: 2,
        opacity: 0.5,
        backgroundColor: '#bfbfbf',
    },
    mark: {
        backgroundColor: '#bfbfbf',
        height: 8,
        width: 1,
        marginTop: -3,
    },
    markActive: {
        opacity: 1,
        backgroundColor: 'currentColor',
    },
})(Slider);
