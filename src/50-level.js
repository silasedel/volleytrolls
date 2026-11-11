// ===================== RENDERER, WORLD, LEVEL BUILDING, MIRRORS, COLLISION, PARTICLES =====================
const canvas=$('game');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
const PERF={ratio:Math.min(window.devicePixelRatio||1,1.5),frames:0,acc:0,check:0};
renderer.setPixelRatio(PERF.ratio);
renderer.setSize(window.innerWidth,window.innerHeight,false);
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
const camera=new THREE.PerspectiveCamera(74,window.innerWidth/window.innerHeight,.05,70); camera.rotation.order='YXZ';
let scene=null;
const game={state:'title',levelStats:null,combo:0,comboT:0,time:0,returnTo:null};
const world={grid:[],W:0,H:0,secrets:[],doors:[],doorMap:new Map(),mirrors:[],pickups:[],trolls:[],projectiles:[],enemyShots:[],nests:[],nestMap:new Map(),fx:[],exit:null,gate:null,avatar:null,hands:null,ball:null,level:null,index:0,particles:null,lamps:[],lightPool:[],sun:null,seen:null,keysNeeded:0,keys:0,checkpoint:null};
const LIGHTS=10;

// ---- grid helpers ----
const tileAt=(x,z)=>{ const c=Math.floor(x/T), r=Math.floor(z/T); if(r<0||c<0||r>=world.H||c>=world.W) return '#'; return world.grid[r][c]; };
function solidAt(x,z){ const ch=tileAt(x,z); if(ch==='#'||ch==='M'||ch==='S') return true;
  if(ch==='D'){ const d=world.doorMap.get(Math.floor(z/T)*1000+Math.floor(x/T)); return d?d.open<.75:false; }
  if(ch==='L') return !(world.gate&&world.gate.open>.8);
  if(ch==='R'){ const n=world.nestMap.get(Math.floor(z/T)*1000+Math.floor(x/T)); return !!(n&&!n.dead); }
  return false; }
function collides(x,z,r){ return solidAt(x-r,z-r)||solidAt(x+r,z-r)||solidAt(x-r,z+r)||solidAt(x+r,z+r)||solidAt(x,z-r)||solidAt(x,z+r)||solidAt(x-r,z)||solidAt(x+r,z); }
function moveWithCollision(ent,dx,dz,r){ let moved=false; if(dx&&!collides(ent.x+dx,ent.z,r)){ ent.x+=dx; moved=true; } if(dz&&!collides(ent.x,ent.z+dz,r)){ ent.z+=dz; moved=true; } return moved; }
function lineOfSight(x1,z1,x2,z2){ const dx=x2-x1,dz=z2-z1; const d=Math.hypot(dx,dz); const n=Math.ceil(d/.4); for(let i=1;i<n;i++){ const t=i/n; const ch=tileAt(x1+dx*t,z1+dz*t); if(ch==='#'||ch==='M'||ch==='S'||(ch==='D'&&solidAt(x1+dx*t,z1+dz*t))||(ch==='L'&&solidAt(x1+dx*t,z1+dz*t))) return false; } return true; }
function lerpAngle(a,b,t){ let da=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI; return a+da*Math.min(1,t); }

