import {logStyled} from './logStyled';

export default function logSuccess(msg: string) {
    logStyled(`%c ${msg}`, ['color: #00df00']);
}
