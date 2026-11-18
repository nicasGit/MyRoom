import * as THREE from 'three';
import type { HybridAction,HybridPublicState } from '../../../server/src/puzzles/blackjack-hybrid.js';
import { cardLabel,hybridOptions } from './blackjack-controls';

function texture(text:string,background:string,color:string,width=512,height=192,font=38){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d')!;
  ctx.fillStyle=background;ctx.fillRect(0,0,width,height);ctx.strokeStyle=color;ctx.lineWidth=8;ctx.strokeRect(4,4,width-8,height-8);ctx.fillStyle=color;ctx.font=`bold ${font}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,width/2,height/2,width-20);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;return map;
}
function sign(text:string,width:number,height:number,color='#fff2c2'){
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture(text,'#142b28',color),depthWrite:false}));sprite.scale.set(width,height,1);return sprite;
}
function cardMesh(card:string|null,empty=false){
  const red=card?.endsWith('H')||card?.endsWith('D');const map=texture(empty?'Déposer':card?cardLabel(card):'MYROOM',empty?'#165c48':card?'#fff9e9':'#192a65',empty?'#98d7b5':red?'#b42336':'#182533',256,352,card?96:38);
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(0.19,0.008,0.27),[new THREE.MeshBasicMaterial({color:0xe6dcc6}),new THREE.MeshBasicMaterial({color:0xe6dcc6}),new THREE.MeshBasicMaterial({map}),new THREE.MeshBasicMaterial({color:0x192a65}),new THREE.MeshBasicMaterial({color:0xe6dcc6}),new THREE.MeshBasicMaterial({color:0xe6dcc6})]);return mesh;
}
export function blackjackTable(state:HybridPublicState,actor?:string,captain?:string){
  const group=new THREE.Group();group.name='blackjack-hybrid-table';
  const felt=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.07,1.15),new THREE.MeshBasicMaterial({color:0x106247}));felt.position.y=0.74;group.add(felt);
  for(const x of [-0.65,0.65])for(const z of [-0.4,0.4]){const leg=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.7,0.06),new THREE.MeshBasicMaterial({color:0x6d452c}));leg.position.set(x,0.35,z);group.add(leg);}
  const heading=sign(`Blackjack · Manche ${state.round} / 3`,1.1,0.18);heading.position.set(0,1.72,-0.55);group.add(heading);
  const options=hybridOptions(state,actor,captain);
  if(state.round===1){
    for(const [row,cards] of [state.dealer,state.team].entries())for(const [i,c] of cards.entries()){const mesh=cardMesh(c);mesh.position.set((i-(cards.length-1)/2)*0.19,0.785,row===0?-0.23:0.18);group.add(mesh);}
    const score=sign(`Équipe ${state.teamTotal} · Croupier ${state.dealerTotal??'?'}`,0.95,0.14);score.position.set(0,1.48,-0.55);group.add(score);
  }else{
    for(const [i,c] of state.cards.entries())if(!state.slots.includes(c)){
      const mesh=cardMesh(c);mesh.userData.hybridCard=c;mesh.position.set((i-(state.cards.length-1)/2)*0.22,0.785,-0.27);if(!state.locks.some(l=>l.card===c))mesh.userData.hybridAction={action:'pick_card',card:c};group.add(mesh);
    }
    for(let slot=0;slot<3;slot++){
      const c=state.slots[slot],mesh=cardMesh(c,c===null);mesh.position.set((slot-1)*0.26,0.785,0.12);
      mesh.userData.hybridSlot=slot;if(c)mesh.userData.hybridCard=c;
      mesh.userData.hybridAction=c?{action:'pick_card',card:c}:{action:'drop_card',slot};group.add(mesh);
      const number=sign(String(slot+1),0.1,0.07);number.position.set((slot-1)*0.26,0.82,0.3);group.add(number);
    }
  }
  // Shared button descriptors keep mouse, touch and XR trigger behavior identical.
  const buttons=options.filter(o=>!['pick_card','drop_card'].includes(o.action.action));
  for(const [index,option] of buttons.entries()){
    const sprite=sign(option.label,0.65,0.1,option.enabled?'#fff2c2':'#698078');sprite.position.set((index%2-0.5)*0.74,1.08+Math.floor(index/2)*0.13,-0.55);
    if(option.enabled)sprite.userData.hybridAction=option.action;group.add(sprite);
  }
  return group;
}
export function pickHybridAction(group:THREE.Group,origin:THREE.Vector3,direction:THREE.Vector3,camera:THREE.Camera):HybridAction|undefined{
  group.updateMatrixWorld(true);const ray=new THREE.Raycaster(origin,direction.clone().normalize(),0,8);ray.camera=camera;return ray.intersectObject(group,true).find(hit=>hit.object.userData.hybridAction)?.object.userData.hybridAction;
}
function dispose(group:THREE.Object3D){group.traverse(node=>{const mesh=node as THREE.Mesh;mesh.geometry?.dispose();const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];for(const material of materials)if(material){(material as THREE.MeshBasicMaterial).map?.dispose();material.dispose();}});}
export class BlackjackPreview {
  private renderer:THREE.WebGLRenderer;
  private scene=new THREE.Scene();
  private camera=new THREE.PerspectiveCamera(45,1,0.01,20);
  private group:THREE.Group|undefined;
  constructor(private host:HTMLElement,private action:(action:HybridAction)=>void){
    this.renderer=new THREE.WebGLRenderer({antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0x091b24);this.renderer.domElement.style.cssText='width:100%;height:360px;touch-action:pan-y';host.append(this.renderer.domElement);
    this.camera.position.set(0,2.3,2.6);this.camera.lookAt(0,0.8,0);
    this.renderer.domElement.addEventListener('pointerup',event=>{if(!this.group)return;const rect=this.renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),this.camera);const action=pickHybridAction(this.group,ray.ray.origin,ray.ray.direction,this.camera);if(action)this.action(action);});
  }
  update(state:HybridPublicState,actor?:string,captain?:string){
    if(this.group){this.scene.remove(this.group);dispose(this.group);}this.group=blackjackTable(state,actor,captain);this.scene.add(this.group);
    const width=Math.max(280,this.host.clientWidth);this.renderer.setSize(width,360,false);this.camera.aspect=width/360;this.camera.updateProjectionMatrix();this.scene.updateMatrixWorld(true);this.camera.updateMatrixWorld(true);this.renderer.render(this.scene,this.camera);
  }
}
