import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { WebSocket } from 'ws';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { placementPose } from '../../client/src/library/xr-library-placement.js';
import { OBJECT_CATALOG,parseRoomObjects,type RoomObject } from './object-library.js';
import { parseRoom,type RoomModel,suggestPuzzleLayout } from './scene-schema.js';
import { ObjectManipulation,parseObjectCommand,type ObjectCommand } from './object-manipulation.js';
import { editRoomObjects } from './object-library-commands.js';
import { RoomStore } from './room-store.js';
import { Room } from './room.js';
import { ObjectGrabber,type GrabHand } from '../../client/src/object-grab.js';
import { applyObjectPoses } from '../../client/src/adventure-view.js';

const base:RoomModel={id:'library',name:'Library',height:2.8,floor:[{x:0,z:0},{x:8,z:0},{x:8,z:8},{x:0,z:8}],obstacles:[],openings:[]};
const table:RoomObject={id:'table-a',asset:'kenney-table',name:'Table',movable:true,pose:{x:4,y:0,z:4,yaw:0,scale:1}};
const fixture=()=>parseRoom({...base,objects:{version:1,items:[table]}});

test('library schema: legacy rooms unchanged, strict versions, assets, IDs, dimensions and wall bounds',()=>{
  assert.equal(parseRoom(base).objects,undefined);
  const model=fixture();assert.deepEqual(model.objects!.items,[table]);
  const data=model.objects!;
  for(const bad of [{...data,version:2},{...data,extra:true},{version:1,items:[table,table]},
    {version:1,items:[{...table,asset:'https://evil/model.glb'}]},
    {version:1,items:[{...table,movable:'yes'}]},
    {version:1,items:[{...table,pose:{...table.pose,scale:NaN}}]},
    {version:1,items:[{...table,pose:{...table.pose,scale:4}}]},
    {version:1,items:[{...table,script:'bad'}]},
  ])assert.throws(()=>parseRoomObjects(bad));
  assert.throws(()=>parseRoom({...base,objects:{version:1,items:[{...table,pose:{...table.pose,x:.1}}]}}));
  assert.throws(()=>parseRoom({...base,objects:{version:1,items:[{...table,pose:{...table.pose,y:2.5}}]}}));
});

test('library authoring: atomic disk round trip, live poses saved, stale/held commands refused, old room preserved',()=>{
  const directory=mkdtempSync(join(tmpdir(),'myroom-library-'));
  try{
    const store=new RoomStore(directory);store.change('save',0,{...base,id:'legacy'});store.change('save',1,fixture());
    const objects=new ObjectManipulation();objects.configure(store.active(),0);
    let snapshot=objects.snapshot();snapshot.poses['prop:table-a']!.y=.2;
    const added=editRoomObjects(store.active()!,{action:'add',asset:'kenney-books',revision:2,objectRevision:snapshot.revision},snapshot);
    assert.equal(added.objects!.items.length,2);assert.equal(added.objects!.items[0].pose.y,.2);
    store.change('save',2,added);const restored=new RoomStore(directory).snapshot();
    assert.equal(restored.rooms.length,2);assert.deepEqual(restored.rooms.find(room=>room.id==='legacy'),{...base,id:'legacy'});
    assert.deepEqual(restored.rooms.find(room=>room.id==='library')!.objects,added.objects);
    assert.throws(()=>editRoomObjects(added,{action:'save',revision:3,objectRevision:-1},snapshot));
    assert.throws(()=>editRoomObjects(added,{action:'save',revision:3,objectRevision:snapshot.revision},{...snapshot,held:[{target:'prop:table-a',owner:'a',lease:'x',expiresAt:9}]}));
    assert.throws(()=>editRoomObjects(added,{action:'save',revision:3,objectRevision:snapshot.revision,extra:true},snapshot));
    const removed=editRoomObjects(added,{action:'remove',id:'table-a',revision:3,objectRevision:snapshot.revision},snapshot);
    assert.equal(removed.objects!.items.length,1);
  }finally{rmSync(directory,{recursive:true,force:true});}
});

