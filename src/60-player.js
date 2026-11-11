// ===================== PLAYER: input, movement, shooting, pickups, damage =====================
const player={turnVel:0,turnHold:0,x:0,z:0,yaw:0,pitch:0,hp:6,maxHp:6,gold:0,fireCd:0,bob:0,t:0,speed:5.6,dead:false,recoil:0,invuln:0,shake:0,moving:false,goldTick:0,stepPhase:0,velX:0,velZ:0,mouseX:0,mouseY:0};
const keys=new Set();
const GAME_KEYS=['Tab','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
window.addEventListener('keydown',e=>{
  if(GAME_KEYS.includes(e.code)&&(game.state==='play'||game.state==='bonus'||e.code==='Tab')) e.preventDefault();
  if(e.repeat) return; keys.add(e.code);
  if(e.code==='KeyN'){ const on=Music.toggle(); toast(on?'Music on':'Music off'); updateMusicButtons(); }
  if(game.state==='play'){ if(e.code==='Space'){ SFX.unlock(); shoot(); } if(e.code==='KeyE'||e.code==='KeyF') tryPushSecret(); if(e.code==='KeyM') toggleBigMap(); if(e.code==='Tab'||e.code==='KeyI') openStore('shop'); }
  else if(game.state==='bonus'){ bonusKey(e); }
  else if(game.state==='store'&&(e.code==='Tab'||e.code==='Escape')){ closeStore(); }
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>keys.clear());
// mouse look: ignore the giant spikes some browsers send with pointer lock, then smooth lightly
window.addEventListener('mousemove',e=>{ if(game.state!=='play'||player.dead) return; const locked=document.pointerLockElement===canvas; if(!locked&&!(e.buttons&1)) return; const mx=e.movementX, my=e.movementY; if(Math.abs(mx)>220||Math.abs(my)>220) return; player.mouseX+=mx; player.mouseY+=my; });
canvas.addEventListener('mousedown',e=>{ if(game.state==='play'){ SFX.unlock(); if(document.pointerLockElement!==canvas) lockPointer(); if(e.button===0) shoot(); } });
canvas.addEventListener('contextmenu',e=>e.preventDefault());
function lockPointer(){ try{ const p=canvas.requestPointerLock(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} }
function unlockPointer(){ try{ if(document.pointerLockElement===canvas) document.exitPointerLock(); }catch(e){} }
document.addEventListener('pointerlockchange',()=>{ if(document.pointerLockElement!==canvas&&game.state==='play'&&!player.dead) openStore('shop'); });
document.addEventListener('pointerlockerror',()=>{});

function forwardVec(){ return new THREE.Vector3(-Math.sin(player.yaw),0,-Math.cos(player.yaw)); }
function rightVec(){ return new THREE.Vector3(Math.cos(player.yaw),0,-Math.sin(player.yaw)); }

function updatePlayer(dt){
  player.t+=dt; game.time+=dt; game.levelStats.time+=dt;
  if(player.fireCd>0) player.fireCd-=dt; if(player.invuln>0) player.invuln-=dt; if(player.recoil>0) player.recoil=Math.max(0,player.recoil-dt*5); if(player.shake>0) player.shake=Math.max(0,player.shake-dt*3);
  // mouse: apply accumulated movement with a short smoothing tail
  const take=1-Math.exp(-dt*30); const mx=player.mouseX*take, my=player.mouseY*take; player.mouseX-=mx; player.mouseY-=my; player.yaw-=mx*.0022; player.pitch=clamp(player.pitch-my*.0022,-1.35,1.35);
  // keyboard turning: quick ease-in, ramps while held, glides out
  const turnIn=((keys.has('ArrowLeft')||keys.has('KeyQ'))?1:0)-(keys.has('ArrowRight')?1:0);
  player.turnHold=turnIn?Math.min(1,player.turnHold+dt*2.2):0;
  const turnTarget=turnIn*(1.9+1.0*player.turnHold);
  player.turnVel+=(turnTarget-player.turnVel)*(1-Math.exp(-dt*(turnIn?13:16))); if(Math.abs(player.turnVel)<.002) player.turnVel=0; player.yaw+=player.turnVel*dt;
  // movement: forward/back + strafe. Holding a turn arrow while going forward also drifts that way, so diagonals feel diagonal.
  const fwdIn=((keys.has('KeyW')||keys.has('ArrowUp'))?1:0)-((keys.has('KeyS')||keys.has('ArrowDown'))?1:0);
  let strafe=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0); if(fwdIn&&turnIn&&!strafe) strafe=-turnIn*.45;
  const f=forwardVec(), r=rightVec(); const mvx=f.x*fwdIn+r.x*strafe, mvz=f.z*fwdIn+r.z*strafe; const len=Math.hypot(mvx,mvz);
  const sprint=keys.has('ShiftLeft')||keys.has('ShiftRight'); const sp=player.speed*(sprint?1.5:1);
  const tx=len?mvx/len*sp:0, tz=len?mvz/len*sp:0; const acc=1-Math.exp(-dt*(len?14:18)); player.velX+=(tx-player.velX)*acc; player.velZ+=(tz-player.velZ)*acc;
  const spd=Math.hypot(player.velX,player.velZ); player.moving=spd>.4;
  if(spd>.01) moveWithCollision(player,player.velX*dt,player.velZ*dt,.42);
  if(player.moving){ player.bob+=dt*spd*1.75; const ph=Math.floor(player.bob/Math.PI); if(ph!==player.stepPhase){ player.stepPhase=ph; SFX.step(ph&1); } }
  if(player.gold>0){ player.gold-=dt; $('goldT').textContent=Math.max(0,player.gold).toFixed(1); const sec=Math.ceil(player.gold); if(sec<=3&&sec!==player.goldTick){ player.goldTick=sec; SFX.tick(); } if(player.gold<=0){ player.gold=0; setGoldMode(false); } }
  const bobY=Math.sin(player.bob)*.035*Math.min(1,spd/4); const sh=player.shake*.05;
  camera.position.set(player.x+rand(-sh,sh),EYE+bobY+rand(-sh,sh),player.z+rand(-sh,sh)); camera.rotation.set(player.pitch,player.yaw,-player.turnVel*.012+player.shake*rand(-.01,.01));
  world.hands.position.set(.24+Math.sin(player.bob*.5)*.012*Math.min(1,spd/4),-.3+bobY*.5+player.recoil*.05,-.62+player.recoil*.12); world.hands.rotation.x=player.recoil*.5; world.hands.rotation.y=lerp(world.hands.rotation.y,player.turnVel*.05,Math.min(1,dt*8)); world.hands.rotation.z=player.turnVel*.025;
  world.avatar.position.set(player.x,0,player.z); world.avatar.rotation.y=player.yaw+Math.PI; animateAvatar(world.avatar,player.t,player.moving);
  for(const p of world.pickups){ if(p.taken) continue; const dx=p.x-player.x, dz=p.z-player.z, d2=dx*dx+dz*dz; if(d2>900){ p.mesh.visible=false; continue; } p.mesh.visible=true; p.mesh.position.y=p.baseY+(p.kind==='saddle'?0:Math.sin(player.t*2.2+p.phase)*.1); p.mesh.rotation.y+=dt*(p.kind==='coin'?2.5:1.2); if(p.mesh.userData.ring) p.mesh.userData.ring.rotation.z+=dt*2; if(d2<1.4) collect(p); }
  if(world.exit){ world.exit.userData.pad.rotation.y+=dt; if(tileAt(player.x,player.z)==='X') levelComplete(); }
  if(game.comboT>0){ game.comboT-=dt; if(game.comboT<=0){ game.combo=0; $('combo').hidden=true; } }
  if(player.hp<=2&&player.hp>0){ player.hbT=(player.hbT||0)-dt; if(player.hbT<=0){ player.hbT=.85; SFX.heartbeat(); } }
}
function shoot(){ if(player.fireCd>0||player.dead||game.state!=='play') return; const gold=player.gold>0; player.fireCd=gold?.26:.36; player.recoil=1;
  const dir=new THREE.Vector3(); camera.getWorldDirection(dir); const start=camera.position.clone().add(dir.clone().multiplyScalar(.6)); start.y-=.12;
  const ball=buildVolleyball(gold,.2); ball.position.copy(start); scene.add(ball); if(gold) ball.add(glowSprite(0xffc030,1.4));
  const vel=dir.multiplyScalar(gold?34:27); vel.y+=1.2;
  world.projectiles.push({mesh:ball,vel,gold,life:3,bounces:0,spin:new THREE.Vector3(rand(-6,6),rand(-6,6),rand(-6,6))});
  if(gold) SFX.goldShoot(); else SFX.shoot(); }
function updateProjectiles(dt){
  for(let i=world.projectiles.length-1;i>=0;i--){ const p=world.projectiles[i]; p.life-=dt; let gone=p.life<=0;
    if(!gone){ p.vel.y-=12*dt; const m=p.mesh.position; const nx=m.x+p.vel.x*dt, ny=m.y+p.vel.y*dt, nz=m.z+p.vel.z*dt;
      const nest=hitNestAt(nx,nz)||hitNestAt(m.x,nz)||hitNestAt(nx,m.z); if(nest){ damageNest(nest,p.gold?6:1); gone=true; }
      if(!gone){ if(solidAt(nx,m.z)){ p.vel.x*=-.5; p.bounces++; SFX.bounce(m.x,m.z); } else m.x=nx;
        if(solidAt(m.x,nz)){ p.vel.z*=-.5; p.bounces++; SFX.bounce(m.x,m.z); } else m.z=nz;
        if(ny<.2){ m.y=.2; p.vel.y*=-.55; p.vel.x*=.8; p.vel.z*=.8; p.bounces++; if(Math.abs(p.vel.y)>1.5) SFX.bounce(m.x,m.z); } else if(ny>WALL_H-.2){ m.y=WALL_H-.2; p.vel.y*=-.5; } else m.y=ny;
        p.mesh.rotation.x+=p.spin.x*dt; p.mesh.rotation.y+=p.spin.y*dt; p.mesh.rotation.z+=p.spin.z*dt;
        if(p.bounces>3) gone=true;
        for(const tr of world.trolls){ if(tr.dead) continue; const dx=tr.x-m.x, dz=tr.z-m.z, R=.7*tr.type.size+.22; if(dx*dx+dz*dz<R*R&&m.y<2.5*tr.type.size+.2){ hitTroll(tr,p); gone=true; break; } } } }
    if(gone){ scene.remove(p.mesh); p.mesh.traverse(o=>{ if(o.isSprite) o.material.dispose(); }); world.projectiles.splice(i,1); } }
}
function setGoldMode(on){ world.ball.visible=!on; world.ballGold.visible=on; $('goldTimer').hidden=!on; $('goldVignette').style.opacity=on?1:0; Music.gold=on; if(!on&&game.state==='play') toast('Golden ball used up'); }
function addCoins(n){ save.coins+=n; game.levelStats.coins+=n; $('coins').textContent=save.coins; persist(); }
function collect(p){ p.taken=true; scene.remove(p.mesh); switch(p.kind){
  case 'coin': addCoins(1); SFX.coin(); world.particles.emit(p.x,.6,p.z,0xffd54a,5,2,.5,6,.6); break;
  case 'heart': if(player.hp>=player.maxHp){ p.taken=false; scene.add(p.mesh); return; } player.hp=Math.min(player.maxHp,player.hp+2); renderHearts(); SFX.heal(); toast('+1 heart','good'); break;
  case 'gold': player.gold=10; player.goldTick=0; setGoldMode(true); SFX.gold(); toast('GOLDEN VOLLEYBALL! 10 seconds of boom','gold'); game.levelStats.golds++; break;
  case 'boost': save.boosters.boost++; toast('Boost booster (arena) +1','good'); SFX.pickup(); break;
  case 'jump': save.boosters.jump++; toast('Super Jump booster (arena) +1','good'); SFX.pickup(); break;
  case 'craft': save.craft[p.id]=(save.craft[p.id]||0)+1; toast('Picked up: '+craftItem(p.id).name); SFX.pickup(); break;
  case 'key': world.keys++; SFX.key(); world.checkpoint={x:p.x,z:p.z,yaw:player.yaw}; toast('Golden horseshoe '+world.keys+'/'+world.keysNeeded+(world.keys>=world.keysNeeded?'. The exit gate will open!':'. Checkpoint saved'),'gold'); world.particles.emit(p.x,1.3,p.z,0xffd54a,40,5,1.2); updateKeysHud(); break;
  case 'saddle': { if(!save.saddles.includes(p.id)){ save.saddles.push(p.id); if(!save.saddle||saddle(p.id).coinMult>saddle(save.saddle).coinMult) save.saddle=p.id; } const d=saddle(p.id); toast('Saddle found: '+d.name+' ('+d.rarity+')','violet'); SFX.saddle(); game.levelStats.saddles++; world.particles.emit(p.x,1.2,p.z,d.accent,40,5,1.2); break; } }
  persist(); updateMinibox(); }
function damagePlayer(n){ if(player.invuln>0||player.dead) return; player.hp-=n; player.invuln=.8; player.shake=1; SFX.hurt(); const d=$('dmg'); d.style.opacity=1; setTimeout(()=>d.style.opacity=0,200); renderHearts(); if(player.hp<=0){ player.hp=0; die(); } }
function renderHearts(){ const box=$('hearts'); box.innerHTML=''; for(let i=0;i<player.maxHp/2;i++){ const v=clamp(player.hp-i*2,0,2); const el=document.createElement('div'); el.className='heart'; el.innerHTML='<svg viewBox="0 0 24 22"><defs><clipPath id="hc'+i+'"><rect x="0" y="0" width="'+(v*12)+'" height="22"/></clipPath></defs><path d="M12 21 C-6 9 4 -3 12 5 C20 -3 30 9 12 21Z" fill="#3a1a2a" stroke="#ff5d5d" stroke-width="1.5"/><path d="M12 21 C-6 9 4 -3 12 5 C20 -3 30 9 12 21Z" fill="#ff4d6d" clip-path="url(#hc'+i+')"/></svg>'; box.appendChild(el); } }
function updateKeysHud(){ let h=''; for(let i=0;i<world.keysNeeded;i++) h+='<span class="shoe'+(i<world.keys?' on':'')+'">U</span>'; $('keysHud').innerHTML=h; }
function tryPushSecret(){ const dir=new THREE.Vector3(); camera.getWorldDirection(dir); for(let d=.6;d<=3;d+=.4){ const x=player.x+dir.x*d, z=player.z+dir.z*d; if(tileAt(x,z)==='S'){ const s=world.secrets.find(s=>s.r===Math.floor(z/T)&&s.c===Math.floor(x/T)); if(s&&!s.opening){ s.opening=true; SFX.secret(); toast('The wall slides away. A hidden room!','violet'); game.levelStats.secrets++; save.secrets[world.index+':'+s.r+':'+s.c]=true; persist(); } return; } if(solidAt(x,z)) break; } SFX.stuck(); }
function die(){ player.dead=true; game.state='dead'; unlockPointer(); SFX.playerDie(); setTimeout(()=>{ $('deathText').textContent='The trolls got you in '+world.level.name+'. Respawn at your last checkpoint with everything you collected, or restart the level from scratch.'; showScreen('death'); },900); }
function respawn(){ const cp=world.checkpoint; Object.assign(player,{x:cp.x,z:cp.z,yaw:cp.yaw,pitch:0,hp:player.maxHp,dead:false,invuln:2.5,velX:0,velZ:0,turnVel:0}); renderHearts(); for(const t of world.trolls){ if(!t.dead&&Math.hypot(t.x-cp.x,t.z-cp.z)<12){ t.state='idle'; t.lastSeen=null; } } world.enemyShots.forEach(s=>scene.remove(s.mesh)); world.enemyShots=[]; camera.rotation.z=0; enterLevel(); }
