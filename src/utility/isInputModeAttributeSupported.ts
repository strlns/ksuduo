export default function isInputModeAttributeSupported(): boolean {
    const input = document.createElement('input');
    return 'inputMode' in input;
}