test('headset placement: ray intersects chosen height, rejects distant/backwards/parallel rays',()=>{
  const choice={asset:'kenney-books',height:.75,yaw:.4,scale:1.2};
  const pose=placementPose(new THREE.Vector3(4,1.75,4),new THREE.Vector3(0,-1,0),choice);
  assert.deepEqual(pose,{x:4,y:.75,z:4,yaw:.4,scale:1.2});
  assert.equal(placementPose(new THREE.Vector3(4,1.75,4),new THREE.Vector3(0,1,0),choice),undefined);
  assert.equal(placementPose(new THREE.Vector3(4,1.75,4),new THREE.Vector3(1,0,0),choice),undefined);
  assert.equal(placementPose(new THREE.Vector3(4,10,4),new THREE.Vector3(0,-1,0),choice),undefined);
  assert.equal(placementPose(new THREE.Vector3(NaN,1,4),new THREE.Vector3(0,-1,0),choice),undefined);
});

test('headset authoring: explicit pose persists, validates bounds and does not change legacy auto placement',()=>{
  const model=fixture(),objects=new ObjectManipulation();objects.configure(model,0);
  const snapshot=objects.snapshot(),command={action:'add',asset:'kenney-books',revision:0,objectRevision:snapshot.revision};
  const pose={x:2,y:.75,z:2,yaw:.4,scale:.8};
  const placed=editRoomObjects(model,{...command,pose},snapshot);
  assert.deepEqual(placed.objects!.items.at(-1)!.pose,pose);
  assert.deepEqual(model,fixture());
  assert.equal(editRoomObjects(model,command,snapshot).objects!.items.length,2);
  for(const invalid of [{...pose,x:-10},{...pose,y:10},{...pose,x:NaN},{...pose,scale:0},{...pose,extra:1},{...pose,yaw:Infinity}])assert.throws(()=>editRoomObjects(model,{...command,pose:invalid},snapshot));
  assert.throws(()=>editRoomObjects(model,{...command,pose,objectRevision:-1},snapshot));
  assert.throws(()=>editRoomObjects(model,{...command,pose},{...snapshot,held:[{target:'prop:table-a',owner:'a',lease:'x',expiresAt:9}]}));
  const directory=mkdtempSync(join(tmpdir(),'myroom-headset-placement-'));
  try{const store=new RoomStore(directory);store.change('save',0,placed);assert.deepEqual(new RoomStore(directory).active()!.objects,placed.objects);}finally{rmSync(directory,{recursive:true,force:true});}
});

test('library interaction: server enforces fixed/two hands, leases, stale/duplicate actions, bounds, resizing and disconnect',()=>{
  const room=fixture(),objects=new ObjectManipulation();objects.configure(room,0);
  const pose=objects.snapshot().poses['prop:table-a']!;
  const c:ObjectCommand={type:'object_action',action:'grab',target:'prop:table-a',revision:objects.snapshot().revision,lease:'request',seq:1,hands:[{x:3.7,y:.4,z:4},{x:4.3,y:.4,z:4}],pose};
  assert.deepEqual(parseObjectCommand(c),c);assert.throws(()=>parseObjectCommand({...c,target:'prop:../../file'}));
  assert.equal(objects.act({...c,hands:[c.hands[0]]},'a',room,0,'one').changed,false);
  assert.equal(objects.act(c,'a',room,0,'one').changed,true);
  assert.equal(objects.act({...c,revision:objects.snapshot().revision},'b',room,0,'two').changed,false);
  const move={...c,action:'move' as const,lease:'one',seq:2,pose:{...pose,scale:1.2,y:.2}};
  assert.equal(objects.act(move,'b',room,1,'unused').changed,false);
  assert.equal(objects.act(move,'a',room,1,'unused').changed,true);
  assert.equal(objects.act(move,'a',room,2,'unused').changed,false);
  assert.equal(objects.snapshot().poses['prop:table-a']!.scale,1.2);
  assert.equal(objects.act({...move,seq:3,pose:{...move.pose,scale:3}},'a',room,3,'unused').changed,false);
  assert.equal(objects.maintain([],4),true);assert.deepEqual(objects.snapshot().poses['prop:table-a'],pose);
  const again={...c,revision:objects.snapshot().revision};assert.equal(objects.act(again,'a',room,5,'again').changed,true);
  assert.equal(objects.act({...move,lease:'again',seq:2},'a',room,6,'unused').changed,true);
  assert.equal(objects.act({...move,lease:'again',action:'drop',seq:3},'a',room,7,'unused').changed,true);
  assert.equal(objects.snapshot().poses['prop:table-a']!.y,0,'un objet de bibliothèque relâché tombe au sol');
  objects.configure(room,1,{staff1:{x:1,y:0,z:1,yaw:0}});
  assert.equal(objects.snapshot().poses['prop:table-a']!.scale,1.2,'portal/scene transitions preserve room furniture');
  const fixed=parseRoom({...room,objects:{version:1,items:[{...table,movable:false}]}});objects.configure(fixed,0);
  assert.equal(objects.act({...c,revision:objects.snapshot().revision},'a',fixed,5,'three').changed,false);
});

