import {Slider} from '@mui/material';
import {styled} from '@mui/material/styles';

export const DiscreteRangeSlider = styled(Slider)(({theme}) => ({
    height: 2,
    padding: '15px 0',
    marginBottom: theme.spacing(4),
    flexGrow: 1,
    '& .MuiSlider-valueLabel': {fontSize: '.75rem', borderRadius: 6},
    '& .MuiSlider-track, & .MuiSlider-rail': {height: 2},
    '& .MuiSlider-rail': {opacity: .5},
    '& .MuiSlider-mark': {height: 8, width: 1},
}));