// ---- planar mirror (render-to-texture reflection). Only the nearest one renders, every other frame. ----
class Mirror extends THREE.Mesh{
  constructor(w,h){
    super(new THREE.PlaneGeometry(w,h));
    this.rt=new THREE.WebGLRenderTarget(512,512); this.vcam=new THREE.PerspectiveCamera(); this.texMat=new THREE.Matrix4(); this.active=false;
    this.material=new THREE.ShaderMaterial({uniforms:{tDiffuse:{value:this.rt.texture},textureMatrix:{value:this.texMat},tint:{value:new THREE.Color(0xd0e4ff)}},
      vertexShader:'uniform mat4 textureMatrix; varying vec4 vUv; void main(){ vUv=textureMatrix*vec4(position,1.0); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader:'uniform sampler2D tDiffuse; uniform vec3 tint; varying vec4 vUv; void main(){ vec4 b=texture2DProj(tDiffuse,vUv); gl_FragColor=vec4(mix(b.rgb,tint,0.07),1.0); }'});
    this.normal=new THREE.Vector3(); this.pos=new THREE.Vector3();
    const rotM=new THREE.Matrix4(), view=new THREE.Vector3(), target=new THREE.Vector3(), look=new THREE.Vector3(), camPos=new THREE.Vector3(), plane=new THREE.Plane(), clip=new THREE.Vector4(), q=new THREE.Vector4();
    this.onBeforeRender=(renderer,sc,cam)=>{
      if(!this.active||Mirror.rendering||(Mirror.frame&1)) return;
      this.pos.setFromMatrixPosition(this.matrixWorld); camPos.setFromMatrixPosition(cam.matrixWorld);
      rotM.extractRotation(this.matrixWorld); this.normal.set(0,0,1).applyMatrix4(rotM);
      view.subVectors(this.pos,camPos); if(view.dot(this.normal)>0) return;
      view.reflect(this.normal).negate().add(this.pos);
      rotM.extractRotation(cam.matrixWorld); look.set(0,0,-1).applyMatrix4(rotM).add(camPos);
      target.subVectors(this.pos,look).reflect(this.normal).negate().add(this.pos);
      const vc=this.vcam; vc.position.copy(view); vc.up.set(0,1,0).applyMatrix4(rotM).reflect(this.normal); vc.lookAt(target); vc.far=30; vc.updateMatrixWorld(); vc.projectionMatrix.copy(cam.projectionMatrix);
      this.texMat.set(.5,0,0,.5, 0,.5,0,.5, 0,0,.5,.5, 0,0,0,1); this.texMat.multiply(vc.projectionMatrix).multiply(vc.matrixWorldInverse).multiply(this.matrixWorld);
      plane.setFromNormalAndCoplanarPoint(this.normal,this.pos); plane.applyMatrix4(vc.matrixWorldInverse); clip.set(plane.normal.x,plane.normal.y,plane.normal.z,plane.constant);
      const pm=vc.projectionMatrix; q.x=(Math.sign(clip.x)+pm.elements[8])/pm.elements[0]; q.y=(Math.sign(clip.y)+pm.elements[9])/pm.elements[5]; q.z=-1; q.w=(1+pm.elements[10])/pm.elements[14];
      clip.multiplyScalar(2/clip.dot(q)); pm.elements[2]=clip.x; pm.elements[6]=clip.y; pm.elements[10]=clip.z+1-.0001; pm.elements[14]=clip.w;
      Mirror.rendering=true; this.visible=false;
      const prevRT=renderer.getRenderTarget(), prevShadow=renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate=false;
      if(world.avatar) world.avatar.visible=true; if(world.hands) world.hands.visible=false;
      renderer.setRenderTarget(this.rt); renderer.state.buffers.depth.setMask(true); if(renderer.autoClear===false) renderer.clear(); renderer.render(sc,vc);
      if(world.avatar) world.avatar.visible=false; if(world.hands) world.hands.visible=true;
      renderer.setRenderTarget(prevRT); renderer.shadowMap.autoUpdate=prevShadow; this.visible=true; Mirror.rendering=false;
    };
  }
}
Mirror.rendering=false; Mirror.frame=0;

// ---- particles: one instanced mesh per scene, no per-frame allocations ----
class Particles{
  constructor(sc,n=700){ this.n=n; this.p=new Array(n).fill(null); this.mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.11,.11,.11),new THREE.MeshBasicMaterial({color:0xffffff}),n); this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.mesh.frustumCulled=false; const m=new THREE.Matrix4().makeScale(0,0,0); for(let i=0;i<n;i++){ this.mesh.setMatrixAt(i,m); this.mesh.setColorAt(i,new THREE.Color(1,1,1)); } sc.add(this.mesh); this.next=0; this.m4=new THREE.Matrix4(); this.col=new THREE.Color(); this.e=new THREE.Euler(); this.sv=new THREE.Vector3(); this.live=0; }
  emit(x,y,z,color,count,speed,life,gravity=9,size=1){ for(let i=0;i<count;i++){ const a=rand(0,Math.PI*2), b=rand(-1,1), s=rand(speed*.3,speed); const idx=this.next; this.next=(this.next+1)%this.n; const q=Math.sqrt(1-b*b); this.p[idx]={x,y,z,vx:Math.cos(a)*q*s,vy:b*s+speed*.4,vz:Math.sin(a)*q*s,life,max:life,g:gravity,size:size*rand(.6,1.4)}; this.col.setHex(color).offsetHSL(0,0,rand(-.1,.15)); this.mesh.setColorAt(idx,this.col); } this.mesh.instanceColor.needsUpdate=true; this.live=1; }
  update(dt){ if(!this.live) return; let any=false; for(let i=0;i<this.n;i++){ const p=this.p[i]; if(!p) continue; any=true; p.life-=dt; if(p.life<=0){ this.p[i]=null; this.mesh.setMatrixAt(i,this.m4.makeScale(0,0,0)); continue; } p.vy-=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt; if(p.y<.05){ p.y=.05; p.vy*=-.4; p.vx*=.7; p.vz*=.7; } const s=p.size*Math.min(1,p.life/p.max*2); this.e.set(p.life*3,p.life*5,0); this.m4.makeRotationFromEuler(this.e); this.m4.scale(this.sv.set(s,s,s)); this.m4.setPosition(p.x,p.y,p.z); this.mesh.setMatrixAt(i,this.m4); } this.mesh.instanceMatrix.needsUpdate=true; if(!any) this.live=0; }
}

