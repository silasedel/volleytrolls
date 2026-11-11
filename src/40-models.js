// ===================== MODELS: everything is built from primitives at runtime =====================
const Mat=(color,o={})=>new THREE.MeshStandardMaterial(Object.assign({color,roughness:.75,metalness:.05},o));
function mesh(geo,mat,x=0,y=0,z=0,parent){ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; if(parent) parent.add(m); return m; }
const G={ sph:(r,w=16,h=12)=>new THREE.SphereGeometry(r,w,h), box:(x,y,z)=>new THREE.BoxGeometry(x,y,z), cyl:(rt,rb,h,s=14)=>new THREE.CylinderGeometry(rt,rb,h,s), cone:(r,h,s=12)=>new THREE.ConeGeometry(r,h,s), tor:(r,t,s=8,tube=18,arc)=>new THREE.TorusGeometry(r,t,s,tube,arc), cap:(r,l,s=4,rs=10)=>new THREE.CapsuleGeometry(r,l,s,rs), cap2:(r,w=16,h=10,top=.55)=>new THREE.SphereGeometry(r,w,h,0,Math.PI*2,0,Math.PI*top) };
const TEX={};
function tex(name,maker){ if(!TEX[name]) TEX[name]=maker(); return TEX[name]; }

// ---------- the rider ----------
function buildAvatar(eq,pose='stand'){
  const g=new THREE.Group();
  const skin=Mat(0xf6c9ab,{roughness:.6}), hairM=Mat(0x5e3b20,{roughness:.75}), hairHi=Mat(0x9a6a3e,{roughness:.7});
  const helmet=item(eq.helmet), shirt=item(eq.shirt), pants=item(eq.pants), boots=item(eq.boots), gloves=eq.gloves?item(eq.gloves):null, vest=eq.vest?item(eq.vest):null;
  const pantsM=Mat(pants.color,{roughness:.8}), shirtM=Mat(shirt.color,{roughness:.7}), bootM=Mat(boots.color,{roughness:boots.shiny?.25:.55,metalness:boots.shiny?.25:0});
  const legs=[];
  for(const s of [-1,1]){ const hip=new THREE.Group(); hip.position.set(s*.11,.92,0); g.add(hip);
    mesh(G.cap(.078,.32,4,10),pantsM,0,-.22,0,hip);
    const knee=new THREE.Group(); knee.position.y=-.44; hip.add(knee);
    if(boots.tall){ mesh(G.cyl(.07,.075,.5),bootM,0,-.25,0,knee); if(boots.top) mesh(G.cyl(.078,.078,.07),Mat(boots.top,{roughness:.15,metalness:.3}),0,-.04,0,knee); }
    else { mesh(G.cyl(.065,.06,.3),pantsM,0,-.15,0,knee); mesh(G.cyl(.07,.075,.2),bootM,0,-.4,0,knee); }
    mesh(G.box(.13,.07,.25),bootM,0,-.5,.05,knee);
    hip.userData.knee=knee; legs.push(hip); }
  const torso=new THREE.Group(); torso.position.y=.95; g.add(torso);
  const coatM=shirt.coat?Mat(shirt.color,{roughness:.5}):shirtM;
  const chest=mesh(G.cap(.17,.26,6,16),coatM,0,.3,0,torso); chest.scale.set(1.05,1,.66); mesh(G.sph(.075,10,8),coatM,-.2,.46,0,torso); mesh(G.sph(.075,10,8),coatM,.2,.46,0,torso); const hipM=mesh(G.sph(.17,14,10),pantsM,0,.02,0,torso); hipM.scale.set(1.05,.6,.7);
  
  const belt=mesh(G.tor(.17,.02,6,24),Mat(0x3b2a1a),0,.03,0,torso); belt.rotation.x=Math.PI/2;
  if(shirt.coat){ mesh(G.tor(.1,.025,6,16),Mat(shirt.collar),0,.53,.0,torso).rotation.x=Math.PI/2; mesh(G.box(.02,.4,.02),Mat(shirt.collar),0,.3,.12,torso); const tail=mesh(G.cap(.16,.18,4,12),coatM,0,.02,-.03,torso); tail.scale.set(1.1,1,.6); for(let i=0;i<3;i++) mesh(G.sph(.015,6,4),Mat(0xffd54a,{metalness:.8,roughness:.3}),.03,.4-i*.1,.11,torso); }
  else if(shirt.collar) mesh(G.cyl(.09,.12,.06),Mat(shirt.collar),0,.53,0,torso);
  if(vest){ const vm=Mat(vest.color,{roughness:.45}); const vb=mesh(G.cap(.2,.2,6,16),vm,0,.32,0,torso); vb.scale.set(1.05,1,.72); for(let i=0;i<3;i++){ const rib=mesh(G.tor(.205,.018,6,20),vm,0,.2+i*.1,0,torso); rib.rotation.x=Math.PI/2; rib.scale.set(1.05,.72,1); } mesh(G.tor(.11,.04,8,16),vm,0,.53,0,torso).rotation.x=Math.PI/2; mesh(G.cyl(.03,.03,.28),Mat(0xb0b0b8,{metalness:.9,roughness:.25}),-.17,.3,.12,torso);  }
  const arms=[]; const gloveM=gloves?Mat(gloves.color,{roughness:gloves.shiny?.3:.6,metalness:gloves.shiny?.4:0}):skin;
  for(const s of [-1,1]){ const sh=new THREE.Group(); sh.position.set(s*.22,.46,0); sh.rotation.z=s*.12; torso.add(sh);
    mesh(G.cyl(.055,.05,.3),shirt.sleeve==='short'||!shirt.sleeve?shirtM:coatM,0,-.15,0,sh);
    const el=new THREE.Group(); el.position.y=-.3; sh.add(el);
    mesh(G.cyl(.048,.042,.28),shirt.sleeve==='long'?coatM:skin,0,-.14,0,el);
    mesh(G.sph(.058,10,8),gloveM,0,-.3,0,el);
    sh.userData.elbow=el; arms.push(sh); }
  const head=new THREE.Group(); head.position.y=.72; torso.add(head);
  mesh(G.cyl(.05,.06,.16),skin,0,-.14,-.01,head);
  head.scale.set(1,1.1,1);
  mesh(G.sph(.135,26,18),skin,0,0,0,head);
  const face=new THREE.Mesh(faceMaskGeo(),faceMat); face.renderOrder=2; head.add(face);
  for(const s of [-1,1]){ const ear=mesh(G.sph(.022,8,6),skin,s*.128,-.005,-.005,head); ear.scale.set(.5,1,.8); }
  const hcap=mesh(G.cap2(.1435,24,14,.47),hairM,0,.035,-.006,head);
  // long, straight, center-parted hair falling past the shoulders
  const back=mesh(G.cap(.125,.3,6,14),hairM,0,-.2,-.07,head); back.scale.set(1.18,1,.5);
  for(const s of [-1,1]){ for(let k=0;k<3;k++){ const st=mesh(G.cap(.03,.3,4,8),k===1?hairHi:hairM,s*(.118+k*.018),-.17-k*.015,.035-k*.04,head); st.rotation.z=s*.06; }
    const fr=mesh(G.cap(.025,.2,4,8),hairHi,s*.112,-.06,.07,head); fr.rotation.z=s*.12; }
  const hm=Mat(helmet.color,{roughness:helmet.color===0xf4f4f4||helmet.color===0xe49aad?.85:.3,metalness:.1});
  const shell=mesh(G.cap2(.156,24,12,.43),hm,0,.05,-.008,head);
  const brim=mesh(G.cyl(helmet.wide?.17:.13,helmet.wide?.17:.13,.012,24,1,false,-Math.PI*.5,Math.PI),hm,0,.088,.06,head); brim.rotation.y=Math.PI; brim.scale.set(1,1,helmet.wide?.85:.65);
  if(helmet.stripe) mesh(G.box(.05,.012,.24),Mat(helmet.stripe,{metalness:.6,roughness:.3}),0,.17,-.02,head);
  const strap=Mat(helmet.strap); for(const s of [-1,1]){ const st=mesh(G.cyl(.006,.006,.12),strap,s*.13,-.03,-.035,head); st.rotation.x=.25; }
  g.userData={legs,arms,torso,head,pose};
  setPose(g,pose);
  return g;
}
function setPose(av,pose){ const u=av.userData; u.pose=pose; if(pose==='riding'){ u.legs.forEach(l=>{ l.rotation.x=-1.25; l.userData.knee.rotation.x=1.45; }); u.torso.rotation.x=.3; u.arms.forEach(a=>{ a.rotation.x=-1.1; a.userData.elbow.rotation.x=-.3; }); } else { u.legs.forEach(l=>{ l.rotation.x=0; l.userData.knee.rotation.x=0; }); u.torso.rotation.x=0; u.arms.forEach(a=>{ a.rotation.x=0; a.userData.elbow.rotation.x=0; }); } }
function animateAvatar(av,t,moving){ const u=av.userData; if(u.pose==='riding') return; const k=moving?1:0; u.legs.forEach((l,i)=>{ const s=i?1:-1; l.rotation.x=Math.sin(t*9)*.55*k*s; l.userData.knee.rotation.x=Math.max(0,-Math.sin(t*9)*s)*.7*k; }); u.arms.forEach((a,i)=>{ const s=i?-1:1; a.rotation.x=Math.sin(t*9)*.45*k*s+(moving?0:Math.sin(t*2)*.03); }); u.torso.position.y=.95+Math.abs(Math.sin(t*9))*.025*k; }

