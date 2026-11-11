// ===================== TROLLS: spawning, AI, ranged mud, nests, hits, gold chain explosions, drops =====================
const RANGED={sapphire:{range:15,cd:2.6,speed:15},violet:{range:18,cd:1.8,speed:17}};
function spawnTroll(tp,x,z,fromNest){ const m=makeTroll(tp); m.position.set(x,0,z); m.rotation.y=rand(0,6.28); scene.add(m);
  const bar=new THREE.Group(); const bg=new THREE.Mesh(new THREE.PlaneGeometry(1,.14),new THREE.MeshBasicMaterial({color:0x220000,depthTest:false,transparent:true,opacity:.8})); const fg=new THREE.Mesh(new THREE.PlaneGeometry(.94,.09),new THREE.MeshBasicMaterial({color:0x4cff6a,depthTest:false})); fg.position.z=.01; bar.add(bg); bar.add(fg); bar.renderOrder=10; bar.visible=false; scene.add(bar);
  const hp=Math.max(1,Math.round(tp.hp*(world.hpMul||1)));
  const t={type:tp,mesh:m,x,z,hp,max:hp,state:fromNest?'chase':'idle',cd:rand(.5,1.5),shootCd:rand(1,3),anim:rand(0,6),moving:false,lunge:0,flash:0,dead:false,deathT:0,wx:0,wz:0,wt:rand(0,2),los:false,lastSeen:fromNest?{x:player.x,z:player.z}:null,losT:rand(0,.3),stuck:0,face:m.rotation.y,bar,fg,chainT:0,grunt:rand(3,9),stepT:0,asleep:false,nest:null};
  world.trolls.push(t); return t; }
