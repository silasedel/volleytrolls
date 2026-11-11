// ===================== BONUS ARENA: 30 seconds of show jumping on the horse =====================
const LANES=[-3.4,0,3.4];
const arena={scene:null,cam:null,horse:null,fences:[],t:0,timeLeft:30,z:0,lane:1,laneX:0,jumping:false,jumpT:0,jumpDur:.95,jumpH:1.7,y:0,penalties:0,cleared:0,coins:0,streak:0,boost:0,superJump:0,done:false,particles:null,lastFenceZ:14,knockSlow:0,started:false,countdown:3,saddleDef:null,stride:0,endT:0,endReason:''};
function startBonus(){
  game.state='bonus'; unlockPointer(); Music.play('arena','ambArena'); setReverb(.04); try{ document.activeElement&&document.activeElement.blur(); }catch(e){} hideScreens(); $('hud').hidden=true; $('minibox').hidden=true; $('bonusHud').hidden=false; $('boosterHud').hidden=false;
  disposeScene(arena.scene);
  const sc=new THREE.Scene(); arena.scene=sc; sc.background=tex('sky',skyTexture); sc.fog=new THREE.Fog(0xd6ecff,70,190);
  sc.add(new THREE.HemisphereLight(0xbfe3ff,0x4a7a2a,.85));
  const sun=new THREE.DirectionalLight(0xfff4d6,2.4); sun.position.set(-25,60,-20); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); const c=sun.shadow.camera; c.left=-30;c.right=30;c.top=60;c.bottom=-30;c.near=1;c.far=200; sun.shadow.bias=-.0005; sc.add(sun); sc.add(sun.target); arena.sun=sun;
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(500,1400),new THREE.MeshStandardMaterial({map:tex('grass',grassTexture),roughness:1})); ground.rotation.x=-Math.PI/2; ground.position.z=550; ground.receiveShadow=true; sc.add(ground);
  const track=new THREE.Mesh(new THREE.PlaneGeometry(12.5,1400),Mat(0xd9c39a,{roughness:1,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2})); track.rotation.x=-Math.PI/2; track.position.set(0,.04,550); track.receiveShadow=true; sc.add(track);
  const white=Mat(0xffffff,{roughness:.6});
  for(const sd of [-1,1]){ for(let z=-20;z<1100;z+=8) mesh(G.box(.14,1.3,.14),white,sd*6.6,.65,z,sc); mesh(G.box(.08,.12,1130),white,sd*6.6,1.2,540,sc); mesh(G.box(.08,.12,1130),white,sd*6.6,.65,540,sc); }
  for(let i=0;i<60;i++){ const t=buildTree(); const sd=Math.random()<.5?-1:1; t.position.set(sd*rand(10,38),0,rand(-20,1100)); t.scale.setScalar(rand(.8,1.7)); sc.add(t); }
  for(let i=0;i<40;i++){ const sd=Math.random()<.5?-1:1; const fl=mesh(G.box(.06,3,.06),Mat(0xdddddd),sd*7.6,1.5,i*28,sc); mesh(G.box(1.2,.7,.02),Mat(pick([0xff5fa2,0xffd54a,0x4cc3ff,0x6ee7a8,0xb45cff])),sd*7.6+sd*.6,2.7,i*28,sc); }
  for(let i=0;i<24;i++){ const cl=new THREE.Group(); for(let k=0;k<5;k++) mesh(G.sph(rand(2.5,5),10,8),new THREE.MeshBasicMaterial({color:0xffffff}),rand(-5,5),rand(-1,1),rand(-2,2),cl); cl.position.set(rand(-150,150),rand(32,55),rand(-50,1000)); sc.add(cl); }
  const stands=new THREE.Group(); for(let i=0;i<3;i++){ mesh(G.box(14,.6,2.2),Mat(0x8a8fa0),0,.3+i*.6,-i*2.2,stands); for(let k=0;k<9;k++) mesh(G.sph(.28,8,6),Mat(pick([0xff5fa2,0xffd54a,0x4cc3ff,0x6ee7a8,0xb45cff,0xffffff])),-6+k*1.5,.9+i*.6,-i*2.2,stands); } stands.position.set(-16,0,40); stands.rotation.y=Math.PI/2; sc.add(stands);
  arena.saddleDef=saddle(save.saddle||'sad_loaner'); arena.cdShown=0;
  arena.horse=buildHorse(arena.saddleDef,save.equipped,save.horse); sc.add(arena.horse);
  arena.cam=new THREE.PerspectiveCamera(62,window.innerWidth/window.innerHeight,.1,320);
  arena.particles=new Particles(sc,400);
  Object.assign(arena,{fences:[],t:0,timeLeft:30,z:0,lane:1,laneX:0,jumping:false,jumpT:0,y:0,penalties:0,cleared:0,coins:0,streak:0,boost:0,superJump:0,done:false,lastFenceZ:16,knockSlow:0,started:false,countdown:3.2,stride:0,endT:0,endReason:'',tick:0});
  renderPenalties(); updateBonusHud(); renderBoosterHud(); $('bSaddle').textContent=arena.saddleDef.name+' · coins x'+arena.saddleDef.coinMult+' · air +'+Math.round(arena.saddleDef.window*100)+'%';
  $('bMsg').textContent='Ready...'; $('bTimer').classList.remove('low');
}
function spawnFence(z){ const lanes=[0,1,2]; const count=Math.random()<.3?2:1; const type=Math.random()<.32?'oxer':'vertical'; for(let i=0;i<count;i++){ const li=lanes.splice(Math.floor(Math.random()*lanes.length),1)[0]; const f=buildFence(type); f.position.set(LANES[li],0,z); arena.scene.add(f); arena.fences.push({z,lane:li,type,mesh:f,resolved:false,knockT:0}); } }
function bonusKey(e){ if(!arena.started||arena.done) return; if(e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW'){ e.preventDefault(); jumpHorse(); } else if(e.code==='ArrowLeft'||e.code==='KeyA'){ arena.lane=Math.max(0,arena.lane-1); } else if(e.code==='ArrowRight'||e.code==='KeyD'){ arena.lane=Math.min(2,arena.lane+1); } else if(e.code==='Digit1') useBooster('boost'); else if(e.code==='Digit2') useBooster('jump'); }
function jumpHorse(){ if(arena.jumping) return; arena.jumping=true; arena.jumpT=0; const sj=arena.superJump>0; arena.jumpDur=.95*(1+arena.saddleDef.window)*(sj?1.55:1); arena.jumpH=sj?3.3:1.75; if(sj) SFX.spring(); SFX.jump(); arena.particles.emit(arena.laneX,.1,arena.z,0xd9c39a,10,2,.6,6,.7); }
function useBooster(id){ if(game.state!=='bonus'||!arena.started||arena.done){ toast('Boosters work in the bonus arena','bad'); return; } if((save.boosters[id]||0)<=0){ SFX.fail(); return; } if(id==='boost'&&arena.boost>0||id==='jump'&&arena.superJump>0){ toast('Already active'); return; } save.boosters[id]--; persist(); if(id==='boost'){ arena.boost=BOOSTERS.boost.dur; toast('BOOST! Faster gallop','good'); SFX.boost(); } else { arena.superJump=BOOSTERS.jump.dur; toast('SUPER JUMP! Huge arc','violet'); SFX.spring(); } renderBoosterHud(); }
function updateBonus(dt){
  arena.t+=dt; const h=arena.horse;
  if(!arena.started){ arena.countdown-=dt; const n=Math.ceil(arena.countdown); if(n!==arena.cdShown&&n>0&&n<=3){ arena.cdShown=n; SFX.countdown(n); } $('bMsg').textContent=n>0?String(n):'GO!'; if(arena.countdown<=0){ arena.started=true; SFX.countdown(0); SFX.neigh(); startCanter(); setTimeout(()=>{ if($('bMsg').textContent==='GO!') $('bMsg').textContent=''; },700); } }
  if(arena.started&&!arena.done){
    arena.timeLeft-=dt; const tl=Math.max(0,arena.timeLeft); $('bTimer').textContent=Math.ceil(tl); if(tl<=5){ $('bTimer').classList.add('low'); const s=Math.ceil(tl); if(s!==arena.tick){ arena.tick=s; SFX.tick(); } } if(arena.timeLeft<=0) endBonus('Time is up');
    if(arena.boost>0) arena.boost-=dt; if(arena.superJump>0) arena.superJump-=dt; if(arena.knockSlow>0) arena.knockSlow-=dt;
    const speed=11*(arena.boost>0?1.6:1)*(arena.knockSlow>0?.45:1); arena.z+=speed*dt; arena.stride+=speed*dt; if(arena.canter){ arena.canter.playbackRate.value=(speed/11)*1.05; arena.canter._g.gain.value=lerp(arena.canter._g.gain.value,arena.jumping?0:.75,Math.min(1,dt*12)); }
    arena.laneX=lerp(arena.laneX,LANES[arena.lane],Math.min(1,dt*7));
    if(arena.jumping){ arena.jumpT+=dt; arena.y=arena.jumpH*Math.sin(Math.PI*Math.min(1,arena.jumpT/arena.jumpDur)); if(arena.jumpT>=arena.jumpDur){ arena.jumping=false; arena.y=0; SFX.land(); arena.particles.emit(arena.laneX,.1,arena.z,0xd9c39a,12,2.5,.6,6,.7); } }
    while(arena.lastFenceZ<arena.z+150){ arena.lastFenceZ+=rand(13,21); spawnFence(arena.lastFenceZ); }
    for(const f of arena.fences){ if(!f.resolved&&f.z<=arena.z){ f.resolved=true; if(f.lane!==arena.lane) continue; const need=f.type==='oxer'?1.25:1.15; const airLeft=arena.jumping?(arena.jumpDur-arena.jumpT)*speed:0; const ok=arena.jumping&&arena.y>need&&(f.type!=='oxer'||airLeft>1.1); if(ok){ arena.cleared++; arena.streak++; const base=f.type==='oxer'?8:5; const c=Math.round(base*arena.saddleDef.coinMult)+Math.min(5,arena.streak-1); arena.coins+=c; SFX.clear(); arena.particles.emit(arena.laneX,2.2,f.z,0xffd54a,16,4,.8,6,.8); if(arena.streak>=3||f.type==='oxer') SFX.crowdCheer(arena.streak>=6?1.2:.8); $('bMsg').textContent=(f.type==='oxer'?'OXER! ':'Clear! ')+'+'+c+(arena.streak>1?'  streak x'+arena.streak:''); arena.msgT=1; } else knockFence(f); } }
    if(arena.msgT>0){ arena.msgT-=dt; if(arena.msgT<=0) $('bMsg').textContent=''; }
    for(let i=arena.fences.length-1;i>=0;i--){ const f=arena.fences[i]; if(f.knockT>0){ f.knockT=Math.max(0,f.knockT-dt); f.mesh.userData.top.forEach(p=>{ p.position.y=Math.max(.1,p.position.y-dt*3); p.rotation.y+=dt*2; }); } if(f.z<arena.z-20){ arena.scene.remove(f.mesh); arena.fences.splice(i,1); } }
    updateBonusHud();
  } else if(arena.done){ arena.endT+=dt; if(arena.endT>1.4){ finishBonus(); return; } }
  h.position.set(arena.laneX,arena.y,arena.z); const sf=!arena.started?.35:(arena.boost>0?1.5:1); animateHorse(h,arena.t,arena.started?sf:.0001,arena.jumping?arena.jumpT/arena.jumpDur:null);
  if(!arena.started){ h.userData.legs.forEach(l=>{ l.rotation.x=0; l.userData.knee.rotation.x=0; }); }
  const cam=arena.cam; cam.position.lerp(new THREE.Vector3(arena.laneX*.4+2.2,3.4+arena.y*.4,arena.z-8.5),Math.min(1,dt*6)); cam.lookAt(arena.laneX,1.3+arena.y*.6,arena.z+9);
  arena.sun.position.set(-25,60,arena.z-20); arena.sun.target.position.set(0,0,arena.z+20); arena.sun.target.updateMatrixWorld();
  arena.particles.update(dt);
}
function knockFence(f){ f.knockT=1; arena.penalties++; arena.streak=0; arena.knockSlow=1; SFX.penalty(); renderPenalties(); arena.particles.emit(arena.laneX,1,f.z,0xffffff,20,4,.8); $('bMsg').textContent='Rail down! Penalty '+arena.penalties+'/3'; arena.msgT=1.2; if(arena.penalties>=3) endBonus('Three penalties'); }
function endBonus(reason){ if(arena.done) return; arena.done=true; arena.endReason=reason; $('bMsg').textContent=reason; stopCanter(); SFX.whistle(); if(arena.penalties>=3) SFX.crowdOoh(); else { SFX.crowdCheer(1.4); SFX.neigh(); } }
function startCanter(){ stopCanter(); arena.canter=play('canter',{vol:.75,loop:true,dry:true}); }
function stopCanter(){ if(arena.canter){ try{ arena.canter.stop(); }catch(e){} arena.canter=null; } }
function renderPenalties(){ const box=$('penalties'); box.innerHTML=''; for(let i=0;i<3;i++){ const d=document.createElement('div'); d.className='pen'+(i<arena.penalties?' hit':''); d.textContent='✕'; box.appendChild(d); } }
function updateBonusHud(){ $('bCleared').textContent=arena.cleared; $('bCoins').textContent=arena.coins; $('bStreak').textContent=arena.streak; }
function finishBonus(){ game.state='bonusend'; const earned=arena.coins; save.coins+=earned; save.bestBonus=Math.max(save.bestBonus||0,earned); save.boosters={boost:0,jump:0}; const next=world.index+1; const last=next>=LEVELS.length; if(!last) save.level=next; persist();
  $('beTitle').textContent=arena.endReason+(arena.penalties>=3?'. Rails everywhere.':arena.cleared>=10?'. Clean round!':'');
  $('beStats').innerHTML='<div><b>'+arena.cleared+'</b><span>fences cleared</span></div><div><b>'+arena.penalties+'/3</b><span>penalties</span></div><div><b>+'+earned+'</b><span>coins earned</span></div><div><b>'+save.coins+'</b><span>coins total</span></div>';
  $('beNext').textContent=last?'Claim victory':'Next level'; $('beNext').onclick=()=>{ if(last) winGame(); else startLevel(next); };
  $('bonusHud').hidden=true; $('boosterHud').hidden=true; showScreen('bonusEnd'); }
function renderBoosterHud(){ const box=$('boosterHud'); box.innerHTML=''; for(const id of ['boost','jump']){ const b=BOOSTERS[id]; const n=save.boosters[id]||0; const el=document.createElement('div'); const active=id==='boost'?arena.boost>0:arena.superJump>0; el.className='booster'+(n<=0&&!active?' empty':'')+(active&&game.state==='bonus'?' active':''); el.innerHTML='<div class="ic" style="background:'+css(b.color)+';box-shadow:0 0 12px '+css(b.color)+'"></div><div>'+b.name+'</div><div class="ct">x'+n+'</div><div class="k">'+(game.state==='bonus'?'key '+b.key:'arena only')+'</div>'; el.title=b.desc; el.onclick=()=>useBooster(id); box.appendChild(el); } }
