/** Keep styled browser diagnostics readable when the same tests run in Node. */
export function logStyled(message: string, styles: string[], ...details: unknown[]): void {
    if (typeof window === 'undefined') {
        console.log(message.replace(/%c/g, ''), ...details);
    } else {
        console.log(message, ...styles, ...details);
    }
}
