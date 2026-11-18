import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { ObjectManipulation,parseObjectCommand,type ObjectCommand } from './object-manipulation.js';
import { parseRoom,suggestPuzzleLayout,type RoomModel } from './scene-schema.js';
import { gripTransform,GrabInputs,ObjectGrabber,type GrabHand } from '../../client/src/object-grab.js';
import { animateAdventure } from '../../client/src/adventure-view.js';
import { HandCards } from '../../client/src/hand-cards.js';
import { InfoPanelAnchor } from '../../client/src/xr-info-panel.js';
import { XRHandsView } from '../../client/src/xr-hands-view.js';
import { phoneHand,hasTrackedHands } from '../../client/src/phone-hand.js';
import { hitMenu,positionWallMenu } from '../../client/src/portal/wall-menu-view.js';
import { makeCalibration } from '../../client/src/calibration.js';
test('phone: touchscreen grip does not disable simulation; tracked Quest inputs do',()=>{
  assert.equal(hasTrackedHands([{targetRayMode:'screen',gripSpace:{} as XRSpace}]),false);
  assert.equal(hasTrackedHands([{targetRayMode:'tracked-pointer',gripSpace:{} as XRSpace}]),true);
  const inputs=new GrabInputs();let read=false;
  const frame={getPose:()=>{read=true;throw Error('screen input must not supply a grip');}} as unknown as XRFrame;
  const hands=inputs.read(frame,{} as XRReferenceSpace,[{targetRayMode:'screen',handedness:'right',gripSpace:{}}] as unknown as XRInputSourceArray,makeCalibration(new THREE.Vector3(),new THREE.Vector3(1,0,0)));
  assert.deepEqual(hands,[]);assert.equal(read,false);
});
test('wall menu: fixed room wall transform and UV button selection',()=>{
  const room=parseRoom({id:'menu',name:'Menu',height:2.5,floor:[{x:0,z:0},{x:5,z:0},{x:5,z:5},{x:0,z:5}],obstacles:[],openings:[]});
  const group=new THREE.Group();assert.equal(positionWallMenu(group,room),true);
  const before=group.matrix.clone();group.updateMatrix();const transform=group.matrix.clone();
  assert.ok(group.position.y>=1&&group.position.y<=1.5);assert.notDeepEqual(transform.elements,before.elements);
  assert.equal(positionWallMenu(group,room),true);group.updateMatrix();assert.deepEqual(group.matrix.elements,transform.elements);
  const hits=[{id:'settings',x:32,y:244,width:465,height:58}];
  assert.equal(hitMenu(hits,100/1024,1-270/768),'settings');
  assert.equal(hitMenu(hits,100/1024,270/768),undefined);
  assert.equal(hitMenu(hits,0,1),undefined);
});

test('phone: virtual hand uses A/B, follows camera and drives grab/drop through existing leases',()=>{
  const calibration=makeCalibration(new THREE.Vector3(),new THREE.Vector3(1,0,0));
  const camera=new THREE.Vector3(1,1.4,1),orientation=new THREE.Quaternion();
  const first=phoneHand(camera,orientation,calibration,true);
  assert.ok(first.local.distanceTo(new THREE.Vector3(1,1.32,.45))<1e-8);
  const view=new XRHandsView();view.simulateRight(first.local,orientation,true);
  assert.equal(view.group.getObjectByName('hand-right')!.visible,true);
  const group=new THREE.Group(),node=new THREE.Mesh(new THREE.BoxGeometry(.1,.6,.1),new THREE.MeshBasicMaterial());
  node.position.copy(first.hand.position);group.add(node);group.userData.grabbables={staff1:node};
  const pose={x:node.position.x,y:node.position.y,z:node.position.z,yaw:0};
  const snapshot:any={revision:1,poses:{staff1:pose},held:[]},sent:ObjectCommand[]=[];
  const grab=new ObjectGrabber(()=>'phone',()=>snapshot,c=>{sent.push(c);return true;},()=>{});
  grab.update(group,[first.hand],true,100);assert.equal(sent[0].action,'grab');
  snapshot.held=[{target:'staff1',owner:'phone',lease:'lease'}];
  const next=phoneHand(camera.clone().add(new THREE.Vector3(.1,0,0)),orientation,calibration,true);
  grab.update(group,[next.hand],true,400);assert.equal(sent[1].action,'move');
  grab.update(group,[{...next.hand,pressed:false}],true,500);assert.equal(sent[2].action,'drop');
  view.dispose();node.geometry.dispose();node.material.dispose();
});

