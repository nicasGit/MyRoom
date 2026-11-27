import * as THREE from 'three';
import type { AdventureState,SymbolId } from '../../server/src/adventure.js';
import { CLUES } from '../../server/src/puzzles/symbol-chest.js';
import { puzzlePanel,type PuzzleItem,type RoomModel } from '../../server/src/scene-schema.js';
import { createChest } from './chest-view';
import { blackjackTable } from './puzzles/blackjack-view';
import type { HybridPublicState } from '../../server/src/puzzles/blackjack-hybrid.js';
import { TAPE_INFO } from '../../server/src/puzzles/retro-videoclub.js';
import type { ObjectSnapshot,ObjectId } from '../../server/src/object-manipulation.js';
import { coverFor } from './cover-catalog';
export function applyObjectPoses(group:THREE.Group,objects:ObjectSnapshot|undefined){
  const roots=group.userData.grabbables as Partial<Record<ObjectId,THREE.Object3D>>|undefined;if(!roots)return;
  for(const [id,node] of Object.entries(roots)){const p=objects?.poses[id as ObjectId];if(node)node.userData.held=objects?.held.some(held=>held.target===id)??false;if(p&&node){node.position.set(p.x,p.y,p.z);if(p.scale!==undefined)node.scale.setScalar(p.scale);if(p.quaternion)node.quaternion.copy(p.quaternion);else node.rotation.set(0,p.yaw,0);}}
}
export const SYMBOL_NAMES={sun:'Soleil',tree:'Arbre',moon:'Lune',star:'Étoile'};
export const CARD_NAMES={four:'4',eight:'8',king:'Roi'};
export const CARD_CLUES={four:'Mes quatre coins gardent quatre saisons.',eight:'Deux fois les saisons de l’année.',king:'Je porte une couronne ; ma valeur est dix.'};
type Action={action:'discover_symbol'|'press_symbol'|'discover_clue'|'discover_card'|'choose_card';target:string}|{action:'discover_tape';tape:string};
export function pickAdventureAction(group:THREE.Group,origin:THREE.Vector3,direction:THREE.Vector3,camera:THREE.Camera):Action|undefined{
  group.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(origin,direction.clone().normalize(),0,8);ray.camera=camera;
  return ray.intersectObject(group,true).find(hit=>hit.object.userData.action)?.object.userData.action as Action|undefined;
}
export function label(text:string,color:string){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='#0c1727';ctx.fillRect(0,0,512,160);ctx.strokeStyle=color;ctx.lineWidth=8;ctx.strokeRect(4,4,504,152);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 42px sans-serif';ctx.fillText(text,256,80,480);
  const texture=new THREE.CanvasTexture(canvas),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthWrite:false}));sprite.scale.set(0.65,0.2,1);return sprite;
}
function box(width:number,height:number,depth:number,color:number){return new THREE.Mesh(new THREE.BoxGeometry(width,height,depth),new THREE.MeshBasicMaterial({color}));}
function actionLabel(text:string,color:string,action:Action){const sprite=label(text,color);sprite.userData.action=action;return sprite;}
function cluePaper(text:string,action:Action){const paper=new THREE.Group();paper.userData.action=action;const sheet=new THREE.Mesh(new THREE.BoxGeometry(.28,.012,.2),new THREE.MeshStandardMaterial({color:0xe7d6ad,roughness:.85}));sheet.userData.action=action;paper.add(sheet);const edge=new THREE.Mesh(new THREE.BoxGeometry(.24,.014,.012),new THREE.MeshStandardMaterial({color:0x8b6b45,roughness:1}));edge.position.set(0,.009,-.075);edge.userData.action=action;paper.add(edge);const note=label(text,'#5b3a20');note.scale.set(.3,.07,1);note.position.y=.018;note.userData.action=action;paper.add(note);return paper;}
function retroCover(info:{title:string;year:number;color:number;hide:string},action:Action){const custom='tape' in action?coverFor(action.tape):undefined;const canvas=document.createElement('canvas');canvas.width=420;canvas.height=620;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#101827';ctx.fillRect(0,0,420,620);ctx.fillStyle=`#${info.color.toString(16).padStart(6,'0')}`;ctx.fillRect(18,18,384,584);ctx.fillStyle='#fff4c2';ctx.textAlign='center';ctx.font='bold 30px sans-serif';ctx.fillText(String(custom?.year??info.year),210,78,340);ctx.font='bold 34px sans-serif';ctx.fillText(custom?.title??info.title,210,330,340);ctx.font='20px sans-serif';ctx.fillText('JAQUETTE MYROOM',210,548,340);const map=new THREE.CanvasTexture(canvas),sprite=new THREE.Mesh(new THREE.PlaneGeometry(.28,.42),new THREE.MeshBasicMaterial({map,transparent:true}));sprite.userData.action=action;if(custom){const image=new Image();image.onload=()=>{ctx.drawImage(image,18,18,384,584);ctx.fillStyle='#fff4c2';ctx.font='bold 30px sans-serif';ctx.fillText(String(custom.year),210,78,340);ctx.font='bold 34px sans-serif';ctx.fillText(custom.title,210,330,340);map.needsUpdate=true;};image.src=custom.image;}return sprite;}
function plaque(text:string,color:string,width:number,height:number){
  const sprite=label(text,color),material=new THREE.MeshBasicMaterial({map:sprite.material.map});sprite.material.dispose();
  return new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);
}
function symbolTile(id:SymbolId|undefined,color:string,index:number){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#182630';ctx.fillRect(0,0,256,256);ctx.strokeStyle=color;ctx.lineWidth=8;ctx.strokeRect(5,5,246,246);ctx.fillStyle=color;ctx.lineWidth=6;
  if(id==='sun'){
    ctx.beginPath();ctx.arc(128,105,33,0,Math.PI*2);ctx.fill();
    for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(128+44*Math.cos(a),105+44*Math.sin(a));ctx.lineTo(128+62*Math.cos(a),105+62*Math.sin(a));ctx.stroke();}
  }else if(id==='tree'){
    ctx.fillRect(118,130,20,45);ctx.beginPath();ctx.moveTo(128,40);ctx.lineTo(185,143);ctx.lineTo(71,143);ctx.closePath();ctx.fill();
  }else if(id==='moon'){
    ctx.beginPath();ctx.arc(125,106,60,0,Math.PI*2);ctx.fill();ctx.fillStyle='#182630';ctx.beginPath();ctx.arc(151,87,53,0,Math.PI*2);ctx.fill();
  }else if(id==='star'){
    ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?27:63;const x=128+r*Math.cos(a),y=105+r*Math.sin(a);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.closePath();ctx.fill();
  }else{ctx.font='bold 80px sans-serif';ctx.textAlign='center';ctx.fillText(String(index+1),128,145);}
  ctx.fillStyle=color;ctx.font='bold 30px sans-serif';ctx.textAlign='center';if(id)ctx.fillText(SYMBOL_NAMES[id],128,225);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(0.21,0.19),new THREE.MeshBasicMaterial({map}));
}
function wallConsole(model:RoomModel,state:AdventureState){
  const pose=puzzlePanel(model);if(!pose)return;
  const panel=new THREE.Group();panel.name='wall-symbol-panel';panel.position.set(pose.position.x,pose.height,pose.position.z);panel.rotation.y=pose.yaw;
  const frame=box(1.04,0.8,0.065,0x705332);panel.add(frame);
  const face=box(0.97,0.73,0.025,0x172630);face.position.z=0.045;panel.add(face);
  const puzzleName=state.videoclub?'Videoclub retro':state.hybrid||state.phase==='blackjack'?'Blackjack hybride':state.phase==='symbols'?'Coffre a symboles':'Etape suivante';
  const info=plaque(`Puzzle : ${puzzleName}`,'#ffe082',0.8,0.1);info.position.set(0,0.34,0.065);panel.add(info);
  const title=plaque(state.phase==='symbols'?'Sceaux du coffre':'Coffre déverrouillé','#ffe082',0.8,0.12);title.position.set(0,0.27,0.065);panel.add(title);
  for(const [i,id] of (['sun','tree','moon','star'] as const).entries()){
    const inserted=state.symbols.entered[i],slot=symbolTile(inserted,'#a7f3a0',i);slot.position.set((i-1.5)*0.235,0.08,0.065);panel.add(slot);
    const button=symbolTile(id,state.symbols.found.length===4?'#ffe082':'#64748b',i);button.position.set((i-1.5)*0.235,-0.14,0.065);
    button.userData.action={action:'press_symbol',target:id};panel.add(button);
  }
  const hint=plaque('Choisir les symboles dans le bon ordre','#c3d8eb',0.85,0.09);hint.position.set(0,-0.29,0.065);panel.add(hint);
  const back=plaque('NJOSoftware','#9cdced',0.78,0.18);back.position.set(0,0,-0.04);back.rotation.y=Math.PI;panel.add(back);
  return panel;
}
export function adventureGroup(model:RoomModel,state:AdventureState,actorId?:string){
  const group=new THREE.Group();if(!model.puzzles)return group;
  const roots:Partial<Record<ObjectId,THREE.Object3D>>={};group.userData.grabbables=roots;
  const at=(id:PuzzleItem)=>{const p=model.puzzles!.points[id],node=new THREE.Group();node.position.set(p.x,model.puzzles!.poses?.[id]?.y??0,p.z);node.rotation.y=model.puzzles!.poses?.[id]?.yaw??0;group.add(node);roots[id]=node;return node;};
  const chest=at('chest'),crafted=createChest(state.phase==='hybrid'||state.phase==='blackjack'||state.phase==='complete'||state.phase==='pending');chest.add(crafted.chest);group.userData.lid=crafted.hinge;
  const panel=wallConsole(model,state);if(panel){group.add(panel);roots.panel=panel;}
  const clue=actionLabel('Feuille déchirée','#ffe082',{action:'discover_clue',target:'clue-false'});clue.rotation.x=-Math.PI/2;clue.position.set(chest.position.x,chest.position.y+0.006,chest.position.z);clue.visible=false;group.add(clue);group.userData.underChest={chest,clue,base:chest.position.clone()};
  const heading=label(state.phase==='symbols'?'Le coffre':'Coffre ouvert','#ffe082');heading.position.y=1.05;chest.add(heading);
  for(const [i,id] of (['sun','tree','moon','star'] as const).entries()){
    const found=!state.running||state.symbols.found.includes(id),node=at(id),pole=box(0.05,0.65,0.05,0x64748b);pole.position.y=0.325;node.add(pole);
    const sign=actionLabel(found?SYMBOL_NAMES[id]:`Balise ${i+1} ?`,found?'#a7f3a0':'#67e8f9',{action:'discover_symbol',target:id});sign.position.y=0.85;node.add(sign);
    const fragmentId=CLUES[i],fragment=cluePaper(state.symbols.cluesFound.includes(fragmentId)?'Fragment lu':'Indice � examiner',{action:'discover_clue',target:fragmentId});fragment.position.y=0.62;fragment.visible=found&&!state.symbols.cluesFound.includes(fragmentId);node.add(fragment);
  }
  if(state.videoclub){const tapes=(state.engine.instances.find(instance=>instance.type==='retro-videoclub')?.objects??[]).map(object=>object.id as keyof typeof TAPE_INFO);for(const id of tapes){const info=TAPE_INFO[id],node=at(info.placementKey as PuzzleItem),tape=retroCover(info,{action:'discover_tape',tape:id});tape.position.y=info.placementKey==='chest'?1.35:0.85;node.add(tape);}const table=at('table'),title=label('VIDÉOCLUB RÉTRO','#ffe082');title.position.y=1.2;table.add(title);return group;}
  if(state.hybrid){at('table').add(blackjackTable(state.hybrid,actorId,state.captainId));return group;}
  const hybridInstance=state.engine.instances.find(i=>i.type==='blackjack-hybrid');
  if(hybridInstance){if(!state.running)at('table').add(blackjackTable(hybridInstance.state as HybridPublicState,actorId,state.captainId));return group;}
  if(state.running&&state.phase!=='blackjack'&&state.phase!=='complete')return group;
  const table=at('table'),felt=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,0.07,24),new THREE.MeshBasicMaterial({color:0x126b54}));felt.position.y=0.74;table.add(felt);
  const leg=box(0.1,0.7,0.1,0x755038);leg.position.y=0.35;table.add(leg);
  const title=label(state.phase==='complete'?'21 · Clé obtenue · 7':'As + 6 · Objectif 21','#ffe082');title.position.y=1.25;table.add(title);
  for(const [i,id] of (['four','eight','king'] as const).entries()){
    const found=!state.running||state.blackjack.found.includes(id),node=at(id),card=actionLabel(found?CARD_NAMES[id]:`Carte ${i+1} ?`,found?'#a7f3a0':'#67e8f9',{action:'discover_card',target:id});card.position.y=0.85;node.add(card);
    if(state.phase==='blackjack'){const button=actionLabel(CARD_NAMES[id],'#ffffff',{action:'choose_card',target:id});button.scale.set(0.27,0.15,1);button.position.set((i-1)*0.32,0.95,0.1);table.add(button);}
  }
  if(state.phase==='complete'){
    const key=new THREE.Group(),ring=new THREE.Mesh(new THREE.TorusGeometry(0.07,0.018,8,20),new THREE.MeshBasicMaterial({color:0xffd54f}));key.add(ring);
    const stem=box(0.025,0.2,0.025,0xffd54f);stem.position.y=-0.15;key.add(stem);const tooth=box(0.08,0.025,0.025,0xffd54f);tooth.position.set(0.025,-0.24,0);key.add(tooth);key.position.y=1.6;table.add(key);group.userData.key=key;
  }
  return group;
}
export function animateAdventure(group:THREE.Group,time:number){
  const under=group.userData.underChest as {chest:THREE.Group;clue:THREE.Mesh;base:THREE.Vector3}|undefined;if(under)under.clue.visible=under.chest.position.y-under.base.y>0.25||Math.hypot(under.chest.position.x-under.base.x,under.chest.position.z-under.base.z)>0.45;
  const lid=group.userData.lid as THREE.Group|undefined;if(lid){lid.rotation.x+=(Number(lid.userData.targetAngle)-lid.rotation.x)*0.08;const imported=lid.userData.importedLid as THREE.Group|undefined;if(imported)imported.rotation.x=lid.rotation.x;}
  const key=group.userData.key as THREE.Group|undefined;if(key)key.rotation.y=time/1200;
}