// ---- level construction ----
const LEVEL_CACHE={};
function disposeScene(sc){ if(!sc) return; sc.traverse(o=>{ if(o.isMesh||o.isSprite){ if(o.geometry) o.geometry.dispose(); const ms=Array.isArray(o.material)?o.material:[o.material]; ms.forEach(m=>{ if(m&&m.dispose&&!m.userData.shared) m.dispose(); }); } if(o.rt) o.rt.dispose(); }); }
function addPickup(kind,id,x,z,baseY){ let mesh; switch(kind){ case 'coin': mesh=buildCoin(); baseY=baseY??.6; break; case 'heart': mesh=buildHeart(); baseY=baseY??.9; break; case 'gold': mesh=buildGoldBallPickup(); baseY=baseY??1.1; break; case 'boost': case 'jump': mesh=buildBoosterPickup(kind); baseY=baseY??1; break; case 'craft': mesh=buildCraftPickup(craftItem(id)); baseY=baseY??.9; break; case 'saddle': mesh=buildSaddlePickup(saddle(id)); baseY=0; break; case 'key': mesh=buildKey(); baseY=baseY??1.3; break; }
  if(solidAt(x,z)){ const c=Math.floor(x/T), r=Math.floor(z/T); x=c*T+T/2; z=r*T+T/2; if(solidAt(x,z)){ x=player.x; z=player.z; } }
  mesh.position.set(x,baseY,z); scene.add(mesh); const p={kind,id,mesh,x,z,baseY,taken:false,phase:rand(0,6)}; world.pickups.push(p); return p; }

