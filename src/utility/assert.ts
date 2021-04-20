export default function assert(expr: boolean, msg: string|undefined = undefined): void {
    if (!expr) {
        throw new Error(msg ?? 'Assertion error')
    }
}