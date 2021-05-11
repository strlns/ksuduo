import * as React from "react"
import {Box, IconButton, Modal} from "@material-ui/core";
import {Button} from "../Controls/Button";
import {CheckCircleRounded, CloseRounded, HelpOutlineRounded} from "@material-ui/icons";
import {ModalBaseStyles} from "../Message/ModalBaseStyles";

export default () => {
    const [isExplanationModalOpen, setExplanationModalOpen] = React.useState(false);
    return <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'}>
        <Button fullWidth={true} variant="text" size="small"
                endIcon={<HelpOutlineRounded/>}
                onClick={() => setExplanationModalOpen(true)}>
            About
        </Button>

        <Modal open={isExplanationModalOpen}>
            <Box className={ModalBaseStyles().root}>
                <Box display='flex' justifyContent={'space-between'} alignItems={'flex-start'}>
                    <h1 style={{marginTop: 0}}>Ksuduo</h1>
                    <IconButton edge='end' title="Close" onClick={() => setExplanationModalOpen(false)}>
                        <CloseRounded/>
                    </IconButton>
                </Box>
                <h2>Sudoku Toy Project</h2>
                <h3>How to play?</h3>
                <p>
                    See <a href="https://en.wikipedia.org/wiki/Sudoku" target="_blank">Wikipedia on Sudoku</a>
                </p>
                <h3>How does the generator work? Why is it slow?</h3>
                <p>
                    It starts with a randomly generated, completely filled board.
                    Then cells are cleared one at a time, after each removal, the board is solved and checked for
                    multiple solutions.
                    A sudoku with more than one solution is not a sudoku.
                    If no cell can be removed without rendering the board invalid,
                    the fully completed "seed" board is discarded.
                    Rinse, repeat until the desired number of cells is cleared.
                    The process is not optimized for good performance.
                    This is a learning project.
                </p>
                <h3>Difficulty levels</h3>
                <p>
                    Different kinds of cells are preferred while deleting at the 3 difficulty levels - in easy mode, the
                    cells that are
                    cleared tend to be the ones that are easier to fill. In hard mode, cells with greater numbers of
                    possible values are
                    preferred.
                </p>
                <Box onClick={() => setExplanationModalOpen(false)}>
                    <IconButton style={{margin: 'auto', display: 'block'}} title="Close">
                        <CheckCircleRounded color={'primary'}/>
                    </IconButton>
                </Box>
            </Box>
        </Modal>
    </Box>
}