function buildLevel(idx){
  disposeScene(scene); clearTrollTemplates();
  const L=LEVELS[idx]; if(!LEVEL_CACHE[idx]) LEVEL_CACHE[idx]=generateLevel(idx); const GL=LEVEL_CACHE[idx];
  world.level=L; world.index=idx; world.grid=GL.map.map(r=>r.split('')); world.H=world.grid.length; world.W=world.grid[0].length; world.gen=GL;
  Object.assign(world,{secrets:[],doors:[],doorMap:new Map(),mirrors:[],pickups:[],trolls:[],projectiles:[],enemyShots:[],nests:[],nestMap:new Map(),fx:[],lamps:[],lightPool:[],gate:null,keys:0,keysNeeded:GL.keys,hpMul:GL.cfg.hpMul,types:GL.cfg.types});
  world.seen=new Uint8Array(world.W*world.H);
  scene=new THREE.Scene(); scene.background=new THREE.Color(L.fog); scene.fog=new THREE.FogExp2(L.fog,.028); scene.add(camera);
  const fw=world.W*T, fh=world.H*T;
  scene.add(new THREE.HemisphereLight(0xe8ecff,0x5a4a3a,1.3)); scene.add(new THREE.AmbientLight(0xffffff,.4));
  // sun-style shadow light that follows the player (small box = sharp shadows, cheap)
  const dl=new THREE.DirectionalLight(0xfff0dc,1.2); dl.castShadow=true; dl.shadow.mapSize.set(2048,2048); const sc=dl.shadow.camera; sc.left=-24; sc.right=24; sc.top=24; sc.bottom=-24; sc.near=1; sc.far=120; dl.shadow.bias=-.0006; dl.shadow.normalBias=.03; scene.add(dl); scene.add(dl.target); world.sun=dl;
  const floorT=floorTexture(L.floor[0],L.floor[1]); floorT.repeat.set(world.W,world.H);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(fw,fh),new THREE.MeshStandardMaterial({map:floorT,roughness:.9})); floor.rotation.x=-Math.PI/2; floor.position.set(fw/2,0,fh/2); floor.receiveShadow=true; scene.add(floor);
  const ceilT=ceilingTexture(L.ceil); ceilT.repeat.set(world.W,world.H);
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(fw,fh),new THREE.MeshStandardMaterial({map:ceilT,roughness:.95})); ceil.rotation.x=Math.PI/2; ceil.position.set(fw/2,WALL_H,fh/2); scene.add(ceil);
  const wallMat=new THREE.MeshStandardMaterial({map:stoneTexture(L.wall[0],L.wall[1]),roughness:.85});
  const g=world.grid; const isOpen=(r,c)=>{ const ch=(g[r]||[])[c]; return ch!==undefined&&ch!=='#'&&ch!=='M'; };
  // only build wall blocks that touch open space (huge saving on big maps)
  const cells=[]; for(let r=0;r<world.H;r++) for(let c=0;c<world.W;c++){ if(g[r][c]!=='#'&&g[r][c]!=='M') continue; let edge=false; for(let dr=-1;dr<=1&&!edge;dr++) for(let dc=-1;dc<=1;dc++) if(isOpen(r+dr,c+dc)){ edge=true; break; } if(edge) cells.push([r,c]); }
  const inst=new THREE.InstancedMesh(new THREE.BoxGeometry(T,WALL_H,T),wallMat,cells.length); const m4=new THREE.Matrix4();
  cells.forEach((rc,i)=>{ m4.makeTranslation(rc[1]*T+T/2,WALL_H/2,rc[0]*T+T/2); inst.setMatrixAt(i,m4); }); inst.castShadow=true; inst.receiveShadow=true; scene.add(inst);
  const crackMat=new THREE.MeshStandardMaterial({map:crackedStoneTexture(L.wall[0],L.wall[1]),roughness:.85});
  const doorMat=new THREE.MeshStandardMaterial({map:tex('door',doorTexture),roughness:.7});
  const isWallish=(r,c)=>{ const ch=(g[r]||[])[c]; return ch===undefined||ch==='#'||ch==='M'||ch==='S'||ch==='D'||ch==='L'; };
  const frameMat=Mat(0xc9a24a,{metalness:.7,roughness:.35});
  let saddleIdx=0; const spawns=[];
  for(let r=0;r<world.H;r++) for(let c=0;c<world.W;c++){
    const ch=g[r][c], x=c*T+T/2, z=r*T+T/2;
    if(ch==='S'){ const m=new THREE.Mesh(new THREE.BoxGeometry(T,WALL_H,T),crackMat); m.position.set(x,WALL_H/2,z); m.castShadow=true; m.receiveShadow=true; scene.add(m); world.secrets.push({r,c,mesh:m,opening:false,t:0}); }
    if(ch==='M'){ for(const [dr,dc,ry] of [[0,1,Math.PI/2],[0,-1,-Math.PI/2],[1,0,0],[-1,0,Math.PI]]){ if(isWallish(r+dr,c+dc)) continue; const mir=new Mirror(T*.78,WALL_H*.72); mir.position.set(x+dc*(T/2+.03),WALL_H*.47,z+dr*(T/2+.03)); mir.rotation.y=ry; scene.add(mir); world.mirrors.push(mir);
        const fr=new THREE.Group(); fr.position.copy(mir.position); fr.rotation.y=ry; const w=T*.78,h=WALL_H*.72; mesh(G.box(w+.3,.14,.08),frameMat,0,h/2+.07,-.01,fr); mesh(G.box(w+.3,.14,.08),frameMat,0,-h/2-.07,-.01,fr); mesh(G.box(.14,h+.3,.08),frameMat,-w/2-.07,0,-.01,fr); mesh(G.box(.14,h+.3,.08),frameMat,w/2+.07,0,-.01,fr); mesh(G.sph(.12,8,6),frameMat,0,h/2+.2,0,fr); compactDeep(fr); scene.add(fr); } }
    if(ch==='D'){ const alongX=isWallish(r,c-1)&&isWallish(r,c+1); const grp=new THREE.Group(); grp.position.set(x,0,z); grp.rotation.y=alongX?0:Math.PI/2; const panel=new THREE.Mesh(new THREE.BoxGeometry(T,WALL_H,.4),doorMat); panel.position.y=WALL_H/2; panel.castShadow=true; panel.receiveShadow=true; grp.add(panel); mesh(G.box(T,.3,.7),Mat(0x2a2a2e),0,WALL_H-.15,0,grp); scene.add(grp); const d={r,c,open:0,target:0,panel,grp}; world.doors.push(d); world.doorMap.set(r*1000+c,d); }
    if(ch==='L'){ const alongX=isWallish(r,c-1)&&isWallish(r,c+1); const gm=buildGate(GL.keys); gm.position.set(x,0,z); gm.rotation.y=alongX?0:Math.PI/2; scene.add(gm); world.gate={r,c,mesh:gm,open:0,opening:false,x,z,warnT:0}; }
    if(ch==='R'){ const nm=buildNest(); nm.position.set(x,0,z); scene.add(nm); const hp=Math.round(14*GL.cfg.hpMul); const n={r,c,x,z,mesh:nm,hp,max:hp,dead:false,cd:rand(3,7),spawned:[],flash:0,t:rand(0,6)}; world.nests.push(n); world.nestMap.set(r*1000+c,n); }
    if(ch==='K') addPickup('key',null,x,z);
    if(ch==='c') addPickup('coin',null,x+rand(-.8,.8),z+rand(-.8,.8));
    if(ch==='h') addPickup('heart',null,x,z);
    if(ch==='g') addPickup('gold',null,x,z);
    if(ch==='$'){ const sid=(LEVEL_SADDLES[idx]||[])[saddleIdx++]; if(sid&&!save.saddles.includes(sid)) addPickup('saddle',sid,x,z); else { for(let i=0;i<8;i++) addPickup('coin',null,x+rand(-1.2,1.2),z+rand(-1.2,1.2)); addPickup('gold',null,x,z); } }
    if(ch==='X'){ const gate=buildExitGate(); gate.position.set(x,0,z); scene.add(gate); world.exit=gate; }
    if(ch>='1'&&ch<='6') spawns.push([TROLLS[+ch-1],x,z]);
    if(ch==='P'){ player.x=x; player.z=z; player.yaw=Math.atan2(-((world.W/2*T)-x),-((world.H/2*T)-z)); world.checkpoint={x,z,yaw:player.yaw}; }
  }
  // lamp fixtures (emissive, no light) + a small pool of real lights moved to the nearest lamps
  for(const [r,c] of GL.lamps){ const x=c*T+T/2, z=r*T+T/2; const lamp=buildLamp(L.lamp); lamp.position.set(x,WALL_H,z); lamp.traverse(o=>{ o.castShadow=false; }); scene.add(lamp); world.lamps.push({x,z,d:0}); }
  for(let i=0;i<LIGHTS;i++){ const pl=new THREE.PointLight(L.lamp,0,19,1.6); pl.position.set(-100,WALL_H-.9,-100); scene.add(pl); world.lightPool.push({light:pl,lamp:null,cur:0}); }
  world.particles=new Particles(scene);
  world.avatar=buildAvatar(save.equipped,'stand'); world.avatar.visible=false; scene.add(world.avatar);
  rebuildHands();
  spawns.forEach(([tp,x,z])=>spawnTroll(tp,x,z));
  world.totalTrolls=world.trolls.length;
  game.levelStats={kills:0,coins:0,secrets:0,saddles:0,time:0,golds:0,nests:0};
  updateLights(0,true);
}
function rebuildHands(){ if(world.hands){ camera.remove(world.hands); } world.hands=buildHands(save.equipped); world.hands.position.set(.24,-.3,-.62); world.ball=buildVolleyball(false,.11); world.ball.position.set(0,.02,-.08); world.ballGold=buildVolleyball(true,.11); world.ballGold.position.copy(world.ball.position); world.ballGold.visible=false; world.hands.add(world.ball); world.hands.add(world.ballGold); camera.add(world.hands); if(world.avatar&&scene){ scene.remove(world.avatar); world.avatar=buildAvatar(save.equipped,'stand'); world.avatar.visible=false; scene.add(world.avatar); } }