test('two-hand client resize agrees with authoritative poses and keeps legacy objects unchanged',()=>{
  const model=fixture(),objects=new ObjectManipulation();objects.configure(model,0);const group=new THREE.Group(),node=new THREE.Mesh(new THREE.BoxGeometry(1.94,.75,1.03));node.geometry.translate(0,.375,0);node.position.set(4,0,4);group.add(node);group.userData.grabbables={'prop:table-a':node};
  const grabber=new ObjectGrabber(()=>'a',()=>objects.snapshot(),c=>{const result=objects.act(c,'a',model,1,'lease');assert.equal(result.changed,true,result.message);return true;},()=>{});
  const hands:GrabHand[]=[{side:'left',position:new THREE.Vector3(3.7,.4,4),pressed:true,yaw:0},{side:'right',position:new THREE.Vector3(4.3,.4,4),pressed:true,yaw:0}];
  grabber.update(group,hands,true,0);
  const stretched=hands.map(hand=>({...hand,position:new THREE.Vector3(hand.side==='left'?3.64:4.36,.4,4)}));
  grabber.update(group,stretched,true,250);assert.ok(Math.abs(objects.snapshot().poses['prop:table-a']!.scale!-1.2)<1e-8);
  applyObjectPoses(group,objects.snapshot());assert.ok(Math.abs(node.scale.x-1.2)<1e-8);
  grabber.update(group,stretched.map(hand=>({...hand,pressed:false})),true,500);assert.equal(objects.snapshot().held.length,0);
  node.visible=false;grabber.update(group,hands,true,1200);assert.equal(objects.snapshot().held.length,0,'hidden corridor furniture cannot be grabbed');
});

test('changing only library objects preserves adventure and portal progress',()=>{
  const model=fixture();model.puzzles=suggestPuzzleLayout(model,()=>.3);
  const room=new Room();room.model=model;room.snapshot();room.adventure.setTestMode(true);room.adventure.start();
  const before=room.adventure.snapshot();const portal=room.portal.snapshot().revision;
  room.model=parseRoom({...model,objects:{version:1,items:[]}});const after=room.snapshot();
  assert.equal(after.adventure.revision,before.revision);assert.equal(after.adventure.running,true);assert.equal(after.portal.revision,portal);
});

test('all CC0 models are local, self-contained GLB files with expected physical bounds',async()=>{
  const license=readFileSync(new URL('../../client/public/models/library/kenney-furniture/License.txt',import.meta.url),'utf8');assert.match(license,/Creative Commons Zero, CC0/);
  for(const asset of OBJECT_CATALOG.assets){
    const file=readFileSync(new URL('../../client/public'+asset.model,import.meta.url));assert.equal(file.readUInt32LE(0),0x46546c67);
    const json=JSON.parse(file.toString('utf8',20,20+file.readUInt32LE(12)));
    assert.ok((json.buffers??[]).every((buffer:any)=>!buffer.uri));assert.ok((json.images??[]).every((image:any)=>!image.uri));
    const gltf=await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'');
    const size=new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3()),factor=asset.size.height/size.y;
    assert.ok(size.x*factor<=asset.size.width+1e-5,asset.id+' width');assert.ok(size.z*factor<=asset.size.depth+1e-5,asset.id+' depth');
  }
});