// first-person hands holding the ball
function buildHands(eq){
  const g=new THREE.Group(); const gloves=eq.gloves?item(eq.gloves):null; const shirt=item(eq.shirt);
  const skin=Mat(0xf1c9a5,{roughness:.6}); const gm=gloves?Mat(gloves.color,{roughness:gloves.shiny?.3:.6,metalness:gloves.shiny?.4:0}):skin;
  const sleeve=shirt.sleeve==='long'?Mat(shirt.color):skin;
  for(const s of [-1,1]){ const arm=mesh(G.cyl(.03,.038,.42),sleeve,s*.13,-.17,.12,g); arm.rotation.x=1.15; arm.rotation.z=-s*.45; mesh(G.sph(.042,12,10),gm,s*.075,-.01,-.07,g); for(let f=0;f<3;f++) mesh(G.cap(.011,.03,3,6),gm,s*(.06-f*.004),.02+f*.012,-.1-f*.01,g).rotation.z=s*.9; if(gloves) mesh(G.cyl(.036,.038,.05),gm,s*.1,-.05,-.02,g).rotation.set(1.15,0,-s*.45); }
  g.traverse(o=>{ if(o.isMesh){ o.castShadow=false; o.receiveShadow=false; } });
  return g;
}
function buildVolleyball(gold,r=.2){ const vm=tex(gold?'vbg':'vb',()=>volleyballMaps(gold)); const m=new THREE.Mesh(G.sph(r,40,28),new THREE.MeshStandardMaterial({map:vm.map,bumpMap:vm.bump,bumpScale:gold?1.2:1.6,roughness:gold?.3:.5,metalness:gold?.5:0,emissive:gold?0xffb000:0x000000,emissiveIntensity:gold?.25:0})); m.castShadow=true; m.rotation.set(.4,.6,0); return m; }

// ---------- trolls ----------
const RAINBOW=[0xff1e26,0xff8a00,0xffe81a,0x2fe05a,0x1e9bff,0x4a3cff,0xb040ff];
function rainbowStripeTex(){ return canvasTex(64,448,(g,w,h)=>{ const b=h/7; RAINBOW.forEach((c,i)=>{ g.fillStyle=css(c); g.fillRect(0,i*b,w,b); g.fillStyle='rgba(255,255,255,.55)'; g.fillRect(0,i*b,w,3); g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(0,i*b+b-4,w,4); }); for(let i=0;i<500;i++){ g.fillStyle='rgba(255,255,255,.12)'; g.fillRect(Math.random()*w,Math.random()*h,1,2);} }); }
function rainbowZigTex(){ return canvasTex(256,256,(g,w,h)=>{ const b=w/7; for(let k=-2;k<16;k++){ g.fillStyle=css(RAINBOW[((k%7)+7)%7]); g.beginPath(); g.moveTo(k*b-h,0); g.lineTo(k*b+b-h,0); g.lineTo(k*b+b,h); g.lineTo(k*b,h); g.fill(); } }); }
// many strands, one InstancedMesh, each strand its own rainbow color
function hairInst(geo,list,parent){ const im=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.55,metalness:.05}),list.length); const o=new THREE.Object3D(); const col=new THREE.Color();
  list.forEach((h,i)=>{ o.position.set(...h.p); o.rotation.set(...(h.r||[0,0,0])); o.scale.set(...(h.s||[1,1,1])); o.updateMatrix(); im.setMatrixAt(i,o.matrix); col.setHex(h.c).offsetHSL(0,0,(Math.random()-.5)*.08); im.setColorAt(i,col); });
  im.castShadow=true; parent.add(im); return im; }