function updateTrolls(dt){
  for(let i=world.trolls.length-1;i>=0;i--){ const tr=world.trolls[i];
    if(tr.dead){ tr.deathT+=dt; const s=tr.type.size; tr.mesh.scale.set(s*(1+tr.deathT*1.5),s*Math.max(.04,1-tr.deathT*3),s*(1+tr.deathT*1.5)); if(tr.deathT>.45){ scene.remove(tr.mesh); world.trolls.splice(i,1); } continue; }
    const dx=player.x-tr.x, dz=player.z-tr.z, d=Math.hypot(dx,dz);
    // far-away idle trolls: hidden and frozen (big performance win on large maps)
    if(d>46&&tr.state!=='chase'){ if(tr.mesh.visible){ tr.mesh.visible=false; tr.bar.visible=false; } continue; } if(!tr.mesh.visible) tr.mesh.visible=true;
    if(tr.chainT>0){ tr.chainT-=dt; if(tr.chainT<=0){ SFX.explode(); world.particles.emit(tr.x,1.1*tr.type.size,tr.z,0xffd54a,60,9,1.2); world.particles.emit(tr.x,1.1*tr.type.size,tr.z,tr.type.color,30,6,.9); toast('Chain zap: '+tr.type.name+' exploded','gold'); killTroll(tr,true); continue; } }
    tr.losT-=dt; if(tr.losT<=0){ tr.losT=.25; tr.los=d<22&&lineOfSight(tr.x,tr.z,player.x,player.z); if(tr.los){ if(tr.state!=='chase'&&d<15){ tr.state='chase'; SFX.trollRoar(tr.type.id,tr.x,tr.z); } if(tr.state==='chase') tr.lastSeen={x:player.x,z:player.z}; } }
    let mv=false; tr.cd-=dt; tr.shootCd-=dt; tr.stuck-=dt; tr.lunge=Math.max(0,tr.lunge-dt*3);
    if(tr.state==='chase'&&tr.lastSeen){
      const ranged=RANGED[tr.type.id];
      if(ranged&&tr.los&&d>4&&d<ranged.range&&tr.shootCd<=0){ tr.shootCd=ranged.cd*rand(.8,1.2); tr.lunge=1; throwMud(tr,ranged.speed); }
      const tx=tr.los?player.x:tr.lastSeen.x, tz=tr.los?player.z:tr.lastSeen.z; const ddx=tx-tr.x, ddz=tz-tr.z, dd=Math.hypot(ddx,ddz); const reach=1.3+tr.type.size*.5;
      const keepAway=ranged&&tr.los&&d<7&&tr.type.id==='sapphire';
      if(tr.los&&d<reach){ if(tr.cd<=0){ tr.cd=1.2; tr.lunge=1; SFX.trollSwing(tr.x,tr.z); setTimeout(()=>{ if(!tr.dead&&Math.hypot(player.x-tr.x,player.z-tr.z)<reach+.4) damagePlayer(tr.type.dmg); },180); } tr.face=Math.atan2(dx,dz); }
      else if(dd>.6){ let mx=ddx/dd, mz=ddz/dd; if(keepAway){ mx=-mx*.6; mz=-mz*.6; } if(tr.stuck>0){ mx=tr.wx; mz=tr.wz; } const sp=tr.type.speed*dt; const bx=tr.x,bz=tr.z; moveWithCollision(tr,mx*sp,mz*sp,.42*tr.type.size); const moved=Math.hypot(tr.x-bx,tr.z-bz); mv=moved>sp*.25; if(!mv&&tr.stuck<=0){ tr.stuck=rand(.5,.9); const a=Math.atan2(mz,mx)+(Math.random()<.5?1:-1)*Math.PI/2; tr.wx=Math.cos(a); tr.wz=Math.sin(a); } tr.face=keepAway?Math.atan2(dx,dz):Math.atan2(mx,mz); }
      else if(!tr.los){ tr.state='idle'; }
      if(mv){ tr.stepT-=dt*tr.type.speed; if(tr.stepT<=0){ tr.stepT=1.6*tr.type.size; if(d<16) SFX.trollStep(tr.x,tr.z,tr.type.size); } }
    } else {
      tr.wt-=dt; if(tr.wt<=0){ tr.wt=rand(1,3); if(Math.random()<.6){ const a=rand(0,6.28); tr.wx=Math.cos(a); tr.wz=Math.sin(a); } else { tr.wx=tr.wz=0; } }
      if(tr.wx||tr.wz){ const sp=tr.type.speed*.35*dt; const bx=tr.x,bz=tr.z; moveWithCollision(tr,tr.wx*sp,tr.wz*sp,.42*tr.type.size); mv=Math.hypot(tr.x-bx,tr.z-bz)>sp*.25; if(!mv) tr.wt=0; tr.face=Math.atan2(tr.wx,tr.wz); }
      tr.grunt-=dt; if(tr.grunt<=0){ tr.grunt=rand(5,12); if(d<20) SFX.trollGrunt(tr.type.id,tr.x,tr.z); }
    }
    for(const o of world.trolls){ if(o===tr||o.dead) continue; const ox=tr.x-o.x, oz=tr.z-o.z; if(Math.abs(ox)>2||Math.abs(oz)>2) continue; const od=Math.hypot(ox,oz), min=.5*(tr.type.size+o.type.size); if(od<min&&od>0.001){ moveWithCollision(tr,ox/od*(min-od)*.5,oz/od*(min-od)*.5,.42*tr.type.size); } }
    tr.moving=mv; tr.mesh.rotation.y=lerpAngle(tr.mesh.rotation.y,tr.face,dt*9); tr.mesh.position.set(tr.x,0,tr.z); if(d<30) animateTroll(tr,dt);
    if(tr.flash>0){ tr.flash=Math.max(0,tr.flash-dt*6); const s=tr.type.size*(1+tr.flash*.18); tr.mesh.scale.set(s,s,s); }
    tr.bar.visible=tr.hp<tr.max&&d<25; if(tr.bar.visible){ tr.bar.position.set(tr.x,2.6*tr.type.size,tr.z); tr.bar.quaternion.copy(camera.quaternion); const ratio=tr.hp/tr.max; tr.fg.scale.x=ratio; tr.fg.position.x=-(1-ratio)*.47; tr.fg.material.color.setHex(ratio>.5?0x4cff6a:ratio>.25?0xffd54a:0xff5d5d); }
  }
}
function hitTroll(tr,p){ if(p.gold){ goldKill(tr); return; } tr.hp-=1; tr.flash=1; if(tr.state!=='chase') SFX.trollRoar(tr.type.id,tr.x,tr.z); tr.state='chase'; tr.lastSeen={x:player.x,z:player.z}; world.particles.emit(tr.x,1.3*tr.type.size,tr.z,0xffffff,8,3,.4,6,.6);
  const kl=Math.hypot(p.vel.x,p.vel.z)||1; moveWithCollision(tr,p.vel.x/kl*.55,p.vel.z/kl*.55,.42*tr.type.size); if(tr.hp<=0) killTroll(tr,false); else SFX.trollHit(tr.type.id,tr.x,tr.z); }