let lightT=0;
function updateLights(dt,force){ lightT-=dt; const P=player;
  if(lightT<=0||force){ lightT=.2; for(const l of world.lamps) l.d=(l.x-P.x)**2+(l.z-P.z)**2; const near=world.lamps.filter(l=>l.d<34*34).sort((a,b)=>a.d-b.d).slice(0,LIGHTS); const free=world.lightPool.filter(s=>!s.lamp||!near.includes(s.lamp)); for(const s of world.lightPool) if(s.lamp&&!near.includes(s.lamp)) s.lamp=null; for(const l of near){ if(world.lightPool.some(s=>s.lamp===l)) continue; const s=free.shift(); if(!s) break; s.lamp=l; s.cur=0; s.light.position.set(l.x,WALL_H-.9,l.z); } }
  for(const s of world.lightPool){ const target=s.lamp?55:0; s.cur=force?target:lerp(s.cur,target,Math.min(1,dt*5)); s.light.intensity=s.cur; }
  if(world.sun){ const sx=Math.round(P.x/2)*2, sz=Math.round(P.z/2)*2; world.sun.position.set(sx+18,60,sz+11); world.sun.target.position.set(sx,0,sz); world.sun.target.updateMatrixWorld(); } }
function updateDoors(dt){ for(const d of world.doors){ const cx=d.c*T+T/2, cz=d.r*T+T/2; const pd=Math.hypot(player.x-cx,player.z-cz); if(pd>30) continue; let near=pd<2.8; if(!near) for(const t of world.trolls){ if(!t.dead&&t.state==='chase'&&Math.abs(t.x-cx)<2.6&&Math.abs(t.z-cz)<2.6){ near=true; break; } } const target=near?1:0; if(target!==d.target){ d.target=target; if(target===1&&d.open<.1&&pd<14) SFX.door(); } d.open=clamp(d.open+(target?dt*2.2:-dt*1.6),0,1); d.panel.position.x=d.open*T*.96; } }
function updateGate(dt){ const gt=world.gate; if(!gt) return; const d=Math.hypot(player.x-gt.x,player.z-gt.z); const u=gt.mesh.userData;
  u.slots.forEach((s,i)=>{ const lit=i<world.keys; s.forEach(m=>{ if(lit&&m.material!==u.gold) m.material=u.gold; }); });
  if(!gt.opening&&d<3.6){ if(world.keys>=world.keysNeeded){ gt.opening=true; SFX.gateOpen(); toast('The horseshoe gate rises!','gold'); world.checkpoint={x:player.x,z:player.z,yaw:player.yaw}; } else if(gt.warnT<=0){ gt.warnT=3; SFX.gateLocked(); toast('Locked. Find '+(world.keysNeeded-world.keys)+' more golden horseshoe'+(world.keysNeeded-world.keys>1?'s':''),'bad'); } }
  if(gt.warnT>0) gt.warnT-=dt;
  if(gt.opening&&gt.open<1){ gt.open=Math.min(1,gt.open+dt*.45); u.bars.position.y=gt.open*(WALL_H-.5); if(Math.random()<.4) world.particles.emit(gt.x+rand(-1.5,1.5),.2,gt.z+rand(-.5,.5),0x8a8070,1,1.5,.6,4,.6); } }
