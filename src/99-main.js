// ===================== MAIN LOOP & BOOT =====================
function onResize(){ const w=window.innerWidth, h=window.innerHeight; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); if(arena.cam){ arena.cam.aspect=w/h; arena.cam.updateProjectionMatrix(); } }
window.addEventListener('resize',onResize);
let last=performance.now(), secretsHudT=0, sdt=1/60;
// adaptive resolution: if frames are slow for 2 s, render fewer pixels (keeps turning smooth on weaker GPUs)
function perfTick(raw){ PERF.acc+=raw; PERF.frames++; if(PERF.acc>=2){ const avg=PERF.acc/PERF.frames; PERF.acc=0; PERF.frames=0; let r=PERF.ratio; if(avg>1/45&&r>.7) r=Math.max(.7,r-.2); else if(avg<1/58&&r<Math.min(window.devicePixelRatio||1,1.5)) r=Math.min(Math.min(window.devicePixelRatio||1,1.5),r+.1); if(r!==PERF.ratio){ PERF.ratio=r; renderer.setPixelRatio(r); renderer.setSize(window.innerWidth,window.innerHeight,false); } } }
function loop(now){ requestAnimationFrame(loop); const raw=Math.min(.1,Math.max(0,(now-last)/1000)); last=now; sdt=lerp(sdt,raw,.25); const dt=Math.min(.05,sdt); const st=game.state; if(st==='play'||st==='bonus') perfTick(raw);
  try{
    if(st==='play'){ updatePlayer(dt); if(game.state!=='play') return; updateTrolls(dt); updateProjectiles(dt); updateEnemyShots(dt); updateNests(dt); updateDoors(dt); updateGate(dt); updateSecrets(dt); updateLights(dt); updateMirrors(); updateExplore(dt); updateMinimap(dt); updateFx(dt); world.particles.update(dt); secretsHudT+=dt; if(secretsHudT>.5){ secretsHudT=0; updateSecretsHud(); } renderer.render(scene,camera); }
    else if(st==='dead'){ camera.position.y=lerp(camera.position.y,.55,Math.min(1,dt*3)); camera.rotation.z=lerp(camera.rotation.z,.6,Math.min(1,dt*3)); updateFx(dt); world.particles.update(dt); renderer.render(scene,camera); }
    else if(st==='intro'||st==='levelclear'||(st==='store'&&(game.returnTo==='play'||game.returnTo==='intro'||game.returnTo==='levelclear'||game.returnTo==='dead'))){ if(scene){ world.particles.update(dt); updateFx(dt); for(const p of world.pickups){ if(!p.taken) p.mesh.rotation.y+=dt; } updateMirrors(); renderer.render(scene,camera); } }
    else if(st==='bonus'){ updateBonus(dt); if(arena.scene) renderer.render(arena.scene,arena.cam); }
    else if(st==='bonusend'||(st==='store'&&game.returnTo==='bonusend')){ if(arena.scene){ arena.t+=dt; animateHorse(arena.horse,arena.t,.0001,null); arena.horse.userData.legs.forEach(l=>{ l.rotation.x=0; l.userData.knee.rotation.x=0; }); renderer.render(arena.scene,arena.cam); } }
    else if(st==='title'||st==='win'||(st==='store'&&(game.returnTo==='title'||game.returnTo==='win'))){ renderTitleBackdrop(dt); }
    if(st==='store'){ updatePreview(dt); updateStable(dt); }
  }catch(err){ console.error(err); }
}
// slowly turning showcase scene behind the title screen
const backdrop={scene:null,cam:null,t:0,things:[]};
function renderTitleBackdrop(dt){ if(!backdrop.scene){ const sc=new THREE.Scene(); sc.background=new THREE.Color(0x120b1e); sc.fog=new THREE.FogExp2(0x120b1e,.06); sc.add(new THREE.HemisphereLight(0xffd0ff,0x2a1a44,.9)); const dl=new THREE.DirectionalLight(0xffffff,2); dl.position.set(3,6,4); dl.castShadow=true; sc.add(dl); const fl=new THREE.Mesh(new THREE.CircleGeometry(12,48),Mat(0x1d1230)); fl.rotation.x=-Math.PI/2; fl.receiveShadow=true; sc.add(fl);
    TROLLS.forEach((tp,i)=>{ const t=buildTroll(tp); const a=i/TROLLS.length*Math.PI*2; t.position.set(Math.sin(a)*4.2,0,Math.cos(a)*4.2); t.lookAt(0,0,0); sc.add(t); backdrop.things.push(t); });
    const av=buildAvatar(save.equipped,'stand'); sc.add(av); backdrop.av=av; const ball=buildVolleyball(true,.3); ball.position.set(0,2.6,0); sc.add(ball); backdrop.ball=ball; const l=new THREE.PointLight(0xffc030,8,8,2); l.position.set(0,2.6,0); sc.add(l);
    backdrop.cam=new THREE.PerspectiveCamera(50,window.innerWidth/window.innerHeight,.1,100); backdrop.scene=sc; }
  backdrop.t+=dt; const c=backdrop.cam; c.aspect=window.innerWidth/window.innerHeight; c.updateProjectionMatrix(); c.position.set(Math.sin(backdrop.t*.15)*8,2.6,Math.cos(backdrop.t*.15)*8); c.lookAt(0,1.2,0); backdrop.ball.rotation.y+=dt; backdrop.ball.position.y=2.6+Math.sin(backdrop.t*2)*.2; backdrop.things.forEach((t,i)=>{ t.userData.body.position.y=.78+Math.abs(Math.sin(backdrop.t*3+i))*.08; t.userData.head.rotation.z=Math.sin(backdrop.t*2+i)*.1; }); animateAvatar(backdrop.av,backdrop.t,false); renderer.render(backdrop.scene,c); }

window.__vt={player,game,world,arena,startBonus,save,goldKill,addPickup,updateBonus,jumpHorse,AUDIO,PERF,respawn,damageNest,generateLevel,renderer};
function boot(){ renderTitle(); updateMinibox(); renderHearts(); showScreen('title'); onResize(); requestAnimationFrame(loop); }
boot();
