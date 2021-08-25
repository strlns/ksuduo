import * as React from "react"
import {Box, IconButton, Modal} from "@material-ui/core";
import {Button} from "../Controls/Button";
import {CheckCircleRounded, CloseRounded, GitHub, HelpOutlineRounded} from "@material-ui/icons";
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
                <Box display='flex' justifyContent={'space-between'} alignItems={'center'}>
                    <h1>Ksuduo</h1>
                    <IconButton edge='end' title="Close" onClick={() => setExplanationModalOpen(false)}>
                        <CloseRounded/>
                    </IconButton>
                </Box>
                <a style={{display: 'flex', alignItems: 'center'}}
                href="https://github.com/strlns/ksuduo" target="_blank">
                    <GitHub style={{color: 'black', marginRight: '.75em'}}/>
                    View code
                </a>
                <h3>How to play?</h3>
                <p>
                    See <a href="https://en.wikipedia.org/wiki/Sudoku" target="_blank">Wikipedia on Sudoku</a>
                </p>
                <h3>How does the generator work? Why is it so slow?</h3>
                <p>
                    This generator does not use templates or pre-generated sudokus.
                    Everything is generated from scratch (on your computer).
                    Also, the algorithm is not optimized for good performance.
                    This is a learning project.
                </p>
                <p>
                    It starts with a randomly generated, completely filled board (latin square / solution).
                    Then cells are cleared one at a time.
                    After each removal, the resulting board must solved.
                    If more than one solution is found, the board is invalid and not a sudoku.
                    In this case, the cell cannot be cleared.
                </p>
                <p>
                    When no more cells can be removed, but the desired number of cells has not yet been cleared,
                    the fully filled "seed" board is discarded.
                </p>
                <p>
                    To provide the <strong>difficult levels</strong>, different kinds of cells are preferred by the generator.<br/>
                    At the level <em>"Easiest"</em>, it is guaranteed that every cell in the resulting board can be filled using simple "solving techniques".
                    <br/>
                    You can see a step-by-step solution by repeatedly clicking the button "Add Hint".
                    In the other three modes from <em>"Easy"</em> to <em>"Hard"</em>, the generator prefers cells with varying numbers of possible values (at the corresponding stage of the removal process).
                    For example, at the level <em>"Easy"</em>, the cleared cell is always one of the cells with the least number of possible remaining values.
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