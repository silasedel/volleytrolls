// ===================== CORE: constants, helpers, save, audio =====================
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
const T=4, WALL_H=4, EYE=1.6;
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const rand=(a,b)=>a+Math.random()*(b-a);
const randInt=(a,b)=>Math.floor(rand(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const css=c=>'#'+c.toString(16).padStart(6,'0');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const SAVE_KEY='volley-trolls-save-v2';
function defaultSave(){ return {coins:0, owned:['helm_school','shirt_tee','pants_tan','boots_paddock'], equipped:{helmet:'helm_school',shirt:'shirt_tee',pants:'pants_tan',boots:'boots_paddock',gloves:null,vest:null}, saddles:[], saddle:null, craft:{}, crafted:{}, boosters:{boost:0,jump:0}, level:0, won:false, horse:{happy:0,washed:false,rinsed:false,braided:false,hooves:false,fed:0,treats:0}, kills:0, bestBonus:0, secrets:{}, musicOn:true }; }
let save=defaultSave();
try{ const s=JSON.parse(localStorage.getItem(SAVE_KEY)||localStorage.getItem('volley-trolls-save-v1')||'null'); if(s&&typeof s==='object'){ const d=defaultSave(); save=Object.assign(d,s); save.equipped=Object.assign(defaultSave().equipped,s.equipped||{}); save.horse=Object.assign(defaultSave().horse,s.horse||{}); save.boosters=Object.assign({boost:0,jump:0},s.boosters||{}); save.craft=s.craft||{}; save.crafted=s.crafted||{}; save.secrets=s.secrets||{}; if(save.musicOn===undefined) save.musicOn=true; } }catch(e){}
function persist(){ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(save)); }catch(e){} }

// ===================== AUDIO ENGINE: real recorded samples (see Credits) =====================
const AUDIO={ctx:null,master:null,sfx:null,music:null,amb:null,verb:null,verbGain:null,buf:{},ready:false,last:{}};
function audioCtx(){
  if(!AUDIO.ctx){ try{ const c=new (window.AudioContext||window.webkitAudioContext)(); AUDIO.ctx=c;
    AUDIO.master=c.createGain(); AUDIO.master.gain.value=.9; const comp=c.createDynamicsCompressor(); comp.threshold.value=-14; comp.knee.value=10; comp.ratio.value=4; comp.attack.value=.003; comp.release.value=.25; AUDIO.master.connect(comp); comp.connect(c.destination);
    AUDIO.sfx=c.createGain(); AUDIO.sfx.gain.value=1; AUDIO.sfx.connect(AUDIO.master);
    AUDIO.music=c.createGain(); AUDIO.music.gain.value=save.musicOn?.42:0; AUDIO.music.connect(AUDIO.master);
    AUDIO.amb=c.createGain(); AUDIO.amb.gain.value=.35; AUDIO.amb.connect(AUDIO.master);
    const len=Math.floor(c.sampleRate*2), ir=c.createBuffer(2,len,c.sampleRate); for(let ch=0;ch<2;ch++){ const d=ir.getChannelData(ch); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3); }
    AUDIO.verb=c.createConvolver(); AUDIO.verb.buffer=ir; AUDIO.verbGain=c.createGain(); AUDIO.verbGain.gain.value=.22; AUDIO.verb.connect(AUDIO.verbGain); AUDIO.verbGain.connect(AUDIO.master);
    decodeAll();
  }catch(e){ AUDIO.ctx=null; } }
  if(AUDIO.ctx&&AUDIO.ctx.state==='suspended') AUDIO.ctx.resume().catch(()=>{});
  return AUDIO.ctx; }
