const assert=require('node:assert/strict');
global.window=global;
require('./data.js');require('./engine.js');
const D=global.SUDOKU_DATA,E=global.SudokuLab;
assert.equal(D.grids.length,288);assert.equal(new Set(D.grids.map(g=>g.join(''))).size,288);D.grids.forEach(g=>assert(E.valid(g,4)));
// Independent exhaustive count: compare each clue mask directly to every complete grid.
const minimalCounts={};let checked=0;
for(let m=0;m<65536;m++){
 let n=0;for(const g of D.grids){let ok=true;for(let i=0;i<16;i++)if((m&(1<<i))&&g[i]!==D.base[i]){ok=false;break;}if(ok)n++;}
 assert.equal(E.counts[m],n);if(E.isMinimal(m))minimalCounts[E.pop(m)]=(minimalCounts[E.pop(m)]||0)+1;
 assert.equal(D.unavoidable.every(u=>m&u),n===1);checked++;
}
assert.deepEqual(minimalCounts,{4:12,5:256,6:16});
assert.deepEqual(E.census(4,'small'),{total:1820,hits:24,unique:12,falseMask:1632,uniqueMask:1680});
assert.equal(E.census(4,'all').hits,12);assert.equal(E.census(3,'small').hits,0);
for(let i=0;i<100;i++)assert(E.isMinimal(E.greedy()));
for(const kind of ['digits','rows','bands','cols','stacks','transpose'])assert(E.valid(E.transform(D.full9,kind)));
const alt=D.full9.slice();D.rectangle.forEach((p,i)=>alt[p]=D.full9[D.rectangle[i^1]]);assert(E.valid(alt));
// Separate 9x9 backtracker verifies all 16 clue masks on the four-cell trade.
function count9(a){let count=0;function rec(){const i=a.indexOf(0);if(i<0){count++;return;}const r=Math.floor(i/9),c=i%9;for(let v=1;v<=9;v++){let ok=true;for(let j=0;j<81;j++)if(a[j]===v&&(Math.floor(j/9)===r||j%9===c||(Math.floor(j/27)===Math.floor(r/3)&&Math.floor(j%9/3)===Math.floor(c/3)))){ok=false;break;}if(ok){a[i]=v;rec();a[i]=0;}}}rec();return count;}
for(let m=0;m<16;m++){const a=D.full9.slice();D.rectangle.forEach((p,i)=>{if(!(m&(1<<i)))a[p]=0;});assert.equal(count9(a),m?1:2);}
for(const u of D.unavoidable){assert(E.counts[65535^u]>1);for(let i=0;i<16;i++)if(u&(1<<i))assert.equal(E.counts[(65535^u)|(1<<i)],1);}
console.log(JSON.stringify({verifiedClueMasks:checked,validCompleteGrids:288,minimalCounts,tradeClueMasks:16,transformationTypes:6,randomMinimalityChecks:100,status:'all passed'}));
