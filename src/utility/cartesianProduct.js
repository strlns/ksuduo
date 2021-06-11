/**
 * https://stackoverflow.com/questions/12303989/cartesian-product-of-multiple-arrays-in-javascript/43053803
 *
 * Copypasta, I'm too stupid to get this to work with TypeScript (variadic generic function)
 */
export const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));