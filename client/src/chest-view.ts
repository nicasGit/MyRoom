import * as THREE from 'three';

function woodTexture(){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='#75432a';ctx.fillRect(0,0,512,256);
  let seed=53;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<360;i++){
    const y=random()*256;ctx.strokeStyle=i%3===0?'rgba(27,12,5,.25)':'rgba(226,165,94,.17)';ctx.lineWidth=0.5+random()*2;
    ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(140,y-8+random()*16,360,y-8+random()*16,512,y);ctx.stroke();
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
export function createChest(open:boolean){
  const chest=new THREE.Group();chest.name='wooden-chest';
  const wood=new THREE.MeshStandardMaterial({map:woodTexture(),roughness:0.82,color:0xd8b08a});
  const iron=new THREE.MeshStandardMaterial({color:0x343a3e,metalness:0.8,roughness:0.4});
  const brass=new THREE.MeshStandardMaterial({color:0xb58b3b,metalness:0.78,roughness:0.32});
  const dark=new THREE.MeshStandardMaterial({color:0x251710,roughness:0.95});
  const addBox=(parent:THREE.Object3D,size:number[],position:number[],material:THREE.Material)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(size[0],size[1],size[2]),material);mesh.position.set(position[0],position[1],position[2]);parent.add(mesh);return mesh;
  };
  // Hollow body: floor and individually separated boards on all four sides.
  addBox(chest,[0.9,0.06,0.58],[0,0.05,0],dark);
  for(let row=0;row<4;row++){
    const y=0.12+row*0.098;
    for(const z of [-0.272,0.272])addBox(chest,[0.9,0.094,0.045],[0,y,z],wood);
    for(const x of [-0.428,0.428])addBox(chest,[0.045,0.094,0.5],[x,y,0],wood);
  }
  for(const x of [-0.3,0.3])for(const z of [-0.301,0.301]){
    addBox(chest,[0.045,0.43,0.018],[x,0.25,z],iron);
    for(const y of [0.1,0.23,0.42]){const rivet=new THREE.Mesh(new THREE.SphereGeometry(0.012,8,6),brass);rivet.position.set(x,y,z+(z>0?0.01:-0.01));chest.add(rivet);}
  }
  for(const x of [-0.463,0.463]){
    const handle=new THREE.Mesh(new THREE.TorusGeometry(0.065,0.009,8,20,Math.PI),iron);handle.rotation.set(0,Math.PI/2,Math.PI);handle.position.set(x,0.3,0);chest.add(handle);
  }
  const hinge=new THREE.Group();hinge.name='chest-lid';hinge.position.set(0,0.46,-0.29);chest.add(hinge);
  const profile=new THREE.Shape();profile.moveTo(-0.29,0);profile.lineTo(0.29,0);profile.absellipse(0,0,0.29,0.2,0,Math.PI,false);profile.closePath();
  const lid=new THREE.Mesh(new THREE.ExtrudeGeometry(profile,{depth:0.9,bevelEnabled:true,bevelSize:0.008,bevelThickness:0.008,bevelSegments:1,steps:1,curveSegments:20}),wood);
  lid.rotation.y=Math.PI/2;lid.position.set(-0.45,0,0.29);hinge.add(lid);
  for(const x of [-0.3,0.3]){
    const path:THREE.Vector3[]=[];for(let i=0;i<=24;i++){const angle=i*Math.PI/24;path.push(new THREE.Vector3(x,0.205*Math.sin(angle),0.29-0.295*Math.cos(angle)));}
    const band=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path),24,0.018,6,false),iron);hinge.add(band);
  }
  addBox(hinge,[0.065,0.17,0.018],[0,-0.055,0.6],brass);
  const lock=new THREE.Group();lock.name='chest-lock';lock.visible=!open;chest.add(lock);
  addBox(lock,[0.13,0.13,0.035],[0,0.32,0.32],brass);
  const keyhole=new THREE.Mesh(new THREE.CircleGeometry(0.014,12),dark);keyhole.position.set(0,0.34,0.34);lock.add(keyhole);
  addBox(lock,[0.012,0.035,0.003],[0,0.32,0.341],dark);
  hinge.userData.targetAngle=open?-1.5:0;
  // Local lights keep the materials legible without relying on environmental AR lighting.
  chest.add(new THREE.HemisphereLight(0xe6f2ff,0x4f3020,2));
  const light=new THREE.DirectionalLight(0xffe0ad,2.5);light.position.set(1,3,2);chest.add(light);
  return {chest,hinge};
}