function updateSecrets(dt){ for(const s of world.secrets){ if(!s.opening||s.done) continue; s.t+=dt; s.mesh.position.y=WALL_H/2-(s.t/1.5)*WALL_H; if(Math.random()<.5) world.particles.emit(s.c*T+T/2+rand(-1.8,1.8),.2,s.r*T+T/2+rand(-1.8,1.8),0x8a8070,1,1.5,.8,4,.7); if(s.t>=1.5){ s.done=true; world.grid[s.r][s.c]='.'; s.mesh.visible=false; } } }
const _fw=new THREE.Vector3(), _n=new THREE.Vector3();
function updateMirrors(){ Mirror.frame++; camera.getWorldDirection(_fw); let best=null,bd=1e9; for(const m of world.mirrors){ m.active=false; const dx=m.position.x-player.x, dz=m.position.z-player.z; const d=Math.hypot(dx,dz); if(d>14) continue; _n.set(0,0,1).applyEuler(m.rotation); if(_n.x*(player.x-m.position.x)+_n.z*(player.z-m.position.z)<=0) continue; if((dx*_fw.x+dz*_fw.z)/d<-.1) continue; if(d<bd){ bd=d; best=m; } } if(best) best.active=true; }
// explored-map memory for the minimap
let exploreT=0;
function updateExplore(dt){ exploreT-=dt; if(exploreT>0) return; exploreT=.2; const pc=Math.floor(player.x/T), pr=Math.floor(player.z/T); const W=world.W;
  for(let r=pr-5;r<=pr+5;r++) for(let c=pc-5;c<=pc+5;c++){ if(r<0||c<0||r>=world.H||c>=W) continue; const k=r*W+c; if(world.seen[k]) continue; const cx=c*T+T/2, cz=r*T+T/2; const ch=world.grid[r][c];
    if(ch==='#'||ch==='M'||ch==='S'){ for(const [dr,dc] of [[0,1],[1,0],[0,-1],[-1,0]]){ const rr=r+dr, cc=c+dc; if(rr>=0&&cc>=0&&rr<world.H&&cc<W&&world.seen[rr*W+cc]===2){ world.seen[k]=1; break; } } }
    else if(Math.hypot(cx-player.x,cz-player.z)<4||lineOfSight(player.x,player.z,cx,cz)) world.seen[k]=2; } }
