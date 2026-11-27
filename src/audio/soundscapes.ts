interface Soundscape {
    name: string;
    chords: number[][];
    period: number;
    pad: OscillatorType;
    // Start, crest and resting cutoff of the slow filter sweep (Hz).
    sweep: [number, number, number];
    spread: number;
    echo: number;
    feedback: number;
    fx: {wave: OscillatorType; pitch: number; bend: number; tail: number; length: number; attack: number};
    finish: number[];
}

export const soundscapes = {
    lagoon: {
        name: 'Lagoon', chords: [[38,53,57,60,64],[34,53,57,62,65],[31,53,57,58,62],[33,55,57,60,64]],
        period: 9, pad: 'sine', sweep: [380,1250,420], spread: 0, echo: .48, feedback: .25,
        fx: {wave: 'triangle', pitch: 1, bend: 1.65, tail: .78, length: 1, attack: .008},
        finish: [62,69,74,76,81,86],
    },
    shelf: {
        name: 'Ice Shelf', chords: [[40,47,54,61],[40,49,54,59],[38,45,52,59]],
        period: 13, pad: 'triangle', sweep: [340,1640,620], spread: 1.35, echo: .71, feedback: .39,
        fx: {wave: 'sine', pitch: 1.16, bend: 1.08, tail: 1.01, length: 1.6, attack: .014},
        finish: [64,71,78,73],
    },
    trench: {
        name: 'Trench', chords: [[35,42,48],[35,43,50],[33,40,47],[35,42,52]],
        period: 16, pad: 'sawtooth', sweep: [115,540,150], spread: .72, echo: .87, feedback: .43,
        fx: {wave: 'triangle', pitch: .72, bend: 1.9, tail: .63, length: 1.35, attack: .011},
        finish: [59,54,47,52],
    },
    kelp: {
        name: 'Kelp Forest', chords: [[41,48,55,58],[39,48,53,58],[41,46,53,60]],
        period: 11, pad: 'sawtooth', sweep: [210,880,290], spread: 1.85, echo: .37, feedback: .38,
        fx: {wave: 'triangle', pitch: .92, bend: .68, tail: 1.12, length: 1.75, attack: .032},
        finish: [60,65,62,67],
    },
    grotto: {
        name: 'Glass Grotto', chords: [[42,49,56,63],[38,49,54,61],[40,47,54,61],[42,49,57,64]],
        period: 14, pad: 'triangle', sweep: [820,320,1150], spread: .48, echo: .59, feedback: .46,
        fx: {wave: 'sine', pitch: 1.07, bend: 1.32, tail: .94, length: 2, attack: .022},
        finish: [66,73,68,61],
    },
} satisfies Record<string, Soundscape>;

export type StyleId = keyof typeof soundscapes;
export function isStyleId(value: unknown): value is StyleId {
    return typeof value === 'string' && Object.hasOwn(soundscapes, value);
}