function b64buf(b64){ const bin=atob(b64), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); return u.buffer; }
function decodeAll(){ const c=AUDIO.ctx; const names=Object.keys(SND_SRC); let left=names.length;
  // music last so effects are ready first
  names.sort((a,b)=>(a.startsWith('mus')?1:0)-(b.startsWith('mus')?1:0));
  (async()=>{ for(const n of names){ try{ AUDIO.buf[n]=await new Promise((res,rej)=>{ const p=c.decodeAudioData(b64buf(SND_SRC[n]),res,rej); if(p&&p.catch) p.catch(rej); }); }catch(e){} if(--left===0) AUDIO.ready=true; if(n.startsWith('mus')||n.startsWith('amb')) Music.retry(); } })(); }
function setReverb(amount){ if(AUDIO.verbGain) AUDIO.verbGain.gain.setTargetAtTime(amount,AUDIO.ctx.currentTime,.3); }
// play one recorded sample: o.vol, o.pan, o.rate, o.when, o.loop, o.dest, o.dry (no reverb)
function play(name,o={}){ const c=AUDIO.ctx; if(!c) return null; const b=AUDIO.buf[name]; if(!b) return null; try{
  const src=c.createBufferSource(); src.buffer=b; src.playbackRate.value=(o.rate||1)*(o.vary?rand(1-o.vary,1+o.vary):1); src.loop=!!o.loop;
  const g=c.createGain(); g.gain.value=o.vol??1; src.connect(g);
  if(o.dest){ g.connect(o.dest); } else { let node=g; if(c.createStereoPanner&&o.pan){ const p=c.createStereoPanner(); p.pan.value=clamp(o.pan,-1,1); g.connect(p); node=p; } node.connect(AUDIO.sfx); if(!o.dry) node.connect(AUDIO.verb); }
  const t=c.currentTime+(o.when||0); src.start(t, o.offset||0); if(o.dur) src.stop(t+o.dur); src._g=g; return src; }catch(e){ return null; } }
const any=(...n)=>pick(n);
// where is a sound relative to the listener? -> {vol,pan}
function spatial(x,z,range=30){ if(typeof player==='undefined') return {vol:1,pan:0,d:0}; const dx=x-player.x, dz=z-player.z; const d=Math.hypot(dx,dz); const v=Math.pow(clamp(1-d/range,0,1),1.3); const rx=Math.cos(player.yaw), rz=-Math.sin(player.yaw); return {vol:v,pan:clamp((dx*rx+dz*rz)/Math.max(d,1.5),-1,1)*.85,d}; }
function at(name,x,z,o={}){ const s=spatial(x,z,o.range||30); if(s.vol<.02) return null; return play(name,Object.assign({},o,{vol:(o.vol??1)*s.vol,pan:s.pan})); }
function throttle(name,ms){ const n=performance.now(); if(AUDIO.last[name]&&n-AUDIO.last[name]<ms) return false; AUDIO.last[name]=n; return true; }
// troll families -> which real voice set they use
const VOX={ruby:{hit:['trollHit1','trollHit2','trollHit3','trollHit4'],die:['trollDie1','trollDie2','trollDie3'],rate:1},
  amber:{hit:['trollHit2','trollHit3'],die:['trollDie2'],rate:1.12},
  lemon:{hit:['goblinHit1','goblinHit2'],die:['goblinDie1'],rate:1.15},
  emerald:{hit:['ogreHit1','ogreHit2'],die:['ogreDie1','ogreDie2'],rate:.85},
  sapphire:{hit:['trollHit1','trollHit4'],die:['trollDie3'],rate:1.05},
  violet:{hit:['ogreHit1','ogreHit2'],die:['ogreDie2'],rate:.7}};
const vox=t=>VOX[t]||VOX.ruby;

