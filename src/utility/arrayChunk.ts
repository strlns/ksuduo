export default function arrayChunk(arr: any[], chunkSize: number): any[][] {
    if(Math.floor(chunkSize) !== chunkSize || chunkSize < 0) throw new Error();
    const res = [];
    let pos = 0;
    while (pos < arr.length) {
        res.push(arr.slice(pos, chunkSize + pos));
        pos += chunkSize;
    }
    return res;
}