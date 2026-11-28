export type VoiceColor =
    | {kind: 'fm'; ratio: number; index: number}
    | {kind: 'flange'; rate: number; depth: number}
    | {kind: 'tremolo'; rate: number; depth: number}
    | {kind: 'drive'; amount: number};

interface Soundscape {
    color?: VoiceColor;
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
    // Sixteen subdivisions per chord. Negative offsets bend down into the note.
    beats?: [slot: number, semitones: number][];
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
    ballast: {
        color: {kind: 'fm', ratio: .5, index: .64},
        name: 'Ballast Shift', chords: [[33,45,52,59],[36,48,55,62],[31,43,53,57],[33,47,52,60]],
        period: 12, pad: 'triangle', sweep: [190,790,260], spread: .85, echo: .56, feedback: .42,
        beats: [[0,12],[5,-19],[10,12],[14,24]],
        fx: {wave: 'triangle', pitch: .88, bend: 1.8, tail: .77, length: .72, attack: .004},
        finish: [57,64,69,71],
    },
    relay: {
        color: {kind: 'fm', ratio: 2.01, index: 1.1},
        name: 'Relay Echo', chords: [[40,47,55,62],[36,48,55,59],[38,50,57,64]],
        period: 10, pad: 'sine', sweep: [410,1340,480], spread: .6, echo: .47, feedback: .48,
        beats: [[1,-24],[3,19],[8,12],[13,-19]],
        fx: {wave: 'sine', pitch: 1.08, bend: 1.52, tail: .86, length: .62, attack: .003},
        finish: [64,67,74,71],
    },
    silt: {
        color: {kind: 'flange', rate: .16, depth: .0024},
        name: 'Silt Drift', chords: [[34,46,53,60],[32,44,51,58],[37,49,56,63],[34,48,53,62]],
        period: 15, pad: 'sawtooth', sweep: [135,610,200], spread: 1.4, echo: .83, feedback: .46,
        beats: [[2,12],[9,19],[12,-24]],
        fx: {wave: 'triangle', pitch: .78, bend: 1.36, tail: .66, length: .8, attack: .005},
        finish: [58,65,60,53],
    },
    moonpool: {
        color: {kind: 'tremolo', rate: .32, depth: .28},
        name: 'Moon Pool', chords: [[43,50,57,62],[39,51,58,65],[41,48,55,62]],
        period: 13, pad: 'triangle', sweep: [520,1580,370], spread: 1.15, echo: .61, feedback: .44,
        beats: [[0,19],[6,24],[7,-12],[12,19]],
        fx: {wave: 'sine', pitch: 1.13, bend: .84, tail: 1.06, length: .75, attack: .004},
        finish: [67,74,69,76],
    },
    vent: {
        color: {kind: 'drive', amount: 2.8},
        name: 'Thermal Vent', chords: [[30,42,49,56],[33,45,52,59],[35,47,54,61],[30,44,49,57]],
        period: 14, pad: 'sawtooth', sweep: [160,950,230], spread: .95, echo: .69, feedback: .43,
        beats: [[0,-24],[4,12],[10,19],[11,-19],[15,12]],
        fx: {wave: 'triangle', pitch: .95, bend: 2.05, tail: .75, length: .68, attack: .003},
        finish: [54,61,66,68],
    },
} satisfies Record<string, Soundscape>;

export type StyleId = keyof typeof soundscapes;
export function isStyleId(value: unknown): value is StyleId {
    return typeof value === 'string' && Object.hasOwn(soundscapes, value);
}
