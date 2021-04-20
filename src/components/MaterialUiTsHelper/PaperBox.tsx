import { FunctionComponent } from 'react'
import { Box, BoxProps, Paper, PaperProps } from '@material-ui/core'
import * as React from 'react';

type PaperBoxProps = BoxProps & PaperProps;

/*
 Helper to avoid TypeScript issues with prop "component" of material ui Box component
 */

export const PaperBox: FunctionComponent<PaperBoxProps> = (props) => (
    <Box {...props} component={Paper} />
)