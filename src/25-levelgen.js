// ===================== LEVEL GENERATOR: seeded rooms + corridors, validated so every level is beatable =====================
// Tiles: # wall  . floor  D door  P start  X exit  L locked horseshoe gate  S cracked secret wall  $ saddle
//        K golden horseshoe key  R troll nest  M mirror wall  c coin  h heart  g gold volleyball  1-6 troll types
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const GEN=[
  {seed:1101,W:40,H:40,rooms:12,keys:2,nests:2,saddles:1,treasures:1,mirrors:4,density:.075,hearts:3,types:'1112223',guard:'4',boss:false,hpMul:1},
  {seed:2202,W:48,H:48,rooms:16,keys:3,nests:3,saddles:1,treasures:2,mirrors:5,density:.09,hearts:4,types:'1223344555',guard:'4',boss:false,hpMul:1.35},
  {seed:3303,W:54,H:54,rooms:20,keys:4,nests:4,saddles:2,treasures:2,mirrors:6,density:.105,hearts:5,types:'12334455555',guard:'4',boss:true,hpMul:1.7},
];
function generateLevel(i){ const cfg=GEN[i]; for(let a=0;a<400;a++){ const r=tryGenerate(cfg,cfg.seed+a*7919); if(r) return r; } throw new Error('level generation failed'); }
function tryGenerate(cfg,seed){
  const R=mulberry32(seed), ri=(a,b)=>a+Math.floor(R()*(b-a+1)), rp=a=>a[Math.floor(R()*a.length)];
  const W=cfg.W,H=cfg.H; const g=Array.from({length:H},()=>Array(W).fill('#'));
  const rooms=[];
  for(let t=0;t<3000&&rooms.length<cfg.rooms;t++){ const w=ri(4,9),h=ri(4,9),x=ri(2,W-w-3),y=ri(2,H-h-3);
    if(rooms.some(r=>x-3<r.x+r.w&&x+w+3>r.x&&y-3<r.y+r.h&&y+h+3>r.y)) continue; rooms.push({x,y,w,h,cx:x+(w>>1),cy:y+(h>>1),i:rooms.length}); }
  if(rooms.length<cfg.rooms) return null;
  for(const r of rooms) for(let j=r.y;j<r.y+r.h;j++) for(let i=r.x;i<r.x+r.w;i++) g[j][i]='.';
  const start=rooms.reduce((a,b)=>(a.cx+a.cy<b.cx+b.cy?a:b));
  const exit=rooms.reduce((a,b)=>(Math.hypot(a.cx-start.cx,a.cy-start.cy)>Math.hypot(b.cx-start.cx,b.cy-start.cy)?a:b));
  const inBox=(r,x,y,m)=>x>=r.x-m&&x<r.x+r.w+m&&y>=r.y-m&&y<r.y+r.h+m;
  const forbidden=(x,y)=>inBox(exit,x,y,1);
  function lpath(ax,ay,bx,by,hFirst){ const p=[]; let x=ax,y=ay; const sx=Math.sign(bx-ax), sy=Math.sign(by-ay);
    if(hFirst){ while(x!==bx){ x+=sx; p.push([x,y]); } while(y!==by){ y+=sy; p.push([x,y]); } } else { while(y!==by){ y+=sy; p.push([x,y]); } while(x!==bx){ x+=sx; p.push([x,y]); } } return p; }
  function carve(A,B,avoidExit){ for(const hf of (R()<.5?[true,false]:[false,true])){ const p=lpath(A.cx,A.cy,B.cx,B.cy,hf); if(avoidExit&&p.some(([x,y])=>forbidden(x,y))) continue; for(const [x,y] of p) if(g[y][x]==='#') g[y][x]='.'; return true; } return false; }
  // minimum spanning tree over every room except the exit, then a few loops so the map isn't a straight line
  const others=rooms.filter(r=>r!==exit); const inT=new Set([start]); const edges=[];
  while(inT.size<others.length){ let best=null; for(const a of inT) for(const b of others){ if(inT.has(b)) continue; const d=Math.hypot(a.cx-b.cx,a.cy-b.cy); if(!best||d<best[2]) best=[a,b,d]; } if(!carve(best[0],best[1],true)) return null; inT.add(best[1]); edges.push(best); }
  for(let k=0;k<Math.round(others.length*.3);k++){ const a=rp(others), b=others.slice().sort((p,q)=>Math.hypot(p.cx-a.cx,p.cy-a.cy)-Math.hypot(q.cx-a.cx,q.cy-a.cy))[ri(1,3)]; if(b) carve(a,b,true); }
  // exit room: connect to its nearest room, then its single entrance becomes the locked gate
  const near=others.slice().sort((p,q)=>Math.hypot(p.cx-exit.cx,p.cy-exit.cy)-Math.hypot(q.cx-exit.cx,q.cy-exit.cy))[0];
  carve(exit,near,false);
  const ring=r=>{ const out=[]; for(let i=r.x;i<r.x+r.w;i++){ out.push([i,r.y-1,'h'],[i,r.y+r.h,'h']); } for(let j=r.y;j<r.y+r.h;j++){ out.push([r.x-1,j,'v'],[r.x+r.w,j,'v']); } return out; };
  const exitEntr=ring(exit).filter(([x,y])=>g[y][x]!=='#'); if(exitEntr.length!==1) return null;
  const [gx,gy,go]=exitEntr[0]; if(go==='h'?(g[gy][gx-1]!=='#'||g[gy][gx+1]!=='#'):(g[gy-1][gx]!=='#'||g[gy+1][gx]!=='#')) return null; g[gy][gx]='L';
  // doors on corridor mouths of normal rooms
  for(const r of others) for(const [x,y,o] of ring(r)){ if(g[y][x]!=='.') continue; const ok=o==='h'?(g[y][x-1]==='#'&&g[y][x+1]==='#'):(g[y-1][x]==='#'&&g[y+1][x]==='#'); if(ok&&R()<.55) g[y][x]='D'; }
  // secret rooms behind cracked walls
  const secrets=[];
  function addSecret(content){ for(let t=0;t<300;t++){ const host=rp(others.filter(r=>r!==start)); const side=ri(0,3); const sw=ri(3,4), sh=ri(3,4); let sx,sy,wx,wy;
      if(side===0){ sx=host.x+ri(0,Math.max(0,host.w-sw)); sy=host.y-1-sh; wx=sx+ri(0,sw-1); wy=host.y-1; }
      else if(side===1){ sx=host.x+ri(0,Math.max(0,host.w-sw)); sy=host.y+host.h+1; wx=sx+ri(0,sw-1); wy=host.y+host.h; }
      else if(side===2){ sy=host.y+ri(0,Math.max(0,host.h-sh)); sx=host.x-1-sw; wy=sy+ri(0,sh-1); wx=host.x-1; }
      else { sy=host.y+ri(0,Math.max(0,host.h-sh)); sx=host.x+host.w+1; wy=sy+ri(0,sh-1); wx=host.x+host.w; }
      if(sx<1||sy<1||sx+sw>W-1||sy+sh>H-1) continue; if(wx<host.x||wx>=host.x+host.w){ if(side<2) continue; } if(wy<host.y||wy>=host.y+host.h){ if(side>=2) continue; }
      let ok=g[wy][wx]==='#'; for(let j=sy-1;j<=sy+sh&&ok;j++) for(let i=sx-1;i<=sx+sw&&ok;i++){ if(i===wx&&j===wy) continue; if(g[j][i]!=='#') ok=false; }
      if(!ok) continue; for(let j=sy;j<sy+sh;j++) for(let i=sx;i<sx+sw;i++) g[j][i]='.'; g[wy][wx]='S'; const room={x:sx,y:sy,w:sw,h:sh,cx:sx+(sw>>1),cy:sy+(sh>>1)}; secrets.push(room);
      const cells=[]; for(let j=sy;j<sy+sh;j++) for(let i=sx;i<sx+sw;i++) cells.push([i,j]);
      if(content==='saddle'){ g[room.cy][room.cx]='$'; for(const [i,j] of cells) if(g[j][i]==='.'&&R()<.5) g[j][i]='c'; }
      else { g[room.cy][room.cx]='g'; let hp=false; for(const [i,j] of cells) if(g[j][i]==='.'){ if(!hp){ g[j][i]='h'; hp=true; } else if(R()<.7) g[j][i]='c'; } }
      return true; } return false; }
  for(let k=0;k<cfg.saddles;k++) if(!addSecret('saddle')) return null;
  for(let k=0;k<cfg.treasures;k++) addSecret('treasure');
  // distances (BFS from start through normal floor) to rank rooms
  const pass=(ch,o)=>ch!=='#'&&ch!=='M'&&ch!=='R'&&(o.S||ch!=='S')&&(o.L||ch!=='L');
  function flood(o){ const seen=new Uint8Array(W*H), dist=new Int32Array(W*H).fill(-1); const q=[[start.cx,start.cy]]; seen[start.cy*W+start.cx]=1; dist[start.cy*W+start.cx]=0; let h=0; while(h<q.length){ const [x,y]=q[h++]; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, ny=y+dy; if(nx<0||ny<0||nx>=W||ny>=H) continue; const k=ny*W+nx; if(seen[k]||!pass(g[ny][nx],o)) continue; seen[k]=1; dist[k]=dist[y*W+x]+1; q.push([nx,ny]); } } return {seen,dist}; }
  const base=flood({}); const rd=r=>base.dist[r.cy*W+r.cx];
  const ranked=others.filter(r=>r!==start).sort((a,b)=>rd(b)-rd(a));
  const keyRooms=ranked.slice(0,cfg.keys); if(keyRooms.length<cfg.keys) return null;
  const interior=r=>{ const c=[]; for(let j=r.y;j<r.y+r.h;j++) for(let i=r.x;i<r.x+r.w;i++) if(g[j][i]==='.') c.push([i,j]); return c; };
  const inner=r=>interior(r).filter(([i,j])=>i>r.x&&i<r.x+r.w-1&&j>r.y&&j<r.y+r.h-1);
  const put=(cells,ch,n=1)=>{ let k=0; for(let t=0;t<60&&k<n;t++){ const c=rp(cells); if(c&&g[c[1]][c[0]]==='.'){ g[c[1]][c[0]]=ch; k++; } } return k; };
  g[start.cy][start.cx]='P'; g[exit.cy][exit.cx]='X';
  for(const r of keyRooms){ g[r.cy][r.cx]='K'; put(inner(r),cfg.guard,1); }
  const nestRooms=others.filter(r=>r!==start&&!keyRooms.includes(r)).sort(()=>R()-.5).slice(0,cfg.nests); if(nestRooms.length<cfg.nests) return null;
  for(const r of nestRooms){ if(!put(inner(r),'R',1)) return null; }
  for(const r of others){ if(r===start) continue; const area=r.w*r.h; const n=Math.max(1,Math.round(area*cfg.density*(keyRooms.includes(r)?1.5:1))); for(let k=0;k<n;k++) put(interior(r),rp(cfg.types.split('')),1); put(interior(r),'c',ri(2,5)); }
  put(interior(exit),'c',4); if(cfg.boss) put(inner(exit),'6',1); put(interior(exit),cfg.guard,cfg.boss?2:1);
  const hr=others.filter(r=>r!==start).sort(()=>R()-.5).slice(0,cfg.hearts); for(const r of hr) put(interior(r),'h',1);
  // mirrors on room walls that face exactly one floor tile
  let mir=0; for(const r of others.sort(()=>R()-.5)){ if(mir>=cfg.mirrors) break; const cand=ring(r).filter(([x,y])=>{ if(g[y][x]!=='#') return false; let f=0; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const ch=(g[y+dy]||[])[x+dx]; if(ch&&ch!=='#'&&ch!=='M'&&ch!=='S') f++; } return f===1; }); const c=cand.length?rp(cand):null; if(c){ g[c[1]][c[0]]='M'; mir++; } }
  // validate: keys reachable with gate shut; exit not reachable until gate opens; saddles only via secrets; everything reachable with all open
  const shut=flood({}), open=flood({L:1}), all=flood({L:1,S:1});
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const ch=g[y][x], k=y*W+x;
    if(ch==='K'&&!shut.seen[k]) return null; if(ch==='X'&&(shut.seen[k]||!open.seen[k])) return null; if(ch==='$'&&(open.seen[k]||!all.seen[k])) return null;
    if(ch!=='#'&&ch!=='M'&&ch!=='S'&&ch!=='L'&&ch!=='R'&&!all.seen[k]) return null; }
  // lamps: every room center plus spaced corridor cells
  const lamps=[]; for(const r of [...rooms,...secrets]){ lamps.push([r.cy,r.cx]); if(r.w*r.h>40) lamps.push([r.y+1,r.x+1],[r.y+r.h-2,r.x+r.w-2]); }
  for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++) if(g[y][x]==='.'&&(x*7+y*13)%11===0&&!rooms.some(r=>inBox(r,x,y,0))) lamps.push([y,x]);
  return {map:g.map(r=>r.join('')),lamps,keys:cfg.keys,cfg,rooms:rooms.length,seed};
}