const SFX={ unlock:()=>{ audioCtx(); Music.retry(); },
  // ---- volleyball ----
  shoot:()=>{ if(!audioCtx()) return; play('serve',{vol:1,vary:.06,dry:true}); play('whoosh',{vol:.45,vary:.1,rate:1.15}); },
  goldShoot:()=>{ if(!audioCtx()) return; play('serve',{vol:1,rate:.9}); play('missile',{vol:.55,vary:.05}); play('whoosh2',{vol:.5}); },
  bounce:(x,z)=>{ if(!audioCtx()||!throttle('bounce',70)) return; at('serve',x,z,{vol:.55,rate:rand(.75,.95),range:24}); },
  // ---- trolls ----
  trollHit:(type,x,z)=>{ if(!audioCtx()) return; const v=vox(type); at(any('flesh1','flesh2','flesh3'),x,z,{vol:.8,vary:.1}); at('serve',x,z,{vol:.7,rate:.85}); at(pick(v.hit),x,z,{vol:.95,rate:v.rate,vary:.06,when:.03}); },
  trollRoar:(type,x,z)=>{ if(!audioCtx()||!throttle('roar',450)) return; const v=vox(type); at(any('growl1','growl2','growl3'),x,z,{vol:.9,rate:v.rate*.72,vary:.05,range:36}); },
  trollGrunt:(type,x,z)=>{ if(!audioCtx()) return; const v=vox(type); at(any('ugg','groan'),x,z,{vol:.6,rate:v.rate*rand(.8,1),range:22}); },
  trollStep:(x,z,size)=>{ if(!audioCtx()) return; at(any('step1','step2','step3','step4'),x,z,{vol:.35*size,rate:.65/size,range:16}); },
  trollSwing:(x,z)=>{ if(!audioCtx()) return; at('whoosh2',x,z,{vol:.6,rate:.8}); },
  trollDie:(type,x,z)=>{ if(!audioCtx()) return; const v=vox(type); at(pick(v.die),x,z,{vol:1,rate:v.rate,vary:.04}); at(any('flesh1','flesh3'),x,z,{vol:.7,when:.1}); },
  mudThrow:(x,z)=>{ if(!audioCtx()) return; at(any('throw1','throw2'),x,z,{vol:.8}); },
  mudSplat:()=>{ if(!audioCtx()) return; play('mudSplat',{vol:1,vary:.08}); play('mudFist',{vol:.5,when:.04}); },
  // ---- nests ----
  nestSpawn:(x,z)=>{ if(!audioCtx()) return; at('squish',x,z,{vol:.9,rate:.7,range:36}); at('rumble',x,z,{vol:.5,dur:1.2,range:36}); at(any('growl1','growl2'),x,z,{vol:.6,rate:.9,when:.4,range:36}); },
  nestHit:(x,z)=>{ if(!audioCtx()) return; at(any('stone1','stone2'),x,z,{vol:1,vary:.1}); at('serve',x,z,{vol:.5,rate:.8}); },
  nestDie:(x,z)=>{ if(!audioCtx()) return; play('collapse',{vol:1}); play('explosion',{vol:.8}); play('holy',{vol:.5,when:.4}); },
  // ---- impacts ----
  hit:()=>{ if(!audioCtx()) return; play('club',{vol:.8,vary:.08}); },
  explode:()=>{ if(!audioCtx()) return; play('explosion',{vol:1,vary:.05}); play('debris',{vol:.55,when:.08}); },
  zap:()=>{ if(!audioCtx()) return; play('lightning',{vol:.75,rate:1.1}); },
  // ---- pickups ----
  coin:()=>{ if(!audioCtx()) return; const p=AUDIO.coinPitch=(performance.now()-(AUDIO.coinT||0)<700)?Math.min((AUDIO.coinPitch||0)+1,7):0; AUDIO.coinT=performance.now(); play('gold',{vol:.55,rate:Math.pow(2,p/12)*1.15,dur:.6}); },
  gold:()=>{ if(!audioCtx()) return; play('holy',{vol:.9}); play('gold',{vol:.6,rate:.8}); },
  key:()=>{ if(!audioCtx()) return; play('fanfare',{vol:.85}); play('holy',{vol:.5,when:.3}); },
  saddle:()=>{ if(!audioCtx()) return; play('chest',{vol:.8}); play('fanfare',{vol:.7,when:.3}); play(any('neigh1','neigh2','neigh3'),{vol:.8,when:.9}); },
  pickup:()=>{ if(!audioCtx()) return; play('potion',{vol:.7,vary:.08}); },
  heal:()=>{ if(!audioCtx()) return; play('heal',{vol:.8}); },
  combo:(n)=>{ if(!audioCtx()) return; play('clap',{vol:.6,rate:1+Math.min(n,8)*.04}); if(n>=4) play('cheer',{vol:.3+Math.min(n,10)*.04,dur:1.6}); },
  // ---- player ----
  step:(alt)=>{ if(!audioCtx()) return; play(alt?any('step1','step3'):any('step2','step4'),{vol:.4,vary:.07,dry:false}); },
  hurt:()=>{ if(!audioCtx()) return; play(any('femHit1','femHit2','femHit3'),{vol:.9,vary:.04}); play('club',{vol:.7}); },
  playerDie:()=>{ if(!audioCtx()) return; play('femDie',{vol:1}); play('defeat',{vol:.7,when:.6}); },
  heartbeat:()=>{ if(!audioCtx()) return; play('fist',{vol:.55,rate:.45,dry:true}); play('fist',{vol:.4,rate:.42,when:.22,dry:true}); },
  // ---- world ----
  door:()=>{ if(!audioCtx()) return; play('gateOpen',{vol:.35,rate:1.6,dur:1.2}); },
  secret:()=>{ if(!audioCtx()) return; play('cavein',{vol:.9}); play('rumble',{vol:.6}); play('holy',{vol:.5,when:1.2}); },
  gateLocked:()=>{ if(!audioCtx()||!throttle('gl',1200)) return; play('gateClose',{vol:.8,rate:1.2,dur:.9}); },
  gateOpen:()=>{ if(!audioCtx()) return; play('gateOpen',{vol:1}); play('fanfare',{vol:.6,when:1.4}); },
  drip:()=>{},
  stuck:()=>{ if(!audioCtx()) return; play('fist',{vol:.4,rate:1.3}); },
  // ---- arena / horse ----
  jump:()=>{ if(!audioCtx()) return; play('horseAtk',{vol:.55,vary:.05}); play('whoosh',{vol:.5,rate:.8}); },
  spring:()=>{ if(!audioCtx()) return; play('whoosh2',{vol:.7,rate:.7}); play('holy',{vol:.4,rate:1.4}); },
  land:()=>{ if(!audioCtx()) return; play(any('hoof1','hoof2'),{vol:.9,dur:.35}); },
  gallop:()=>{},
  neigh:()=>{ if(!audioCtx()) return; play(any('neigh1','neigh2','neigh3'),{vol:.85,vary:.04}); },
  snort:()=>{ if(!audioCtx()) return; play(any('snort1','snort2'),{vol:.8}); },
  crowdCheer:(k=1)=>{ if(!audioCtx()) return; play(k>1.1?'cheerBig':'cheer',{vol:.55*k,vary:.05,dry:true}); },
  crowdOoh:()=>{ if(!audioCtx()) return; play('cheer',{vol:.4,rate:.6,dur:1.5,dry:true}); },
  whistle:()=>{ if(!audioCtx()) return; play('whistle',{vol:.8}); },
  countdown:(n)=>{ if(!audioCtx()) return; if(n>0) play('click',{vol:1,rate:.8}); else { play('whistle',{vol:.9}); play('horn',{vol:.6}); } },
  clear:()=>{ if(!audioCtx()) return; play('clap',{vol:.7}); play('cheer',{vol:.35,dur:1.4,dry:true}); },
  penalty:()=>{ if(!audioCtx()) return; play('wood1',{vol:1}); play('wood2',{vol:.9,when:.12}); play('wood1',{vol:.7,rate:.8,when:.25}); play('cheer',{vol:.35,rate:.55,dur:1.4,dry:true}); },
  boost:()=>{ if(!audioCtx()) return; play('whoosh2',{vol:.9,rate:.6}); play(any('neigh1','neigh2'),{vol:.8,when:.15}); },
  whoosh:()=>{ if(!audioCtx()) return; play('whoosh',{vol:.5}); },
  tick:()=>{ if(!audioCtx()) return; play('click',{vol:.9}); },
  // ---- UI / meta ----
  click:()=>{ if(!audioCtx()) return; play('click',{vol:.6,dry:true}); },
  buy:()=>{ if(!audioCtx()) return; play('gold',{vol:.8}); play('chest',{vol:.4,when:.15}); },
  equip:()=>{ if(!audioCtx()) return; play('whoosh',{vol:.5,rate:1.4}); },
  craft:()=>{ if(!audioCtx()) return; play('potion',{vol:.8}); play('holy',{vol:.5,when:.15}); },
  fail:()=>{ if(!audioCtx()) return; play('gateClose',{vol:.5,rate:1.5,dur:.5}); },
  win:()=>{ if(!audioCtx()) return; play('victory',{vol:.9}); play('cheerBig',{vol:.6,when:.3,dry:true}); },
  sadTrombone:()=>{ SFX.playerDie(); },
  levelStart:()=>{ if(!audioCtx()) return; play('horn',{vol:.75}); },
  kill:()=>{}, gold2:()=>{},
};