function rainbowHair(style,parent){ const L=[]; const R=i=>RAINBOW[((i%7)+7)%7];
  if(style==='mohawk'){ for(let i=0;i<21;i++){ const t=i/20; const h=.35+Math.sin(t*Math.PI)*.4; for(let k=-1;k<=1;k++) L.push({p:[k*.045,.3+h/2,.34-t*.72],r:[-.25+t*.5,0,k*.12],s:[1,h/.5,1],c:R(Math.floor(t*6.99))}); } hairInst(G.cone(.05,.5,6),L,parent); }
  else if(style==='afro'){ for(let i=0;i<190;i++){ const u=Math.random(), v=Math.random()*.62; const a=u*Math.PI*2, b=Math.acos(1-v*2*.75); const r=.5+Math.random()*.04; const y=Math.cos(b)*r; L.push({p:[Math.sin(b)*Math.cos(a)*r,.2+y,Math.sin(b)*Math.sin(a)*r-.04],c:R(Math.floor((1-(y+.2)/.75)*7)),s:[1,1,1]}); } hairInst(G.sph(.1,8,6),L,parent); }
  else if(style==='spikes'){ let n=0; for(let ring=0;ring<3;ring++){ const cnt=[7,10,14][ring]; for(let i=0;i<cnt;i++){ const a=i/cnt*Math.PI*2+ring*.3; const tilt=.15+ring*.42; L.push({p:[Math.sin(a)*(.08+ring*.13),.36-ring*.06,Math.cos(a)*(.08+ring*.13)-.04],r:[Math.cos(a)*tilt,0,-Math.sin(a)*tilt],s:[1,1.1-ring*.15,1],c:R(n++)}); } } hairInst(G.cone(.07,.55,7),L,parent); }
  else if(style==='dreads'){ let n=0; for(let i=0;i<24;i++){ const a=i/24*Math.PI*2; if(Math.cos(a)>.72) continue; const c=R(n++); for(let k=0;k<5;k++){ const dr=.36+k*.025; L.push({p:[Math.sin(a)*dr,.12-k*.16,Math.cos(a)*dr-.02],r:[Math.cos(a)*.25,0,-Math.sin(a)*.25],c}); } }
    for(let i=0;i<36;i++){ const a=Math.random()*Math.PI*2, b=Math.random()*1.2; L.push({p:[Math.sin(b)*Math.cos(a)*.38,.04+Math.cos(b)*.38,Math.sin(b)*Math.sin(a)*.38],c:R(i)}); } hairInst(G.sph(.065,8,6),L,parent); }
  else if(style==='topknot'){ for(let i=0;i<60;i++){ const a=i/60*Math.PI*2; for(let k=0;k<3;k++){ const b=.35+k*.35; L.push({p:[Math.sin(b)*Math.cos(a)*.39,.04+Math.cos(b)*.39,Math.sin(b)*Math.sin(a)*.39],r:[0,-a,b],s:[1,1,1],c:R(Math.floor(i/60*7))}); } } hairInst(G.cap(.04,.14,3,6),L,parent);
    const bun=[]; for(let k=0;k<7;k++) bun.push({p:[0,.42+k*.055,-.05],r:[Math.PI/2,0,0],s:[1-k*.09,1-k*.09,1],c:R(k)}); hairInst(G.tor(.13,.045,8,18),bun,parent); }
  else if(style==='crown'){ let n=0; for(let i=0;i<28;i++){ const a=Math.PI*.35+i/27*Math.PI*1.3; for(let k=0;k<6;k++) L.push({p:[Math.sin(a)*(.37+k*.03),.1-k*.17,Math.cos(a)*(.37+k*.03)],r:[Math.cos(a)*.2,0,-Math.sin(a)*.2],c:R(Math.floor(i/4))}); } for(let i=0;i<40;i++){ const a=Math.random()*Math.PI*2,b=Math.random()*1.3; L.push({p:[Math.sin(b)*Math.cos(a)*.39,.03+Math.cos(b)*.39,Math.sin(b)*Math.sin(a)*.39],c:R(i)}); } hairInst(G.sph(.07,8,6),L,parent); }
}