function killTroll(tr,byGold){ if(tr.dead) return; tr.dead=true; tr.deathT=0; SFX.trollDie(tr.type.id,tr.x,tr.z); save.kills++; game.levelStats.kills++; scene.remove(tr.bar); world.particles.emit(tr.x,1*tr.type.size,tr.z,tr.type.color,byGold?50:26,byGold?8:5,byGold?1.2:.8); for(let k=0;k<7;k++) world.particles.emit(tr.x,1.6*tr.type.size,tr.z,RAINBOW[k],3,4,.9);
  if(tr.nest) tr.nest.spawned=tr.nest.spawned.filter(x=>x!==tr);
  game.combo++; game.comboT=2.6; if(game.combo>=2){ const bonus=game.combo; addCoins(bonus); SFX.combo(game.combo); const c=$('combo'); c.hidden=false; c.textContent='x'+game.combo+' COMBO  +'+bonus; c.style.animation='none'; void c.offsetWidth; c.style.animation=''; }
  dropLoot(tr); }
function goldKill(tr){ SFX.explode(); player.shake=1.4; world.particles.emit(tr.x,1.2*tr.type.size,tr.z,0xffd54a,80,10,1.3); world.particles.emit(tr.x,1.2*tr.type.size,tr.z,0xffffff,30,7,.8);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.5,.08,8,32),new THREE.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:1})); ring.position.set(tr.x,1,tr.z); ring.rotation.x=Math.PI/2; scene.add(ring); world.fx.push({mesh:ring,t:0,life:.5});
  killTroll(tr,true);
  let nearest=null,nd=1e9; for(const o of world.trolls){ if(o.dead||o===tr||o.chainT>0) continue; const d=Math.hypot(o.x-tr.x,o.z-tr.z); if(d<nd){ nd=d; nearest=o; } }
  if(nearest&&nd<40){ spawnBolt(tr.x,1.1*tr.type.size,tr.z,nearest.x,1.1*nearest.type.size,nearest.z); SFX.zap(); nearest.chainT=.28; nearest.state='chase'; toast('GOLD SMASH! Zapping the nearest troll...','gold'); } else toast('GOLD SMASH!','gold'); }
function dropLoot(tr){ const d=tr.type.drops; const n=randInt(d.coins[0],d.coins[1]); for(let i=0;i<n;i++) addPickup('coin',null,tr.x+rand(-.9,.9),tr.z+rand(-.9,.9));
  if(d.gold&&Math.random()<d.gold) addPickup('gold',null,tr.x,tr.z);
  if(d.craft&&Math.random()<d.craft) addPickup('craft',pick(CRAFT).id,tr.x+rand(-.6,.6),tr.z+rand(-.6,.6));
  if(d.boost&&Math.random()<d.boost) addPickup('boost',null,tr.x,tr.z);
  if(d.jump&&Math.random()<d.jump) addPickup('jump',null,tr.x,tr.z);
  if(Math.random()<.06) addPickup('heart',null,tr.x,tr.z); }

