import assert from "./assert";

export default function arrayChunk(arr: any[], chunkSize: number, minChunks = 0): any[][] {
    assert(Math.floor(chunkSize) === chunkSize && chunkSize > 0);
    const res = [];
    let pos = 0;
    while (pos < arr.length || res.length < minChunks) {
        res.push(arr.slice(pos, chunkSize + pos));
        pos += chunkSize;
    }
    return res;
}