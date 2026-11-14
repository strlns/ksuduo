import type {SxProps, Theme} from '@mui/material/styles';

export const modalBaseSx = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    p: {xs: 2, md: 6},
    width: '100%',
    maxWidth: {xs: '92vw', md: '75vw'},
    maxHeight: {xs: '80vh', md: '50vh'},
    overflow: 'auto',
    bgcolor: 'background.paper',
    color: 'text.primary',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2,
    transform: 'translate(-50%, -50%)',
    boxShadow: 24,
    '& h3': {textAlign: 'left'},
} satisfies SxProps<Theme>;