function buildTroll(tp){
  const g=new THREE.Group(); const s=tp.size;
  const skin=Mat(tp.skin,{roughness:.85}), acc=Mat(tp.color,{roughness:.55}), accHair=Mat(tp.color,{roughness:.9}), white=Mat(0xf4f4f4), black=Mat(0x111111);
  const legs=[], arms=[];
  for(const sd of [-1,1]){ const hip=new THREE.Group(); hip.name='leg'+(sd>0?1:0); hip.position.set(sd*.22,.78,0); g.add(hip);
    mesh(G.cyl(.15,.13,.62),skin,0,-.31,0,hip);
    mesh(G.box(.3,.16,.46),tp.shoes?acc:skin,0,-.7,.08,hip);
    if(tp.shoes){ mesh(G.box(.32,.05,.48),white,0,-.78,.08,hip); mesh(G.box(.2,.03,.2),white,0,-.63,.12,hip); }
    else for(let i=0;i<3;i++) mesh(G.sph(.04,6,4),skin,-.1+i*.1,-.7,.32,hip);
    legs.push(hip); }
  const body=new THREE.Group(); body.name='body'; body.position.y=.78; g.add(body);
  const belly=mesh(G.sph(.52,22,16),skin,0,.42,0,body); belly.scale.set(1,1.05,.88);
  mesh(G.sph(.05,6,5),Mat(0x5a3a2a),0,.3,.46,body);
  { const rb=new THREE.MeshStandardMaterial({map:tex(tp.shorts?'rbstripe':'rbzig',tp.shorts?rainbowStripeTex:rainbowZigTex),roughness:.6}); mesh(G.cyl(.5,.43,.44,24),rb,0,.1,0,body); for(const sd of [-1,1]) mesh(G.cyl(.2,.18,.2,16),rb,sd*.22,-.12,0,body); mesh(G.tor(.475,.04,8,28),acc,0,.31,0,body).rotation.x=Math.PI/2; }
  if(tp.vest){ for(const sd of [-1,1]) mesh(G.box(.22,.75,.6),acc,sd*.36,.45,0,body); mesh(G.box(.74,.22,.6),acc,0,.84,0,body); }
  if(tp.cape){ const cp=mesh(G.box(.95,1.15,.06),new THREE.MeshStandardMaterial({map:tex('rbstripe',rainbowStripeTex),roughness:.5}),0,.25,-.5,body); cp.rotation.x=.12; mesh(G.box(.5,.14,.14),Mat(0xffd54a,{metalness:.7,roughness:.3}),0,.85,-.42,body); }
  if(tp.pack){ const pm=Mat(0x5a3a1e); mesh(G.box(.5,.6,.3),pm,0,.5,-.55,body); mesh(G.box(.44,.18,.32),acc,0,.78,-.55,body); for(const sd of [-1,1]) mesh(G.box(.06,.6,.06),pm,sd*.2,.55,-.4,body); }
  for(let i=0;i<5;i++) mesh(G.sph(.045,6,5),Mat(0x6f9a3a),rand(-.4,.4),rand(.15,.75),rand(.3,.45),body);
  for(const sd of [-1,1]){ const sh=new THREE.Group(); sh.name='arm'+(sd>0?1:0); sh.position.set(sd*.56,.82,0); body.add(sh);
    mesh(G.cyl(.12,.1,.56),skin,0,-.28,0,sh); mesh(G.sph(.16,12,10),skin,0,-.6,0,sh);
    for(let i=0;i<3;i++) mesh(G.cyl(.04,.035,.12,6),skin,-.08+i*.08,-.72,.08,sh);
    if(sd===1){ const club=new THREE.Group(); club.position.set(0,-.6,0); sh.add(club); const cm=Mat(0x6b4a2b,{roughness:.9}); const c1=mesh(G.cyl(.06,.1,.95),cm,0,0,.38,club); c1.rotation.x=Math.PI/2; mesh(G.sph(.18,12,10),cm,0,0,.88,club); for(let i=0;i<6;i++){ const sp=mesh(G.cone(.03,.14,6),Mat(0xaaaaaa,{metalness:.8,roughness:.3}),0,0,.88,club); sp.rotation.set(rand(0,6.3),rand(0,6.3),rand(0,6.3)); sp.translateY(.17);} sh.userData.club=club; }
    arms.push(sh); }
  const head=new THREE.Group(); head.name='head'; head.position.y=1.2; body.add(head);
  mesh(G.sph(.38,24,18),skin,0,0,0,head);
  mesh(G.box(.5,.2,.3),skin,0,-.28,.12,head);
  const nose=mesh(G.sph(.13,12,10),skin,0,-.05,.37,head); nose.scale.set(1,.85,1.5);
  for(const sd of [-1,1]){ const ear=mesh(G.cone(.12,.34,8),skin,sd*.4,.06,0,head); ear.rotation.z=-sd*Math.PI/2; ear.rotation.y=sd*.3;
    mesh(G.sph(.1,12,10),white,sd*.16,.1,.3,head); mesh(G.sph(.056,10,8),Mat(0xffd54a,{emissive:0xffb000,emissiveIntensity:.5}),sd*.16,.1,.38,head); mesh(G.sph(.03,8,6),black,sd*.16,.1,.425,head);
    const brow=mesh(G.box(.17,.045,.05),accHair,sd*.16,.22,.34,head); brow.rotation.z=sd*.4;
    const tusk=mesh(G.cone(.045,.16,6),white,sd*.14,-.22,.36,head); tusk.rotation.x=-.2; }
  mesh(G.box(.3,.06,.06),Mat(0x6b1a2a),0,-.19,.36,head);
  const hair=new THREE.Group(); hair.name='hair'; head.add(hair);
  rainbowHair(tp.hair,hair);
  if(tp.hair==='crown'){ const gold=Mat(0xffd54a,{metalness:.85,roughness:.25}); mesh(G.cyl(.3,.27,.2,8,1,true),new THREE.MeshStandardMaterial({color:0xffd54a,metalness:.85,roughness:.25,side:THREE.DoubleSide}),0,.4,0,hair); for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; mesh(G.cone(.05,.16,4),gold,Math.sin(a)*.29,.56,Math.cos(a)*.29,hair); mesh(G.sph(.035,8,6),Mat(RAINBOW[i%7],{emissive:RAINBOW[i%7],emissiveIntensity:.6}),Math.sin(a)*.3,.42,Math.cos(a)*.3,hair); } }
  if(tp.shoes){ for(const l of legs){ for(let k=0;k<7;k++) mesh(G.box(.24,.025,.03),Mat(RAINBOW[k]),0,-.62,.14+k*.035-.06,l); } }
  g.scale.setScalar(s);
  g.traverse(o=>{ if(o.isMesh&&!o.isInstancedMesh){ o.geometry.computeBoundingSphere(); o.castShadow=o.geometry.boundingSphere.radius>.17; o.receiveShadow=false; } if(o.isInstancedMesh) o.castShadow=false; });
  compactDeep(g);
  g.userData={legs,arms,head,body,hair,type:tp};
  return g;
}
function animateTroll(tr,dt){ const u=tr.mesh.userData; tr.anim+=dt*(tr.state==='chase'?tr.type.speed*2.2:1.5); const t=tr.anim, mv=tr.moving?1:0;
  u.legs.forEach((l,i)=>{ l.rotation.x=Math.sin(t+i*Math.PI)*.7*mv; });
  u.arms.forEach((a,i)=>{ a.rotation.x=Math.sin(t+i*Math.PI+Math.PI)*.5*mv-.2; a.rotation.z=(i?1:-1)*.25; });
  if(tr.lunge>0){ u.arms[1].rotation.x=-2.4+tr.lunge*2; }
  u.body.position.y=.78+Math.abs(Math.sin(t))*.06*mv; u.head.rotation.z=Math.sin(t*.5)*.06; u.hair.rotation.x=Math.sin(t*1.3)*.08;
}

