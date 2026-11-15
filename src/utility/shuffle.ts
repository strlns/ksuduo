// Read Math.random at call time so seeded diagnostics control every shuffle.
export function shuffle<T>(input: readonly T[]): T[] {
    const output = input.slice();
    for (let i = output.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [output[i], output[j]] = [output[j], output[i]];
    }
    return output;
}
