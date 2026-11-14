import {Button as MaterialButton} from '@mui/material';
import {styled} from '@mui/material/styles';

export const Button = styled(MaterialButton)({width: '100%'});
export const Button45Mt = styled(MaterialButton)(({theme}) => ({
    flexBasis: 'calc(50% - .5rem)',
    marginTop: theme.spacing(1),
}));
