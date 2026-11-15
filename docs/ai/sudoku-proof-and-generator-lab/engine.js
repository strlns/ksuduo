(function(root){
'use strict';
const D=root.SUDOKU_DATA;
const pop=m=>{let n=0;while(m){m&=m-1;n++;}return n;};
const agrees=(g,m)=>g.every((v,i)=>!(m&(1<<i))||v===D.base[i]);
const differences=g=>g.reduce((m,v,i)=>m|(v===D.base[i]?0:1<<i),0);
const counts=new Uint16Array(65536);
for(const g of D.grids)counts[65535^differences(g)]++;
for(let i=0;i<16;i++)for(let m=0;m<65536;m++)if(!(m&(1<<i)))counts[m]+=counts[m|(1<<i)];
const solutions=m=>D.grids.filter(g=>agrees(g,m));
const alternate=m=>D.grids.find(g=>differences(g)!==0&&agrees(g,m));
const isMinimal=m=>counts[m]===1&&Array.from({length:16},(_,i)=>i).every(i=>!(m&(1<<i))||counts[m^(1<<i)]>1);
const family=kind=>D.unavoidable.filter(m=>kind==='all'||pop(m)===4);
function census(k,kind){const us=family(kind);let total=0,hits=0,unique=0,falseMask=null,uniqueMask=null;for(let m=0;m<65536;m++){if(pop(m)!==k)continue;total++;if(us.every(u=>u&m)){hits++;if(counts[m]===1){unique++;if(uniqueMask===null)uniqueMask=m;}else if(falseMask===null)falseMask=m;}}return {total,hits,unique,falseMask,uniqueMask};}
function greedy(random=Math.random){let m=65535;const order=Array.from({length:16},(_,i)=>i);for(let i=15;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}for(const i of order)if(counts[m^(1<<i)]===1)m^=1<<i;return m;}
function transform(g,kind){let rows=[0,1,2,3,4,5,6,7,8],cols=rows.slice();if(kind==='rows')[rows[0],rows[1]]=[rows[1],rows[0]];if(kind==='bands')rows=[3,4,5,0,1,2,6,7,8];if(kind==='cols')[cols[0],cols[1]]=[cols[1],cols[0]];if(kind==='stacks')cols=[3,4,5,0,1,2,6,7,8];return Array.from({length:81},(_,i)=>{const r=Math.floor(i/9),c=i%9;let v=g[kind==='transpose'?c*9+r:rows[r]*9+cols[c]];if(kind==='digits')v=v===1?2:v===2?1:v;return v;});}
function valid(g,n=9){const b=Math.sqrt(n),units=[];for(let r=0;r<n;r++)units.push(g.slice(r*n,r*n+n));for(let c=0;c<n;c++)units.push(Array.from({length:n},(_,r)=>g[r*n+c]));for(let br=0;br<b;br++)for(let bc=0;bc<b;bc++)units.push(Array.from({length:n},(_,i)=>g[(br*b+Math.floor(i/b))*n+bc*b+i%b]));return g.length===n*n&&units.every(u=>new Set(u).size===n&&u.every(v=>Number.isInteger(v)&&v>=1&&v<=n));}
root.SudokuLab={pop,counts,agrees,differences,solutions,alternate,isMinimal,family,census,greedy,transform,valid};
})(typeof window==='undefined'?globalThis:window);
