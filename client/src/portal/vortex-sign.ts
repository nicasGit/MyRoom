import * as THREE from 'three';
import type { PortalConfig } from '../../../server/src/portal/portal-types.js';

export function signPlacement(portal:PortalConfig['portal'],depth:number){
  return {x:portal.x-Math.sin(portal.yaw)*portal.direction*depth,y:Math.min(1.4,portal.height-.45),z:portal.z-Math.cos(portal.yaw)*portal.direction*depth,yaw:portal.yaw+(portal.direction===-1?Math.PI:0)};
}

/** Crooked haunted wooden sign: original canvas paint and simple 3D woodwork. */
export function vortexSign(width=1.8,height=1){
  const group=new THREE.Group();group.name='vortex-wooden-sign';
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=576;
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const front=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false});
  const side=new THREE.MeshBasicMaterial({color:0x372012,transparent:true,depthWrite:false});
  const board=new THREE.Mesh(new THREE.BoxGeometry(width,height,.065),[side,side,side,side,front,side]);board.rotation.z=-.025;board.renderOrder=80;group.add(board);
  for(const [x,y] of [[-.45,.39],[.45,.39],[-.45,-.39],[.45,-.39]]){
    const nail=new THREE.Mesh(new THREE.SphereGeometry(.013,6,4),new THREE.MeshBasicMaterial({color:0x251d1b,transparent:true,depthWrite:false}));nail.position.set(x*width,y*height,.045);nail.renderOrder=81;group.add(nail);
  }
  const brace=new THREE.Mesh(new THREE.BoxGeometry(width*1.06,.05,.06),side);brace.position.y=-height*.48;brace.rotation.z=.025;brace.renderOrder=79;group.add(brace);
  let previous='';
  const draw=(footer='Puis restez sur place',notice='Fantômes approximatifs · Gardez vos distances')=>{
    const key=JSON.stringify([footer,notice]);if(previous===key)return;previous=key;
    const ctx=canvas.getContext('2d')!;
    ctx.fillStyle='#694327';ctx.fillRect(0,0,1024,576);
    for(let i=0;i<180;i++){
      ctx.strokeStyle=i%3?'rgba(35,16,7,.25)':'rgba(233,185,113,.18)';ctx.lineWidth=i%7===0?3:1;ctx.beginPath();
      for(let x=0;x<=1024;x+=16){const y=i*3.3+Math.sin(x*.008+i)*3+Math.sin(x*.023+i*4)*1.5;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
    }
    for(const y of [190,385]){ctx.fillStyle='#24130b';ctx.fillRect(0,y,1024,5);}
    ctx.strokeStyle='#e4d4ac';ctx.lineWidth=10;ctx.strokeRect(20,20,984,536);
    for(let i=0;i<16;i++){ctx.fillStyle=i%2?'#e9e1ce':'#19171b';ctx.fillRect(26+i*61,24,61,24);ctx.fillRect(26+i*61,528,61,24);}
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='#160d07';ctx.shadowBlur=3;ctx.shadowOffsetY=5;
    ctx.fillStyle='#fff2ca';ctx.font='bold 80px Georgia, serif';ctx.fillText('Entrez entièrement',512,170,930);ctx.fillText('dans le vortex',512,280,930);
    ctx.font='bold 38px Georgia, serif';ctx.fillText(footer,512,455,910);texture.needsUpdate=true;
    ctx.font='24px Georgia, serif';ctx.fillText(notice,512,504,910);
  };
  draw();return {group,draw};
}