// ===================== MUSIC + AMBIENCE: looping real recordings, crossfaded =====================
const Music={want:null,wantAmb:null,cur:null,curAmb:null,curName:null,curAmbName:null,
  play(name,amb){ this.want=name?'mus'+name[0].toUpperCase()+name.slice(1):null; this.wantAmb=amb||null; this.retry(); },
  retry(){ const c=AUDIO.ctx; if(!c) return;
    if(this.want!==this.curName&&(this.want===null||AUDIO.buf[this.want])){ if(this.cur) fadeStop(this.cur,1.2); this.cur=this.want?loopIn(this.want,AUDIO.music,1.5):null; this.curName=this.want; }
    if(this.wantAmb!==this.curAmbName&&(this.wantAmb===null||AUDIO.buf[this.wantAmb])){ if(this.curAmb) fadeStop(this.curAmb,1.2); this.curAmb=this.wantAmb?loopIn(this.wantAmb,AUDIO.amb,2):null; this.curAmbName=this.wantAmb; } },
  stop(){ this.play(null,null); },
  toggle(){ save.musicOn=!save.musicOn; persist(); if(AUDIO.music) AUDIO.music.gain.setTargetAtTime(save.musicOn?.42:0,AUDIO.ctx.currentTime,.15); return save.musicOn; },
  gold:false };
function loopIn(name,dest,fade){ const c=AUDIO.ctx; const s=c.createBufferSource(); s.buffer=AUDIO.buf[name]; s.loop=true; const g=c.createGain(); g.gain.setValueAtTime(.0001,c.currentTime); g.gain.exponentialRampToValueAtTime(1,c.currentTime+fade); s.connect(g).connect(dest); s.start(); s._g=g; return s; }
function fadeStop(s,t){ try{ const c=AUDIO.ctx; s._g.gain.cancelScheduledValues(c.currentTime); s._g.gain.setValueAtTime(s._g.gain.value,c.currentTime); s._g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+t); s.stop(c.currentTime+t+.05); }catch(e){} }

// ---- toast messages ----
function toast(msg,cls=''){ const el=document.createElement('div'); el.className='toastmsg '+cls; el.textContent=msg; const box=$('toast'); box.appendChild(el); while(box.children.length>4) box.removeChild(box.firstChild); setTimeout(()=>{ el.style.opacity='0'; el.style.transition='opacity .4s'; setTimeout(()=>el.remove(),400); },2300); }
// soft click on every button
document.addEventListener('click',e=>{ if(e.target.closest&&e.target.closest('button')) SFX.click(); },true);