// ---------- horse ----------
function buildSaddle(def){
  const g=new THREE.Group(); const lm=Mat(def.color,{roughness:.4,metalness:.05}); const am=Mat(def.accent,{roughness:.4});
  mesh(G.box(.55,.03,.78),Mat(def.id==='sad_loaner'?0xbbbbbb:0xffffff,{roughness:.9}),0,0,0,g);
  const seat=mesh(G.box(.4,.09,.56),lm,0,.07,0,g);
  mesh(G.box(.42,.16,.1),lm,0,.14,-.26,g); mesh(G.box(.3,.1,.08),lm,0,.12,.26,g);
  for(const sd of [-1,1]){ mesh(G.box(.035,.42,.48),lm,sd*.3,-.15,.06,g); mesh(G.box(.03,.16,.12),am,sd*.32,-.05,.2,g); mesh(G.box(.02,.3,.04),Mat(0x2a1a0e),sd*.33,-.3,0,g); mesh(G.tor(.07,.012,6,14),Mat(0xc0c0c8,{metalness:.9,roughness:.2}),sd*.34,-.5,0,g); }
  if(def.accent===0xf07f1a||def.accent===0xc9a24a){ mesh(G.box(.42,.004,.58),am,0,.12,0,g); }
  mesh(new THREE.CylinderGeometry(.47,.47,.07,20,1,true),new THREE.MeshStandardMaterial({color:0x2a1a0e,side:THREE.DoubleSide}),0,-.42,.05,g).rotation.z=Math.PI/2;
  g.traverse(o=>{ if(o.isMesh){ o.castShadow=true; } });
  return g;
}
function buildHorse(saddleDef,eq,horseState={}){
  const g=new THREE.Group(); const shiny=!!horseState.washed;
  const coat=Mat(0x6b3f1f,{roughness:shiny?.28:.85,metalness:shiny?.15:0}); const dark=Mat(0x1a1410,{roughness:.9}); const hoofM=Mat(horseState.hooves?0x050505:0x2a2420,{roughness:horseState.hooves?.15:.8,metalness:horseState.hooves?.5:0});
  const body=new THREE.Group(); body.position.y=1.3; g.add(body);
  const bar=mesh(G.cap(.42,1.25,6,14),coat,0,0,0,body); bar.rotation.x=Math.PI/2;
  mesh(G.sph(.4,16,12),coat,0,.03,.72,body); mesh(G.sph(.44,16,12),coat,0,.06,-.7,body);
  mesh(G.box(.5,.3,.3),Mat(0xd9c7b0),0,.05,.9,body);
  const neck=new THREE.Group(); neck.position.set(0,.3,.78); neck.rotation.x=-.65; body.add(neck);
  mesh(G.cap(.19,.62,4,12),coat,0,.4,0,neck);
  const mane=new THREE.Group(); neck.add(mane);
  const maneM=horseState.braided?Mat(0x1a1410,{roughness:.6}):dark;
  for(let i=0;i<7;i++){ if(horseState.braided){ mesh(G.sph(.06,8,6),maneM,0,.12+i*.11,-.2,mane); mesh(G.tor(.035,.012,5,10),Mat(0xff5fa2),0,.12+i*.11,-.25,mane).rotation.x=Math.PI/2; } else { const m=mesh(G.box(.09,.14,.12),maneM,0,.12+i*.11,-.2-Math.sin(i)*.01,mane); m.rotation.x=.3; } }
  const head=new THREE.Group(); head.position.set(0,.85,.05); head.rotation.x=1.15; neck.add(head);
  mesh(G.box(.3,.34,.56),coat,0,0,.2,head); mesh(G.box(.24,.26,.3),coat,0,-.04,.56,head);
  mesh(G.box(.08,.02,.5),Mat(0xf5f5f5),0,.18,.3,head);
  for(const sd of [-1,1]){ mesh(G.cone(.06,.2,6),coat,sd*.1,.22,.02,head).rotation.x=-.3; mesh(G.sph(.045,8,6),Mat(0x0a0a0a,{roughness:.2}),sd*.16,.06,.25,head); mesh(G.sph(.03,6,5),Mat(0x1a1010),sd*.07,-.1,.71,head); }
  mesh(G.tor(.15,.012,6,16),Mat(0x3a2a1a),0,-.04,.5,head).rotation.x=Math.PI/2;
  const tail=mesh(G.cap(.09,.75,4,8),dark,0,.1,-1.15,body); tail.rotation.x=-.6;
  if(horseState.braided) mesh(G.tor(.1,.02,6,12),Mat(0xff5fa2),0,.25,-1.05,body).rotation.x=.9;
  const legs=[];
  const legPos=[[-.26,.62],[.26,.62],[-.26,-.6],[.26,-.6]];
  legPos.forEach(([x,z],i)=>{ const hip=new THREE.Group(); hip.position.set(x,-.15,z); body.add(hip); mesh(G.cyl(.12,.09,.6),coat,0,-.3,0,hip); const knee=new THREE.Group(); knee.position.y=-.6; hip.add(knee); mesh(G.cyl(.08,.07,.5),i<2?coat:dark,0,-.25,0,knee); mesh(G.cyl(.09,.1,.1),hoofM,0,-.55,0,knee); hip.userData.knee=knee; hip.userData.front=i<2; legs.push(hip); });
  const sad=buildSaddle(saddleDef); sad.position.set(0,.44,-.02); body.add(sad);
  let rider=null; if(eq){ rider=buildAvatar(eq,'riding'); rider.position.set(0,-.4,-.02); body.add(rider); }
  if(horseState.hearts){ }
  g.userData={body,neck,head,legs,tail,mane,rider,sad};
  return g;
}
function animateHorse(h,t,speedF,airT){ const u=h.userData; const w=t*11*speedF;
  if(airT!==null){ u.legs.forEach(l=>{ if(l.userData.front){ l.rotation.x=-1.3; l.userData.knee.rotation.x=1.9; } else { l.rotation.x=.9-airT*.6; l.userData.knee.rotation.x=.3; } }); u.neck.rotation.x=-.9; u.body.rotation.x=-.35+airT*.5; }
  else { u.legs.forEach((l,i)=>{ const ph=l.userData.front?0:Math.PI*.9; const s=Math.sin(w+ph+(i%2)*.3); l.rotation.x=s*.75; l.userData.knee.rotation.x=Math.max(0,-s)*1.2; }); u.body.position.y=1.3+Math.abs(Math.sin(w))*.08*speedF; u.body.rotation.x=Math.sin(w)*.05; u.neck.rotation.x=-.65+Math.sin(w)*.08; }
  u.tail.rotation.x=-.6+Math.sin(t*6)*.15; u.tail.rotation.z=Math.sin(t*4)*.12;
  if(u.rider){ const lean=airT!==null?.55:.3; u.rider.userData.torso.rotation.x=lean; }
}