// ---- mud balls thrown by Sapphire trolls and the King ----
function throwMud(tr,speed){ const m=buildMudBall(); const h=1.7*tr.type.size; m.position.set(tr.x,h,tr.z); scene.add(m); const dx=player.x-tr.x, dz=player.z-tr.z, d=Math.hypot(dx,dz)||1; const t=d/speed;
  world.enemyShots.push({mesh:m,vx:dx/d*speed,vz:dz/d*speed,vy:(EYE-.3-h)/t+6*t,life:3}); SFX.mudThrow(tr.x,tr.z); }
function updateEnemyShots(dt){ for(let i=world.enemyShots.length-1;i>=0;i--){ const s=world.enemyShots[i]; s.life-=dt; s.vy-=12*dt; const p=s.mesh.position; p.x+=s.vx*dt; p.y+=s.vy*dt; p.z+=s.vz*dt; s.mesh.rotation.x+=dt*8; let gone=s.life<=0||p.y<.1||solidAt(p.x,p.z);
    if(!gone&&Math.hypot(p.x-player.x,p.z-player.z)<.65&&p.y<EYE+.4){ gone=true; damagePlayer(1); SFX.mudSplat(); const v=$('mud'); v.style.opacity=1; setTimeout(()=>v.style.opacity=0,700); }
    if(gone){ world.particles.emit(p.x,Math.max(.2,p.y),p.z,0x5a3a1a,10,3,.6,9,.8); scene.remove(s.mesh); world.enemyShots.splice(i,1); } } }

// ---- troll nests: spawn reinforcements until smashed ----
function hitNestAt(x,z){ if(tileAt(x,z)!=='R') return null; const n=world.nestMap.get(Math.floor(z/T)*1000+Math.floor(x/T)); return n&&!n.dead?n:null; }
function damageNest(n,amt){ n.hp-=amt; n.flash=1; SFX.nestHit(n.x,n.z); world.particles.emit(n.x,1,n.z,0x8a8070,10,4,.6); world.particles.emit(n.x,1,n.z,pick(RAINBOW),6,3,.6);
  if(n.hp<=0&&!n.dead){ n.dead=true; SFX.nestDie(n.x,n.z); player.shake=1.6; game.levelStats.nests++; toast('Troll nest destroyed!','gold'); for(let k=0;k<7;k++) world.particles.emit(n.x,1.2,n.z,RAINBOW[k],14,8,1.3); world.particles.emit(n.x,.8,n.z,0x6a6058,40,7,1.2);
    scene.remove(n.mesh); for(let i=0;i<10;i++) addPickup('coin',null,n.x+rand(-1.5,1.5),n.z+rand(-1.5,1.5)); if(Math.random()<.6) addPickup('gold',null,n.x,n.z); else addPickup('heart',null,n.x,n.z); updateSecretsHud(); } }
function updateNests(dt){ for(const n of world.nests){ if(n.dead) continue; n.t+=dt; const u=n.mesh.userData; const d=Math.hypot(player.x-n.x,player.z-n.z);
    u.core.material.emissive.setHSL((n.t*.15)%1,1,.5); const pulse=1+Math.sin(n.t*4)*.08+n.flash*.25; u.core.scale.setScalar(pulse); u.glow.material.color.copy(u.core.material.emissive); n.flash=Math.max(0,n.flash-dt*4);
    if(d<24){ n.cd-=dt; n.spawned=n.spawned.filter(t=>!t.dead); if(n.cd<=0&&n.spawned.length<3){ n.cd=rand(8,13); const tp=TROLLS[+pick(world.types.split(''))-1]; let sx=n.x,sz=n.z; for(const [ox,oz] of [[T,0],[-T,0],[0,T],[0,-T]]){ if(!solidAt(n.x+ox,n.z+oz)){ sx=n.x+ox*.7; sz=n.z+oz*.7; break; } }
      const t=spawnTroll(tp,sx,sz,true); t.nest=n; n.spawned.push(t); SFX.nestSpawn(n.x,n.z); world.particles.emit(sx,.6,sz,0x6a6058,20,4,.8); for(let k=0;k<7;k++) world.particles.emit(sx,1,sz,RAINBOW[k],2,3,.6); } } } }