test('mains visibles : articulations suivies, perte de suivi et retrait de source',()=>{
  const view=new XRHandsView(),wrist={},thumb={},tip={};
  const source={handedness:'left',hand:new Map([['wrist',wrist],['thumb-metacarpal',thumb],['thumb-tip',tip]])} as any;
  let tracked=true;
  const frame={getJointPose:(space:unknown)=>tracked?{radius:0.008,transform:{position:{x:space===wrist?0:0.03,y:1,z:0},orientation:{x:0,y:0,z:0,w:1}}}:null} as any;
  view.update(frame,{} as any,[source] as any,['left']);
  const left=view.group.getObjectByName('hand-left')!,right=view.group.getObjectByName('hand-right')!;
  assert.equal(left.visible,true);assert.equal(right.visible,false);assert.equal(left.getObjectByName('wrist')!.visible,true);
  assert.equal((left.getObjectByName('wrist') as THREE.Mesh<THREE.SphereGeometry,THREE.MeshBasicMaterial>).material.color.getHex(),0xffd54f);
  assert.equal(left.getObjectByName('index-finger-tip')!.visible,false);
  tracked=false;view.update(frame,{} as any,[source] as any);assert.equal(left.visible,false);
  view.update(frame,{} as any,[] as any);assert.equal(left.visible,false);
  view.dispose();assert.equal(view.group.children.length,0);
});

test('mains visibles : gant de contrôleur orienté par gripSpace, sans fausses articulations',()=>{
  const view=new XRHandsView(),source={handedness:'right',gripSpace:{}} as any;
  const frame={getPose:()=>({transform:{position:{x:1,y:1.2,z:-0.5},orientation:{x:0,y:0,z:0,w:1}}})} as any;
  view.update(frame,{} as any,[source] as any);
  const right=view.group.getObjectByName('hand-right')!,glove=right.getObjectByName('controller-glove')!;
  assert.equal(right.visible,true);assert.equal(glove.visible,true);assert.deepEqual(glove.position.toArray(),[1,1.2,-0.5]);
  assert.equal(right.getObjectByName('wrist')!.visible,false);
  view.update(undefined,{} as any,[source] as any);assert.equal(right.visible,false);view.dispose();
});

test('panneau XR : hauteur lisible, position et orientation fixes après mouvement du regard',()=>{
  const panel=new THREE.Object3D(),anchor=new InfoPanelAnchor();
  anchor.place(panel,new THREE.Vector3(0,1.7,0),new THREE.Quaternion().setFromEuler(new THREE.Euler(0.8,0.2,0)));
  assert.equal(panel.position.y,1.45);assert.ok(Math.abs(Math.hypot(panel.position.x,panel.position.z)-1.6)<1e-8);
  const position=panel.position.clone(),rotation=panel.quaternion.clone();
  anchor.place(panel,new THREE.Vector3(2,1.6,3),new THREE.Quaternion());
  assert.deepEqual(panel.position,position);assert.deepEqual(panel.quaternion.toArray(),rotation.toArray());
  anchor.reset();anchor.place(panel,new THREE.Vector3(2,1.6,3),new THREE.Quaternion());assert.notDeepEqual(panel.position,position);
});

