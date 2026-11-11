// ===================== RIDER FACE: photo mapped onto a curved mask on the head =====================
const FACE_W=256, FACE_H=358;
const faceCanvas=document.createElement('canvas'); faceCanvas.width=FACE_W; faceCanvas.height=FACE_H;
const faceTex=new THREE.CanvasTexture(faceCanvas); faceTex.colorSpace=THREE.SRGBColorSpace; faceTex.anisotropy=8;
const faceMat=new THREE.MeshStandardMaterial({map:faceTex,transparent:true,roughness:.62,depthWrite:true}); faceMat.userData.shared=true;
(function loadFace(){ const img=new Image(); img.onload=()=>{ const g=faceCanvas.getContext('2d'); g.drawImage(img,0,0,FACE_W,FACE_H);
  // feather the edges into an oval so the photo blends into the 3D skin
  g.globalCompositeOperation='destination-in'; g.save(); g.translate(FACE_W/2,FACE_H*.47); g.scale(1,FACE_H/FACE_W*1.02);
  const gr=g.createRadialGradient(0,0,FACE_W*.30,0,0,FACE_W*.5); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(-FACE_W,-FACE_W,FACE_W*2,FACE_W*2); g.restore(); g.globalCompositeOperation='source-over'; faceTex.needsUpdate=true; };
  img.src=FACE_URI; })();
// curved segment of a sphere in front of the head; UVs span the whole photo
function faceMaskGeo(){ return new THREE.SphereGeometry(.1395,32,32,Math.PI/2-.66,1.32,Math.PI*.34,Math.PI*.54); }
