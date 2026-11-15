import * as React from "react"
import {Box, IconButton, Modal} from "@mui/material";
import {Button} from "../Controls/Button";
import {CheckCircleRounded, CloseRounded, GitHub, HelpOutlineRounded} from "@mui/icons-material";
import {modalBaseSx} from "../Message/ModalBaseStyles";

export default () => {
    const [isExplanationModalOpen, setExplanationModalOpen] = React.useState(false);
    return <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <Button fullWidth={true} variant="text" size="small"
                endIcon={<HelpOutlineRounded/>}
                onClick={() => setExplanationModalOpen(true)}>
            About
        </Button>

        <Modal open={isExplanationModalOpen}>
            <Box sx={modalBaseSx}>
                <Box sx={{display: "flex", justifyContent: 'space-between', alignItems: 'center'}}>
                    <h1>Ksuduo</h1>
                    <IconButton edge='end' title="Close" onClick={() => setExplanationModalOpen(false)}>
                        <CloseRounded/>
                    </IconButton>
                </Box>
                <a style={{display: 'flex', alignItems: 'center'}}
                href="https://github.com/strlns/ksuduo" target="_blank">
                    <GitHub style={{color: 'inherit', marginRight: '.75em'}}/>
                    View code
                </a>
                <p>
                    I started Ksuduo in 2021 as my first project to learn React and TypeScript.
                    In 2026, I picked it up again, using AI-assisted coding to improve it.
                </p>
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
                    It starts with a randomly generated complete solution, then removes clues one at a time.
                    A removal is kept only if the puzzle can still be solved using the techniques allowed at your chosen level.
                    An independent solver checks that the final puzzle has exactly one solution.
                </p>
                <p>
                    Easiest uses naked singles. Easy also allows hidden singles.
                    Medium adds locked candidates, and Hard adds naked pairs.
                    These are upper limits: a puzzle can be easier than the selected level.
                    More clues may be kept than requested to stay within that limit.
                </p>
                <p>
                    Add Hint walks through placements and candidate eliminations, with highlighted cells and an explanation.
                    Older saved puzzles may need a value revealed from the solution if these techniques cannot make progress.
                    Turn on Notes to enter pencil marks, or use Annotate selected cell to list values allowed by the current board.
                    Your notes are separate from the hint solver. Marks conflicting with current entries are hidden and return if those entries are undone or cleared.
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