// ---------- fences ----------
const FENCE_COLORS=[[0xff5fa2,0xffffff],[0x4cc3ff,0xffffff],[0xffd54a,0x1e2d5c],[0x6ee7a8,0xffffff],[0xb45cff,0xffd54a],[0xff6b35,0xffffff]];
function buildFence(type){
  const g=new THREE.Group(); const white=Mat(0xf4f4f4,{roughness:.6}); const [c1,c2]=pick(FENCE_COLORS);
  const poleMat=new THREE.MeshStandardMaterial({map:stripeTexture(c1,c2),roughness:.5});
  const sets=type==='oxer'?[-.5,.5]:[0]; const top=[];
  sets.forEach(z=>{ for(const sd of [-1,1]){ mesh(G.box(.14,1.7,.14),white,sd*1.5,.85,z,g); mesh(G.box(.5,.08,.5),white,sd*1.5,.04,z,g); for(let i=0;i<3;i++) mesh(G.box(.06,.05,.08),Mat(0x333333),sd*1.42,.5+i*.4,z,g); }
    for(let i=0;i<3;i++){ const p=mesh(G.cyl(.065,.065,2.85,10),poleMat,0,.52+i*.4,z,g); p.rotation.z=Math.PI/2; if(i===2){ top.push(p); p.userData.keep=true; } } });
  const fl=Mat(0x2f7a3a); mesh(G.box(3.2,.3,.4),fl,0,.15,type==='oxer'?-.95:-.45,g); for(let i=0;i<7;i++) mesh(G.sph(.1,8,6),Mat(pick([0xff5fa2,0xffd54a,0xffffff,0xff6b35])),-1.4+i*.47,.36,type==='oxer'?-.95:-.45,g);
  compactDeep(g); g.userData={top,type}; return g;
}

// ---------- pickups ----------
function buildCoin(){ const m=new THREE.Mesh(G.cyl(.3,.3,.07,24),[Mat(0xe0a81c,{metalness:.8,roughness:.3}),new THREE.MeshStandardMaterial({map:tex('coin',coinTexture),metalness:.7,roughness:.3}),new THREE.MeshStandardMaterial({map:tex('coin',coinTexture),metalness:.7,roughness:.3})]); m.rotation.x=Math.PI/2; m.castShadow=true; const g=new THREE.Group(); g.add(m); return g; }
function buildHeart(){ const g=new THREE.Group(); const m=Mat(0xff4d7a,{emissive:0xff1a5a,emissiveIntensity:.4,roughness:.3}); mesh(G.sph(.14,12,10),m,-.1,.08,0,g); mesh(G.sph(.14,12,10),m,.1,.08,0,g); const b=mesh(G.box(.24,.24,.22),m,0,-.04,0,g); b.rotation.z=Math.PI/4; return g; }
function buildBoosterPickup(id){ const g=new THREE.Group(); const b=BOOSTERS[id]; const m=Mat(b.color,{emissive:b.color,emissiveIntensity:.6,roughness:.3});
  if(id==='boost'){ const c=mesh(G.cap(.14,.3,4,10),m,0,0,0,g); c.rotation.z=Math.PI/2; for(let i=0;i<3;i++){ const f=mesh(G.cone(.07,.25,4),m,-.3-i*.08,(i-1)*.14,0,g); f.rotation.z=Math.PI/2; } }
  else { for(let i=0;i<4;i++) mesh(G.tor(.16,.035,6,16),m,0,-.2+i*.13,0,g).rotation.x=Math.PI/2; mesh(G.box(.4,.05,.4),Mat(0x333333),0,-.3,0,g); }
  g.add(glowSprite(b.color,1.6)); return g; }