test('library network: protected authoring, shared poses, concurrent refusal and persisted restart', {timeout:35000},async()=>{
  const directory=mkdtempSync(join(tmpdir(),'myroom-library-net-')),clients:WebSocket[]=[];
  const child=spawn(process.execPath,['--import','tsx','src/index.ts'],{cwd:new URL('..',import.meta.url),env:{...process.env,DATA_DIR:directory,PORT:'13026',PUBLIC_ORIGIN:'https://myroom.test',ADMIN_TOKEN:'library-network-test-token'},stdio:['ignore','pipe','pipe']});
  const baseURL='http://localhost:13026/api/admin/',headers={Authorization:'Bearer library-network-test-token',Origin:'https://myroom.test','Content-Type':'application/json'};
  const state=async()=>await(await fetch(baseURL+'state',{headers})).json();
  const post=(path:string,body:unknown,auth=true)=>fetch(baseURL+path,{method:'POST',headers:auth?headers:{...headers,Authorization:''},body:JSON.stringify(body)});
  function wait(ws:WebSocket,type:string){return new Promise<any>((resolve,reject)=>{const timer=setTimeout(()=>{ws.off('message',receive);reject(Error('Timeout '+type));},5000);function receive(raw:unknown){const message=JSON.parse(String(raw));if(message.type===type){clearTimeout(timer);ws.off('message',receive);resolve(message);}}ws.on('message',receive);});}
  async function send(index:number,body:unknown){const result=wait(clients[index],'object_result');clients[index].send(JSON.stringify(body));return result;}
  try{
    await once(child.stdout!,'data');
    for(let i=0;i<2;i++){const ws=new WebSocket('ws://localhost:13026/ws',{origin:'https://myroom.test'});clients.push(ws);const welcome=wait(ws,'welcome');await once(ws,'open');await welcome;}
    assert.equal((await post('rooms/save',{revision:0,room:base})).status,200);
    let s=await state();const add={action:'add',asset:'kenney-table',revision:s.library.revision,objectRevision:s.adventure.objects.revision};
    assert.equal((await post('rooms/objects',add,false)).status,401);assert.equal((await post('rooms/objects',add)).status,200);
    assert.equal((await post('rooms/objects',add)).status,400);
    s=await state();const explicit={...add,asset:'kenney-books',revision:s.library.revision,objectRevision:s.adventure.objects.revision,pose:{x:2,y:.75,z:2,yaw:.3,scale:1}};
    assert.equal((await post('rooms/objects',explicit,false)).status,401);
    assert.equal((await post('rooms/objects',explicit)).status,200);
    assert.equal((await post('rooms/objects',explicit)).status,400);
    s=await state();assert.deepEqual(s.library.rooms[0].objects.items[1].pose,explicit.pose);
    assert.equal((await post('rooms/objects',{...explicit,revision:s.library.revision,objectRevision:s.adventure.objects.revision,pose:{...explicit.pose,x:-10}})).status,400);
    s=await state();const item=s.library.rooms[0].objects.items[0],target=`prop:${item.id}`,pose=s.adventure.objects.poses[target];
    const command={type:'object_action',action:'grab',target,revision:s.adventure.objects.revision,lease:'request',seq:1,hands:[{x:pose.x-.25,y:.4,z:pose.z},{x:pose.x+.25,y:.4,z:pose.z}],pose};
    const shared=wait(clients[1],'state');assert.equal((await send(0,command)).changed,true);assert.equal((await shared).adventure.objects.held.length,1);
    s=await state();assert.equal((await send(1,{...command,revision:s.adventure.objects.revision})).changed,false);
    assert.equal((await post('rooms/objects',{action:'save',revision:s.library.revision,objectRevision:s.adventure.objects.revision})).status,400);
    const lease=s.adventure.objects.held[0].lease;
    const moved={...command,action:'move',seq:2,lease,pose:{...pose,y:.15,scale:1.1}};
    assert.equal((await send(0,moved)).changed,true);assert.equal((await send(0,{...moved,action:'drop',seq:3})).changed,true);
    s=await state();assert.equal((await post('rooms/objects',{action:'save',revision:s.library.revision,objectRevision:s.adventure.objects.revision})).status,200);
    const restored=new RoomStore(directory).active()!;assert.equal(restored.objects!.items[0].pose.y,0);assert.equal(restored.objects!.items[0].pose.scale,1.1);
  }finally{for(const ws of clients)ws.terminate();child.kill();if(child.exitCode===null)await once(child,'exit');rmSync(directory,{recursive:true,force:true});}
});