function spawnBolt(ax,ay,az,bx,by,bz){ const a=new THREE.Vector3(ax,ay,az), b=new THREE.Vector3(bx,by,bz); const d=a.distanceTo(b); const m=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,d,6),new THREE.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:1})); m.position.copy(a).lerp(b,.5); m.lookAt(b); m.rotateX(Math.PI/2); scene.add(m); const m2=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,d,6),new THREE.MeshBasicMaterial({color:0xffb000,transparent:true,opacity:.4})); m2.position.copy(m.position); m2.quaternion.copy(m.quaternion); scene.add(m2); world.fx.push({mesh:m,t:0,life:.4},{mesh:m2,t:0,life:.4}); const steps=Math.ceil(d/1.2); for(let i=0;i<=steps;i++){ const p=a.clone().lerp(b,i/steps); world.particles.emit(p.x,p.y,p.z,0xffd54a,3,2,.5,2,.6); } }
function updateFx(dt){ for(let i=world.fx.length-1;i>=0;i--){ const f=world.fx[i]; f.t+=dt; f.mesh.material.opacity=Math.max(0,1-f.t/f.life)*(f.mesh.material.opacity>.5?1:.4); f.mesh.scale.x=f.mesh.scale.z=1+f.t*2; if(f.t>=f.life){ scene.remove(f.mesh); f.mesh.geometry.dispose(); f.mesh.material.dispose(); world.fx.splice(i,1); } } }