function buildCraftPickup(def){ const g=new THREE.Group(); const m=Mat(def.color,{roughness:.5}); const S=def.shape;
  if(S==='bottle'){ mesh(G.cyl(.09,.1,.34),m,0,0,0,g); mesh(G.cyl(.04,.04,.1),Mat(0xffffff),0,.22,0,g); mesh(G.box(.14,.12,.01),Mat(0xffffff),0,0,.1,g); }
  else if(S==='brush'){ mesh(G.box(.3,.07,.16),m,0,0,0,g); for(let i=0;i<5;i++) for(let j=0;j<3;j++) mesh(G.cyl(.012,.012,.1,5),Mat(0xf0e0c0),-.12+i*.06,-.08,-.05+j*.05,g); mesh(G.box(.24,.02,.04),Mat(0x3a2a1a),0,.05,0,g); }
  else if(S==='sponge'){ const b=mesh(G.box(.3,.16,.2),m,0,0,0,g); for(let i=0;i<8;i++) mesh(G.sph(.02,5,4),Mat(0xd9b800),rand(-.13,.13),rand(-.06,.06),.1,g); }
  else if(S==='bucket'){ mesh(new THREE.CylinderGeometry(.16,.12,.3,14,1,true),new THREE.MeshStandardMaterial({color:def.color,side:THREE.DoubleSide}),0,0,0,g); mesh(G.cyl(.12,.12,.02),Mat(0x1e4fa0),0,-.14,0,g); mesh(G.tor(.16,.015,6,16,Math.PI),Mat(0x888888,{metalness:.8}),0,.0,0,g); mesh(G.cyl(.11,.11,.02),Mat(0x4fb0ff,{roughness:.1}),0,.08,0,g); }
  else if(S==='carrot'){ const c=mesh(G.cone(.08,.4,10),m,0,0,0,g); c.rotation.x=Math.PI; for(let i=0;i<3;i++){ const l=mesh(G.cone(.03,.18,5),Mat(0x3fa03a),(i-1)*.04,.28,0,g); } }
  else if(S==='apple'){ mesh(G.sph(.15,14,12),m,0,0,0,g); mesh(G.cyl(.012,.012,.1,5),Mat(0x5a3a1a),0,.17,0,g); mesh(G.sph(.05,6,5),Mat(0x3fa03a),.05,.17,0,g).scale.set(1,.4,1.6); }
  else if(S==='pick'){ mesh(G.box(.06,.28,.06),Mat(0x222222),0,0,0,g); const h=mesh(G.box(.05,.14,.05),m,0,-.18,.05,g); h.rotation.x=-.8; mesh(G.box(.12,.04,.04),m,0,.14,0,g); }
  else if(S==='jar'){ mesh(G.cyl(.13,.13,.14),m,0,0,0,g); mesh(G.cyl(.135,.135,.04),Mat(0xc0c0c8,{metalness:.9,roughness:.2}),0,.08,0,g); mesh(G.box(.14,.08,.01),Mat(0xffd54a),0,0,.13,g); }
  else if(S==='comb'){ mesh(G.box(.3,.06,.03),m,0,.05,0,g); for(let i=0;i<10;i++) mesh(G.box(.015,.12,.02),m,-.13+i*.029,-.04,0,g); }
  else if(S==='ribbon'){ mesh(G.tor(.1,.05,8,18),m,0,0,0,g); mesh(G.cyl(.05,.05,.14),Mat(0xffffff),0,0,0,g).rotation.x=Math.PI/2; }
  else if(S==='mint'){ mesh(G.sph(.14,14,12),m,0,0,0,g).scale.set(1,.5,1); for(let i=0;i<6;i++){ const s=mesh(G.box(.03,.08,.16),Mat(0xd81e3a),0,0,0,g); s.rotation.y=i/6*Math.PI; s.position.set(Math.sin(i/6*Math.PI)*.1,0,Math.cos(i/6*Math.PI)*.1); } }
  else if(S==='cube'){ mesh(G.box(.2,.2,.2),Mat(0xfafafa,{roughness:.95}),0,0,0,g); for(let i=0;i<12;i++) mesh(G.sph(.012,4,3),Mat(0xffffff),rand(-.1,.1),rand(-.1,.1),.1,g); }
  return g; }
function buildSaddlePickup(def){ const g=new THREE.Group(); const stand=Mat(0x5a3a1e); mesh(G.box(.1,.9,.1),stand,0,.45,0,g); mesh(G.box(.5,.06,.5),stand,0,.03,0,g); mesh(G.cyl(.08,.08,.9),stand,0,.95,0,g).rotation.x=Math.PI/2; const s=buildSaddle(def); s.scale.setScalar(.9); s.position.set(0,1.05,0); g.add(s); const gl=glowSprite(def.accent===0xf07f1a?0xff9a3a:0xffd54a,2.4); gl.position.y=1.2; g.add(gl); return g; }
function buildGoldBallPickup(){ const g=new THREE.Group(); const b=buildVolleyball(true,.26); b.position.y=0; g.add(b); const ring=mesh(G.tor(.42,.025,6,32),Mat(0xffd54a,{emissive:0xffb000,emissiveIntensity:1}),0,0,0,g); ring.rotation.x=Math.PI/2; g.add(glowSprite(0xffc030,2.2)); g.userData.ring=ring; return g; }
function buildExitGate(){ const g=new THREE.Group(); const m=Mat(0x6ee7a8,{emissive:0x2bd97a,emissiveIntensity:.8}); for(const sd of [-1,1]) mesh(G.box(.3,3.2,.3),m,sd*1.3,1.6,0,g); mesh(G.box(2.9,.3,.3),m,0,3.2,0,g); const gl=glowSprite(0x4cffa0,5); gl.position.y=1.8; g.add(gl); const pad=mesh(G.cyl(1.3,1.3,.05,24),Mat(0x1a8a4a,{emissive:0x1a8a4a,emissiveIntensity:.6}),0,.03,0,g); g.userData.pad=pad; return g; }
function buildLamp(color){ const g=new THREE.Group(); mesh(G.cyl(.05,.05,.5),Mat(0x222222),0,-.25,0,g); mesh(G.cone(.4,.3,10,1,true),new THREE.MeshStandardMaterial({color:0x2a2a30,side:THREE.DoubleSide}),0,-.6,0,g).rotation.x=Math.PI; mesh(G.sph(.14,10,8),Mat(color,{emissive:color,emissiveIntensity:2}),0,-.6,0,g); return g; }
function buildTree(){ const g=new THREE.Group(); mesh(G.cyl(.18,.25,1.6,8),Mat(0x5a3a1e),0,.8,0,g); const lm=Mat(pick([0x2f8a3a,0x3fa04a,0x2a7a30])); mesh(G.sph(1.3,12,10),lm,0,2.3,0,g); mesh(G.sph(.9,10,8),lm,.7,2.9,.3,g); mesh(G.sph(.8,10,8),lm,-.6,2.8,-.4,g); compactDeep(g); return g; }

