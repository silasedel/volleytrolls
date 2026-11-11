// ===================== TEXTURES: all drawn on canvas at runtime =====================
function canvasTex(w,h,draw,repeat){ const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); draw(g,w,h); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; if(repeat){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(repeat[0],repeat[1]); } t.anisotropy=8; return t; }
function shade(hexNum,dl){ const c=new THREE.Color(hexNum); c.offsetHSL(0,0,dl); return '#'+c.getHexString(); }
function rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); g.fill(); }
function speckle(g,w,h,n,a){ g.globalAlpha=a; for(let i=0;i<n;i++){ g.fillStyle=Math.random()<.5?'#000':'#fff'; g.fillRect(Math.random()*w,Math.random()*h,2,2);} g.globalAlpha=1; }

// Volleyball: computed per pixel from sphere direction. 6 cube faces x 3 strips = 18 panels,
// strip direction rotates per axis (X faces split by Y, Y by Z, Z by X) exactly like a real indoor ball.
function volleyballMaps(gold){
  const W=1024,H=512; const cc=document.createElement('canvas'); cc.width=W; cc.height=H; const bc=document.createElement('canvas'); bc.width=W; bc.height=H;
  const cg=cc.getContext('2d'), bg=bc.getContext('2d'); const ci=cg.createImageData(W,H), bi=bg.createImageData(W,H);
  const PAL=gold?[[245,190,40],[255,246,214],[214,140,18]]:[[24,72,214],[248,248,242],[250,206,22]];
  const SEAM=gold?[110,70,8]:[38,38,44];
  for(let y=0;y<H;y++){ const th=(y+.5)/H*Math.PI, st=Math.sin(th), ct=Math.cos(th);
    for(let x=0;x<W;x++){ const ph=(x+.5)/W*Math.PI*2; const dx=-Math.cos(ph)*st, dy=ct, dz=Math.sin(ph)*st; const ax=Math.abs(dx),ay=Math.abs(dy),az=Math.abs(dz);
      let m,sv,o; if(ax>=ay&&ax>=az){ m=ax; sv=dy/ax; o=Math.max(ay,az)/ax; } else if(ay>=az){ m=ay; sv=dz/ay; o=Math.max(ax,az)/ay; } else { m=az; sv=dx/az; o=Math.max(ax,ay)/az; }
      const strip=sv<-1/3?0:sv<1/3?1:2; const dStrip=Math.min(Math.abs(sv+1/3),Math.abs(sv-1/3)); const dEdge=1-o; const d=Math.min(dStrip,dEdge*1.4);
      const seam=d<.022; const puff=.72+.28*Math.min(1,d/.16);
      let c=seam?SEAM:PAL[strip]; const n=(Math.random()-.5)*6;
      const i=(y*W+x)*4; ci.data[i]=Math.min(255,c[0]*(seam?1:puff)+n); ci.data[i+1]=Math.min(255,c[1]*(seam?1:puff)+n); ci.data[i+2]=Math.min(255,c[2]*(seam?1:puff)+n); ci.data[i+3]=255;
      const b=seam?0:Math.min(255,60+195*Math.min(1,d/.12)); bi.data[i]=bi.data[i+1]=bi.data[i+2]=b; bi.data[i+3]=255;
      // valve hole on one panel
      if(dy>.995&&false){} } }
  cg.putImageData(ci,0,0); bg.putImageData(bi,0,0);
  // valve: small dark ring on the +Z strip center
  cg.fillStyle=gold?'#6b4a0a':'#333'; cg.beginPath(); cg.arc(W*.25,H*.5,5,0,7); cg.fill();
  const t=new THREE.CanvasTexture(cc); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; const bt=new THREE.CanvasTexture(bc); bt.anisotropy=8;
  return {map:t,bump:bt};
}
function stoneTexture(base,mortar){
  return canvasTex(512,512,(g,w,h)=>{
    g.fillStyle=css(mortar); g.fillRect(0,0,w,h);
    const rows=7, bh=h/rows, cols=4, bw=w/cols;
    for(let r=0;r<rows;r++){ const off=(r%2)*.5; for(let c=-1;c<=cols;c++){ const x=(c+off)*bw+5, y=r*bh+5; g.fillStyle=shade(base,rand(-.07,.07)); rr(g,x,y,bw-10,bh-10,8);
        g.fillStyle='rgba(255,255,255,.08)'; g.fillRect(x+4,y+4,bw-18,3); g.fillStyle='rgba(0,0,0,.18)'; g.fillRect(x+4,y+bh-16,bw-18,4); } }
    speckle(g,w,h,5000,.07);
  });
}
function crackedStoneTexture(base,mortar){
  const t=stoneTexture(base,mortar); const c=t.image, g=c.getContext('2d');
  g.strokeStyle='rgba(0,0,0,.75)'; g.lineWidth=5; g.lineCap='round'; g.beginPath(); let x=256,y=0; g.moveTo(x,y); for(let i=0;i<10;i++){ x+=rand(-45,45); y+=51; g.lineTo(x,y);} g.stroke();
  g.strokeStyle='rgba(255,255,255,.35)'; g.lineWidth=1.5; g.beginPath(); x=262;y=0; g.moveTo(x,y); for(let i=0;i<10;i++){ x+=rand(-45,45); y+=51; g.lineTo(x,y);} g.stroke();
  g.fillStyle='rgba(0,0,0,.35)'; for(let i=0;i<6;i++){ g.beginPath(); g.arc(rand(100,400),rand(80,450),rand(4,10),0,7); g.fill(); }
  t.needsUpdate=true; return t;
}
function floorTexture(a,b){
  return canvasTex(512,512,(g,w,h)=>{ const n=4, s=w/n; for(let i=0;i<n;i++) for(let j=0;j<n;j++){ g.fillStyle=shade((i+j)%2?a:b,rand(-.04,.04)); g.fillRect(i*s,j*s,s,s); g.fillStyle='rgba(0,0,0,.35)'; g.fillRect(i*s,j*s,s,3); g.fillRect(i*s,j*s,3,s); } speckle(g,w,h,6000,.08); },[1,1]);
}
function ceilingTexture(base){
  return canvasTex(512,512,(g,w,h)=>{ for(let i=0;i<6;i++){ g.fillStyle=shade(base,rand(-.05,.05)); g.fillRect(0,i*h/6,w,h/6); g.fillStyle='rgba(0,0,0,.4)'; g.fillRect(0,i*h/6,w,4); for(let k=0;k<30;k++){ g.fillStyle='rgba(0,0,0,.08)'; g.fillRect(Math.random()*w,i*h/6+rand(6,h/6-6),rand(20,80),1);} } },[1,1]);
}
function doorTexture(){
  return canvasTex(256,512,(g,w,h)=>{ g.fillStyle='#5a3a1e'; g.fillRect(0,0,w,h); for(let i=0;i<5;i++){ g.fillStyle=shade(0x5a3a1e,rand(-.05,.05)); g.fillRect(i*w/5+2,0,w/5-4,h);} g.fillStyle='#2a2a2e'; g.fillRect(0,h*.2,w,14); g.fillRect(0,h*.75,w,14); g.fillStyle='#8a8a90'; for(let i=0;i<6;i++){ g.beginPath(); g.arc(i*w/5+w/10,h*.2+7,5,0,7); g.fill(); g.beginPath(); g.arc(i*w/5+w/10,h*.75+7,5,0,7); g.fill(); } g.fillStyle='#c9a24a'; g.beginPath(); g.arc(w*.8,h*.5,10,0,7); g.fill(); });
}
function grassTexture(){
  return canvasTex(512,512,(g,w,h)=>{ g.fillStyle='#4f9a35'; g.fillRect(0,0,w,h); for(let i=0;i<9000;i++){ g.fillStyle=Math.random()<.5?'#3f8a2a':'#67b443'; g.fillRect(Math.random()*w,Math.random()*h,3,rand(3,9)); } },[40,40]);
}
function coinTexture(){
  return canvasTex(128,128,(g,w,h)=>{ g.fillStyle='#e0a81c'; g.fillRect(0,0,w,h); g.fillStyle='#ffd54a'; g.beginPath(); g.arc(64,64,52,0,7); g.fill(); g.strokeStyle='#b8860b'; g.lineWidth=5; g.beginPath(); g.arc(64,64,44,0,7); g.stroke(); g.fillStyle='#b8860b'; g.font='bold 60px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('V',64,68); });
}
function skyTexture(){
  return canvasTex(64,512,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#2f7fe0'); gr.addColorStop(.55,'#8fd0ff'); gr.addColorStop(1,'#e8f6ff'); g.fillStyle=gr; g.fillRect(0,0,w,h); });
}
function stripeTexture(c1,c2){
  return canvasTex(256,32,(g,w,h)=>{ for(let i=0;i<8;i++){ g.fillStyle=i%2?css(c1):css(c2); g.fillRect(i*32,0,32,h);} },[1,1]);
}