test('prise : approcher avec les poignées déjà fermées, sans répétition après refus',()=>{
  const sent:ObjectCommand[]=[],group=new THREE.Group(),chest=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.5,0.6));group.add(chest);group.userData.grabbables={chest};
  const snapshot={revision:1,poses:{chest:{x:0,y:0,z:0,yaw:0}},held:[]};
  const grab=new ObjectGrabber(()=> 'a',()=>snapshot,c=>{sent.push(c);return true;},()=>{});
  const hands:GrabHand[]=[{side:'left',position:new THREE.Vector3(-0.2,0.2,2),pressed:true,yaw:0},{side:'right',position:new THREE.Vector3(0.2,0.2,2),pressed:true,yaw:0}];
  grab.update(group,hands,true,100);assert.equal(sent.length,0);
  hands.forEach(h=>h.position.z=0);grab.update(group,hands,true,200);assert.equal(sent.length,1);
  grab.reject('refus');grab.update(group,hands,true,performance.now()+1000);assert.equal(sent.length,1);
  grab.update(group,hands.map(h=>({...h,pressed:false})),true,performance.now()+1100);
  grab.update(group,hands,true,performance.now()+1200);assert.equal(sent.length,2);
});
const room:RoomModel={id:'grab',name:'Grab',height:2.5,floor:[{x:0,z:0},{x:8,z:0},{x:8,z:6},{x:0,z:6}],obstacles:[],openings:[]};room.puzzles=suggestPuzzleLayout(room,()=>0.3);
function fixture(){const objects=new ObjectManipulation();objects.configure(room,0);const pose=objects.snapshot().poses.chest!;const command:ObjectCommand={type:'object_action',action:'grab',target:'chest',revision:objects.snapshot().revision,lease:'request',seq:1,hands:[{x:pose.x-0.25,y:0.4,z:pose.z},{x:pose.x+0.25,y:0.4,z:pose.z}],pose:{...pose}};return {objects,command};}
test('objets : deux mains, schéma strict, propriétaire, séquences et exclusion mutuelle',()=>{
  const {objects,command}=fixture();assert.deepEqual(parseObjectCommand(command),command);assert.throws(()=>parseObjectCommand({...command,extra:1}));assert.throws(()=>parseObjectCommand({...command,pose:{...command.pose,yaw:Infinity}}));assert.throws(()=>parseObjectCommand({...command,target:'unknown'}));
  assert.equal(objects.act({...command,hands:[command.hands[0]]},'a',room,1000,'lease').changed,false);
  assert.equal(objects.act(command,'a',room,1000,'lease').changed,true);assert.equal(objects.act({...command,revision:objects.snapshot().revision},'b',room,1000,'other').changed,false);
  const move={...command,action:'move' as const,lease:'lease',seq:2,pose:{...command.pose,y:0.3}};
  assert.equal(objects.act(move,'b',room,1100,'unused').changed,false);assert.equal(objects.act(move,'a',room,1100,'unused').changed,true);assert.equal(objects.act(move,'a',room,1200,'unused').changed,false);
  assert.equal(objects.snapshot().poses.chest!.y,0.3);assert.equal(objects.act({...move,action:'drop',seq:3},'a',room,1300,'unused').changed,true);assert.equal(objects.snapshot().held.length,0);
});
test('objets : expiration et déconnexion annulent la prise, poses déposées conservées',()=>{
  const {objects,command}=fixture();objects.act(command,'a',room,1000,'lease');objects.act({...command,action:'move',lease:'lease',seq:2,pose:{...command.pose,y:0.4}},'a',room,1100,'unused');assert.equal(objects.maintain(['a'],5100),true);assert.deepEqual(objects.snapshot().poses.chest,command.pose);
  objects.act({...command,revision:objects.snapshot().revision},'a',room,6000,'again');assert.equal(objects.maintain([],6001),true);assert.equal(objects.snapshot().held.length,0);
});
test('objets : bornes, vitesse et invalidation après changement de pièce',()=>{
  const {objects,command}=fixture();objects.act(command,'a',room,1000,'lease');for(const pose of [{...command.pose,y:3},{...command.pose,x:-1},{...command.pose,x:command.pose.x+1}])assert.equal(objects.act({...command,action:'move',lease:'lease',seq:2,pose},'a',room,1100,'unused').changed,false);
  const before=objects.snapshot();objects.configure(room,0);assert.deepEqual(objects.snapshot(),before);objects.configure(room,1);assert.equal(objects.snapshot().held.length,0);assert.ok(objects.snapshot().revision>before.revision);
});
test('poses persistantes : anciens modèles, hauteur et rotation validées',()=>{
  const copy=parseRoom({...room,puzzles:{...room.puzzles,poses:{chest:{y:0.7,yaw:1.2}}}});assert.deepEqual(copy.puzzles!.poses!.chest,{y:0.7,yaw:1.2});assert.equal(parseRoom(room).puzzles!.poses,undefined);
  assert.throws(()=>parseRoom({...room,puzzles:{...room.puzzles,poses:{chest:{y:NaN,yaw:0}}}}));assert.throws(()=>parseRoom({...room,puzzles:{...room.puzzles,poses:{bad:{y:0,yaw:0}}}}));
});
test('prise : déplacement rigide une/deux mains sans mise à échelle',()=>{
  const hand=(side:'left'|'right',x:number,z:number):GrabHand=>({side,position:new THREE.Vector3(x,1,z),pressed:true,yaw:0});
  const a=[hand('left',-0.3,0),hand('right',0.3,0)],b=[hand('left',0,-0.3),hand('right',0,0.3)],pose=gripTransform(a,b,{x:1,y:0,z:0,yaw:0});assert.ok(Math.abs(pose.x)<1e-8);assert.ok(Math.abs(pose.z-1)<1e-8);assert.ok(Math.abs(pose.yaw+Math.PI/2)<1e-8);
  assert.throws(()=>gripTransform(a,[b[0]],{x:0,y:0,z:0,yaw:0}));const moved=gripTransform([a[0]],[{...a[0],position:a[0].position.clone().add(new THREE.Vector3(1,0.4,2))}],{x:0,y:0,z:0,yaw:0});assert.ok(Math.abs(moved.y-0.4)<1e-8);assert.equal(moved.x,1);assert.equal(moved.z,2);
});
test('mains : pince avec hystérésis, perte de suivi et poignée contrôleur',()=>{
  const input=new GrabInputs(),thumb={},index={},hand={handedness:'left',hand:new Map([['thumb-tip',thumb],['index-finger-tip',index]])} as any;
  let gap=0.02,tracked=true;const frame={getJointPose:(joint:unknown)=>tracked?{transform:{position:{x:joint===thumb?0:gap,y:1,z:0},orientation:{x:0,y:0,z:0,w:1}}}:null} as any;
  const calibration={origin:new THREE.Vector3(),yaw:0,distance:1};assert.equal(input.read(frame,{} as any,[hand] as any,calibration)[0].pressed,true);gap=0.035;assert.equal(input.read(frame,{} as any,[hand] as any,calibration)[0].pressed,true);gap=0.05;assert.equal(input.read(frame,{} as any,[hand] as any,calibration)[0].pressed,false);tracked=false;assert.equal(input.read(frame,{} as any,[hand] as any,calibration).length,0);
  const controller={handedness:'right',gripSpace:{},gamepad:{buttons:[{pressed:true},{pressed:false}]}} as any,controllerFrame={getPose:()=>({transform:{position:{x:0,y:1,z:0},orientation:{x:0,y:0,z:0,w:1}}})} as any;
  assert.equal(input.read(controllerFrame,{} as any,[controller] as any,calibration)[0].pressed,false);input.squeeze(controller,true);assert.equal(input.read(controllerFrame,{} as any,[controller] as any,calibration)[0].pressed,true);input.squeeze(controller,false);controller.gamepad.buttons[1].pressed=true;assert.equal(input.read(controllerFrame,{} as any,[controller] as any,calibration)[0].pressed,true);
});
test('contrôleur : pas de prise lourde à une main, deux mains puis pose stable',()=>{
  const sent:ObjectCommand[]=[],group=new THREE.Group(),chest=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.5,0.6));group.add(chest);group.userData.grabbables={chest};const snapshot={revision:1,poses:{chest:{x:0,y:0,z:0,yaw:0}},held:[] as any[]};const grab=new ObjectGrabber(()=> 'a',()=>snapshot,c=>{sent.push(c);return true;},()=>{});
  const left:GrabHand={side:'left',position:new THREE.Vector3(-0.2,0.2,0),pressed:true,yaw:0},right:GrabHand={...left,side:'right',position:new THREE.Vector3(0.2,0.2,0)};
  grab.update(group,[left],true,100);assert.equal(sent.length,0);grab.update(group,[left,right],true,200);assert.equal(sent[0].action,'grab');snapshot.held=[{target:'chest',owner:'a',lease:'lease',expiresAt:5000}];
  grab.update(group,[{...left,position:left.position.clone().add(new THREE.Vector3(0,0.3,0))},{...right,position:right.position.clone().add(new THREE.Vector3(0,0.3,0))}],true,500);assert.equal(sent[1].action,'move');assert.ok(Math.abs(sent[1].pose.y-0.3)<1e-8);
  grab.update(group,[{...left,pressed:false},right],true,600);assert.equal(sent[2].action,'drop');assert.equal(sent[2].hands.length,2);
});
test('indice sous coffre : visible seulement après levée ou déplacement',()=>{const group=new THREE.Group(),chest=new THREE.Group(),clue=new THREE.Mesh();group.userData.underChest={chest,clue,base:new THREE.Vector3()};animateAdventure(group,0);assert.equal(clue.visible,false);chest.position.y=0.3;animateAdventure(group,0);assert.equal(clue.visible,true);chest.position.set(0,0,0);animateAdventure(group,0);assert.equal(clue.visible,false);chest.position.x=0.5;animateAdventure(group,0);assert.equal(clue.visible,true);});
test('carte en main : verrou existant puis dépôt magnétique sans prise de table',()=>{
  const group=new THREE.Group(),table=new THREE.Group(),card=new THREE.Mesh(new THREE.BoxGeometry(0.19,0.008,0.27)),slot=new THREE.Object3D();group.add(table);table.add(card,slot);card.position.set(0,0.785,-0.27);card.userData.hybridCard='AD';slot.userData.hybridSlot=0;slot.position.set(-0.26,0.785,0.12);
  const actions:any[]=[],input=new HandCards(()=> 'me',action=>actions.push(action),()=>{}),state={round:2,status:'playing',slots:[null,null,null],locks:[]} as any;
  const hand:GrabHand={side:'left',position:card.position.clone(),pressed:true,yaw:0};input.update(group,[hand],state,true,100);assert.deepEqual(actions[0],{action:'pick_card',card:'AD'});
  state.locks=[{card:'AD',owner:'me',expiresAt:15000}];input.update(group,[{...hand,position:slot.position.clone()}],state,true,200);input.update(group,[{...hand,position:slot.position.clone(),pressed:false}],state,true,300);assert.deepEqual(actions[1],{action:'drop_card',slot:0});
});
