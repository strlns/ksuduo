export default function assert(expr: boolean, msg: string | undefined = undefined): void {
    if (!expr) {
        throw new Error(msg ?? 'Assertion error')
    }
}

export function assertType<T>(subject: any): void {
    if ((subject as T) === undefined) {
        throw new TypeError();
    }
}