// ---------- shared helpers added for performance ----------
let GLOW_TEX=null;
function glowSprite(color,size){ if(!GLOW_TEX) GLOW_TEX=canvasTex(64,64,(g,w,h)=>{ const gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.35,'rgba(255,255,255,.45)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,w,h); });
  const m=new THREE.SpriteMaterial({map:GLOW_TEX,color,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}); const s=new THREE.Sprite(m); s.scale.set(size,size,1); return s; }
// merge every group's static child meshes that share a look into one draw call
function matKey(m){ return [m.type,m.color&&m.color.getHex(),m.map&&m.map.uuid,m.roughness,m.metalness,m.emissive&&m.emissive.getHex(),m.emissiveIntensity,m.side,m.transparent].join('|'); }
function compactDeep(root){ const groups=[]; root.traverse(o=>groups.push(o));
  for(const grp of groups){ const buckets=new Map(); for(const ch of grp.children){ if(!ch.isMesh||ch.isInstancedMesh||ch.children.length||ch.userData.keep||Array.isArray(ch.material)) continue; const k=matKey(ch.material); if(!buckets.has(k)) buckets.set(k,[]); buckets.get(k).push(ch); }
    for(const list of buckets.values()){ if(list.length<2) continue; const geos=list.map(m=>{ m.updateMatrix(); let gg=m.geometry.index?m.geometry.clone():m.geometry.clone(); gg.applyMatrix4(m.matrix); for(const n of Object.keys(gg.attributes)) if(!['position','normal','uv'].includes(n)) gg.deleteAttribute(n); return gg; });
      let merged=null; try{ merged=mergeGeometries(geos,false); }catch(e){} if(!merged) continue; const mm=new THREE.Mesh(merged,list[0].material); mm.castShadow=list.some(m=>m.castShadow); mm.receiveShadow=list.some(m=>m.receiveShadow); for(const m of list){ grp.remove(m); m.geometry.dispose(); } grp.add(mm); geos.forEach(x=>x.dispose()); } } return root; }
// one built troll per type, cloned (shares geometry + materials)
const TROLL_TPL={};
function makeTroll(tp){ if(!TROLL_TPL[tp.id]){ const t=buildTroll(tp); t.traverse(o=>{ o.userData={}; }); TROLL_TPL[tp.id]=t; }
  const m=TROLL_TPL[tp.id].clone(true); const n=k=>m.getObjectByName(k);
  m.userData={legs:[n('leg0'),n('leg1')],arms:[n('arm0'),n('arm1')],head:n('head'),body:n('body'),hair:n('hair'),type:tp}; return m; }
function clearTrollTemplates(){ for(const k in TROLL_TPL) delete TROLL_TPL[k]; }
// golden horseshoe key
function buildKey(){ const g=new THREE.Group(); const gold=Mat(0xffcf3a,{metalness:.9,roughness:.22,emissive:0x8a5a00,emissiveIntensity:.45});
  const shoe=mesh(new THREE.TorusGeometry(.32,.075,12,32,Math.PI*1.4),gold,0,0,0,g); shoe.rotation.z=-Math.PI*.2-Math.PI/2+Math.PI;
  for(let i=0;i<6;i++){ const a=-Math.PI*.2+(i/5)*Math.PI*1.4+Math.PI/2; mesh(G.sph(.03,6,5),Mat(0x5a3a00),Math.cos(a)*.32,Math.sin(a)*.32,.07,g); }
  g.add(glowSprite(0xffd54a,2)); compactDeep(g); return g; }
// locked gate with one emblem slot per horseshoe
function buildGate(need){ const g=new THREE.Group(); const iron=Mat(0x3a3a44,{metalness:.8,roughness:.35}); const gold=Mat(0xffcf3a,{metalness:.9,roughness:.25,emissive:0x6a4a00,emissiveIntensity:.4});
  mesh(G.box(T,.4,.6),iron,0,WALL_H-.2,0,g); const bars=new THREE.Group(); g.add(bars); for(let i=0;i<9;i++) mesh(G.cyl(.06,.06,WALL_H-.4,8),iron,-T/2+.25+i*(T-.5)/8,(WALL_H-.4)/2,0,bars); for(let k=0;k<3;k++) mesh(G.box(T-.2,.12,.12),iron,0,.6+k*1.2,0,bars);
  const slots=[]; for(let i=0;i<need;i++){ const s=new THREE.Mesh(new THREE.TorusGeometry(.17,.045,8,20,Math.PI*1.4),Mat(0x222228,{metalness:.6,roughness:.4})); s.rotation.z=Math.PI*.3; s.position.set((i-(need-1)/2)*.48,2.4,.12); bars.add(s); const s2=s.clone(); s2.position.z=-.12; bars.add(s2); slots.push([s,s2]); }
  g.userData={bars,slots,gold}; return g; }
// troll nest: rock mound with a glowing rainbow core
function buildNest(){ const g=new THREE.Group(); const rock=Mat(0x5a5048,{roughness:.95}); for(let i=0;i<11;i++){ const a=i/11*Math.PI*2; const r=mesh(new THREE.DodecahedronGeometry(rand(.45,.75),0),rock,Math.cos(a)*1.1,rand(.2,.5),Math.sin(a)*1.1,g); r.rotation.set(rand(0,3),rand(0,3),rand(0,3)); }
  for(let i=0;i<5;i++){ const r=mesh(new THREE.DodecahedronGeometry(rand(.4,.6),0),rock,rand(-.5,.5),rand(.9,1.3),rand(-.5,.5),g); r.rotation.set(rand(0,3),rand(0,3),rand(0,3)); }
  compactDeep(g);
  const core=new THREE.Mesh(G.sph(.55,18,14),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xff40a0,emissiveIntensity:1.4,roughness:.3})); core.position.y=.8; g.add(core);
  for(let i=0;i<7;i++){ const sp=mesh(G.cone(.09,.7,6),Mat(RAINBOW[i],{emissive:RAINBOW[i],emissiveIntensity:.7}),Math.cos(i/7*6.28)*.5,1.5,Math.sin(i/7*6.28)*.5,g); sp.rotation.set(Math.sin(i/7*6.28)*.5,0,-Math.cos(i/7*6.28)*.5); }
  const gl=glowSprite(0xff60c0,3.2); gl.position.y=.9; g.add(gl); g.userData={core,glow:gl}; return g; }
function buildMudBall(){ const g=new THREE.Group(); const m=mesh(G.sph(.2,10,8),Mat(0x5a3a1a,{roughness:1}),0,0,0,g); for(let i=0;i<5;i++) mesh(G.sph(.08,6,5),Mat(0x4a2e14,{roughness:1}),rand(-.15,.15),rand(-.15,.15),rand(-.15,.15),g); compactDeep(g); return g; }
