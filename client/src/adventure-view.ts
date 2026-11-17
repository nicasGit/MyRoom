import * as THREE from 'three';
import type { AdventureState } from '../../server/src/adventure.js';
import type { PuzzleItem,RoomModel } from '../../server/src/scene-schema.js';
export const SYMBOL_NAMES={sun:'Soleil',tree:'Arbre',moon:'Lune',star:'Étoile'};
export const CARD_NAMES={four:'4',eight:'8',king:'Roi'};
export const CARD_CLUES={four:'Mes quatre coins gardent quatre saisons.',eight:'Deux fois les saisons de l’année.',king:'Je porte une couronne ; ma valeur est dix.'};
type Action={action:'discover_symbol'|'press_symbol'|'discover_card'|'choose_card';target:string};
export function pickAdventureAction(group:THREE.Group,origin:THREE.Vector3,direction:THREE.Vector3,camera:THREE.Camera):Action|undefined{
  group.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(origin,direction.clone().normalize(),0,8);ray.camera=camera;
  return ray.intersectObject(group,true).find(hit=>hit.object.userData.action)?.object.userData.action as Action|undefined;
}
function label(text:string,color:string){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='#0c1727';ctx.fillRect(0,0,512,160);ctx.strokeStyle=color;ctx.lineWidth=8;ctx.strokeRect(4,4,504,152);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 42px sans-serif';ctx.fillText(text,256,80,480);
  const texture=new THREE.CanvasTexture(canvas),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthWrite:false}));sprite.scale.set(0.65,0.2,1);return sprite;
}
function box(width:number,height:number,depth:number,color:number){return new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),new THREE.MeshBasicMaterial({color}));}
function actionLabel(text:string,color:string,action:Action){const sprite=label(text,color);sprite.userData.action=action;return sprite;}
export function adventureGroup(model:RoomModel,state:AdventureState){
  const group=new THREE.Group();if(!model.puzzles)return group;
  const at=(id:PuzzleItem)=>{const p=model.puzzles!.points[id],node=new THREE.Group();node.position.set(p.x,0,p.z);group.add(node);return node;};
  const chest=at('chest'),base=box(0.65,0.4,0.45,0x755038);base.position.y=0.22;chest.add(base);
  const hinge=new THREE.Group();hinge.position.set(0,0.44,-0.225);const lid=box(0.69,0.1,0.48,0xc6984e);lid.position.set(0,0,0.24);hinge.add(lid);chest.add(hinge);
  hinge.userData.targetAngle=state.phase==='blackjack'||state.phase==='complete'?-1.45:0;group.userData.lid=hinge;
  const heading=label(state.phase==='symbols'?'Le coffre':'Coffre ouvert','#ffe082');heading.position.y=1.05;chest.add(heading);
  for(const [i,id] of (['sun','tree','moon','star'] as const).entries()){
    const found=state.symbols.found.includes(id),node=at(id),pole=box(0.05,0.65,0.05,0x64748b);pole.position.y=0.325;node.add(pole);
    const sign=actionLabel(found?SYMBOL_NAMES[id]:`Balise ${i+1} ?`,found?'#a7f3a0':'#67e8f9',{action:'discover_symbol',target:id});sign.position.y=0.85;node.add(sign);
    if(state.phase==='symbols'){
      const button=actionLabel(SYMBOL_NAMES[id],'#ffe082',{action:'press_symbol',target:id});button.scale.set(0.32,0.1,1);button.position.set((i%2-0.5)*0.37,0.72-Math.floor(i/2)*0.16,0.3);chest.add(button);
    }
  }
  if(state.phase!=='blackjack'&&state.phase!=='complete')return group;
  const table=at('table'),felt=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,0.07,24),new THREE.MeshBasicMaterial({color:0x126b54}));felt.position.y=0.74;table.add(felt);
  const leg=box(0.1,0.7,0.1,0x755038);leg.position.y=0.35;table.add(leg);
  const title=label(state.phase==='complete'?'21 · Clé obtenue · 7':'As + 6 · Objectif 21','#ffe082');title.position.y=1.25;table.add(title);
  for(const [i,id] of (['four','eight','king'] as const).entries()){
    const found=state.blackjack.found.includes(id),node=at(id),card=actionLabel(found?CARD_NAMES[id]:`Carte ${i+1} ?`,found?'#a7f3a0':'#67e8f9',{action:'discover_card',target:id});card.position.y=0.85;node.add(card);
    if(state.phase==='blackjack'){const button=actionLabel(CARD_NAMES[id],'#ffffff',{action:'choose_card',target:id});button.scale.set(0.27,0.15,1);button.position.set((i-1)*0.32,0.95,0.1);table.add(button);}
  }
  if(state.phase==='complete'){
    const key=new THREE.Group(),ring=new THREE.Mesh(new THREE.TorusGeometry(0.07,0.018,8,20),new THREE.MeshBasicMaterial({color:0xffd54f}));key.add(ring);
    const stem=box(0.025,0.2,0.025,0xffd54f);stem.position.y=-0.15;key.add(stem);const tooth=box(0.08,0.025,0.025,0xffd54f);tooth.position.set(0.025,-0.24,0);key.add(tooth);key.position.y=1.6;table.add(key);group.userData.key=key;
  }
  return group;
}
export function animateAdventure(group:THREE.Group,time:number){
  const lid=group.userData.lid as THREE.Group|undefined;if(lid)lid.rotation.x+=(Number(lid.userData.targetAngle)-lid.rotation.x)*0.08;
  const key=group.userData.key as THREE.Group|undefined;if(key)key.rotation.y=time/1200;
}
