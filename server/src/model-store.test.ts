import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { inspectGlb,MAX_GLB_BYTES } from './glb-validation.js';
import { ModelStore } from './model-store.js';
import { libraryAsset,importedCatalog,setImportedCatalog } from './object-library.js';
import { parseRoom,type RoomModel } from './scene-schema.js';
import { editRoomObjects } from './object-library-commands.js';
import { ObjectManipulation } from './object-manipulation.js';
import { RoomStore } from './room-store.js';
import { atomicRename } from './atomic-file.js';

test('atomic rename retries only transient Windows locks and preserves persistent errors',()=>{
  let attempts=0,pauses=0;const locked=Object.assign(Error('locked'),{code:'EPERM'});
  atomicRename('source','target',()=>{if(++attempts<3)throw locked;},true,()=>{pauses++;});assert.equal(attempts,3);assert.equal(pauses,2);
  attempts=0;assert.throws(()=>atomicRename('source','target',()=>{attempts++;throw locked;},true,()=>{}));assert.equal(attempts,5);
  attempts=0;assert.throws(()=>atomicRename('source','target',()=>{attempts++;throw locked;},false,()=>{}));assert.equal(attempts,1);
  assert.throws(()=>atomicRename('source','target',()=>{throw Object.assign(Error('disk'),{code:'ENOSPC'});},true,()=>assert.fail('must not retry disk errors')));
});

const file=(name='table')=>readFileSync(new URL(`../../client/public/models/library/kenney-furniture/${name}.glb`,import.meta.url));
const metadata={source:'https://kenney.nl/assets/furniture-kit',license:'CC0-1.0',rightsConfirmed:true};
function modify(input:Buffer,mutate:(gltf:any)=>void){const size=input.readUInt32LE(12),gltf=JSON.parse(input.toString('utf8',20,20+size));mutate(gltf);const json=Buffer.from(JSON.stringify(gltf)),padding=Buffer.alloc((4-json.length%4)%4,32),bin=input.subarray(20+size),header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(20+json.length+padding.length+bin.length,8);header.writeUInt32LE(json.length+padding.length,12);header.writeUInt32LE(0x4e4f534a,16);return Buffer.concat([header,json,padding,bin]);}
const model:RoomModel={id:'import-room',name:'Import',floor:[{x:0,z:0},{x:8,z:0},{x:8,z:8},{x:0,z:8}],height:3,obstacles:[],openings:[]};

test('GLB validation accepts the eight packaged models and bounds source geometry',()=>{
  for(const name of ['table','chair','desk','bedSingle','bookcaseClosedDoors','lampRoundTable','books','plantSmall1']){const info=inspectGlb(file(name));assert.ok(info.vertices>0&&info.vertices<=100000);assert.ok(info.size.height>0);}
  const size=inspectGlb(file()).size;assert.ok(Math.abs(size.height-.326733977)<.001);
});
test('GLB rejects external files, excessive geometry, cycles, unsafe extensions and corrupt binary structure',()=>{
  const original=file();
  const corruptions=[(g:any)=>{g.accessors[g.meshes[0].primitives[0].attributes.POSITION].min=[-1e90,-1e90,-1e90];},(g:any)=>{g.bufferViews[0].byteOffset=1;},(g:any)=>{g.buffers[0].uri='https://other/data.bin';},(g:any)=>{g.images=[{uri:'data:image/png;base64,abc'}];},(g:any)=>{g.accessors[0].count=99999999;},(g:any)=>{g.nodes[0].children=[0];},(g:any)=>{g.nodes.push({children:[g.nodes.length]});},(g:any)=>{g.extensionsUsed=['KHR_draco_mesh_compression'];},(g:any)=>{g.bufferViews[0].byteLength=MAX_GLB_BYTES;},(g:any)=>{g.animations=[{}];},(g:any)=>{g.nodes[0].matrix=Array(16).fill(0);},(g:any)=>{g.meshes[0].primitives[0].attributes.POSITION=9000;}];
  for(const corrupt of corruptions)assert.throws(()=>inspectGlb(modify(original,corrupt)));
  assert.throws(()=>inspectGlb(Buffer.from('not glb')));assert.throws(()=>inspectGlb(Buffer.alloc(MAX_GLB_BYTES+1)));assert.throws(()=>inspectGlb(original.subarray(0,original.length-4)));
});
test('imported catalogue persists immutable files, deduplicates, pins instance versions and restores rooms',()=>{
  const directory=mkdtempSync(join(tmpdir(),'myroom-models-'));
  try{
    const models=new ModelStore(directory);assert.throws(()=>models.import(file(),'table.glb',{...metadata,rightsConfirmed:false},0));
    const first=models.import(file(),'ma table.glb',metadata,0);assert.equal(first.asset.version,1);assert.equal(first.duplicate,false);
    assert.deepEqual(readFileSync(models.publicPath(first.asset.model.split('/').pop()!)!),file());
    assert.equal(models.import(file(),'copie.glb',metadata,1).duplicate,true);assert.equal(models.snapshot().revision,1);
    assert.throws(()=>models.import(file('chair'),'../chair.glb',metadata,1));assert.throws(()=>models.import(file('chair'),'chair.glb',metadata,0));
    const objects=new ObjectManipulation();objects.configure(model,0);const before=editRoomObjects(model,{action:'add',asset:first.asset.id,revision:0,objectRevision:objects.snapshot().revision},objects.snapshot());
    assert.equal(before.objects!.items[0].assetVersion,1);
    const next=models.update({revision:1,asset:{...first.asset,name:'Grande table',size:{width:2,height:1,depth:1},hands:2,defaultMovable:false,defaultYaw:.5}});
    assert.equal(next.version,2);assert.equal(libraryAsset(first.asset.id,1)!.name,'ma table');assert.equal(libraryAsset(first.asset.id)!.name,'Grande table');
    assert.throws(()=>models.update({revision:1,asset:first.asset}));assert.throws(()=>models.update({revision:2,asset:first.asset}));
    const rooms=new RoomStore(directory);rooms.change('save',0,before);
    const savedPose=structuredClone(before.objects!.items[0].pose);new ModelStore(directory);const restored=new RoomStore(directory).active()!;
    assert.deepEqual(restored.objects!.items[0].pose,savedPose);assert.equal(restored.objects!.items[0].assetVersion,1);
    objects.configure(model,0);const after=editRoomObjects(model,{action:'add',asset:first.asset.id,revision:0,objectRevision:objects.snapshot().revision},objects.snapshot());
    assert.equal(after.objects!.items[0].assetVersion,2);assert.equal(after.objects!.items[0].movable,false);assert.equal(after.objects!.items[0].pose.yaw,.5);
    assert.deepEqual(parseRoom(model),model);assert.equal(models.publicPath('../catalog.json'),undefined);
  }finally{setImportedCatalog({revision:0,assets:[]});rmSync(directory,{recursive:true,force:true});}
});

test('model API: authenticated multi-file workflow, per-file failure, public files and metadata updates', {timeout:35000},async()=>{
  const directory=mkdtempSync(join(tmpdir(),'myroom-model-api-'));
  const child=spawn(process.execPath,['--import','tsx','src/index.ts'],{cwd:new URL('..',import.meta.url),env:{...process.env,DATA_DIR:directory,PORT:'13027',PUBLIC_ORIGIN:'https://myroom.test',ADMIN_TOKEN:'model-network-test-token'},stdio:['ignore','pipe','pipe']});
  const base='http://localhost:13027',auth={Authorization:'Bearer model-network-test-token',Origin:'https://myroom.test'};
  const state=async()=>await(await fetch(base+'/api/admin/state',{headers:auth})).json();
  async function upload(path:string,data:Buffer,name:string,revision:number,authorized=true){return fetch(base+'/api/admin/models/'+path,{method:'POST',headers:{...auth,...(!authorized?{Authorization:''}:{}),'Content-Type':'application/octet-stream','X-File-Name':name,'X-Model-Source':encodeURIComponent(metadata.source),'X-Model-License':metadata.license,'X-Model-Rights':'confirmed','X-Catalog-Revision':String(revision)},body:new Uint8Array(data)});}
  try{
    await once(child.stdout!,'data');assert.equal((await upload('import',file(),'table.glb',0,false)).status,401);
    assert.equal((await upload('inspect',file(),'table.glb',0)).status,200);assert.equal((await state()).objectCatalog.assets.length,0,'inspect does not persist');
    const outcomes=[];let revision=0;
    for(const [name,data] of [['table',file()],['broken',Buffer.from('invalid')],['chair',file('chair')]] as const){const response=await upload('import',data,name+'.glb',revision);const result=await response.json();outcomes.push(response.status);if(response.ok)revision=result.revision;}
    assert.deepEqual(outcomes,[200,400,200]);const s=await state();assert.equal(s.objectCatalog.assets.length,2);
    const asset=s.objectCatalog.assets[0],binary=await fetch(base+asset.model);assert.equal(binary.status,200);assert.equal(binary.headers.get('content-type'),'model/gltf-binary');assert.deepEqual(Buffer.from(await binary.arrayBuffer()),file());
    const update=await fetch(base+'/api/admin/models/update',{method:'POST',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify({revision,asset:{...asset,name:'Updated'}})});assert.equal(update.status,200);
    assert.equal((await(await fetch(base+'/api/library/catalog')).json()).assets.length,3);
    const saved=new ModelStore(directory);assert.equal(saved.snapshot().assets.length,3);assert.equal(importedCatalog().revision,3);
  }finally{child.kill();if(child.exitCode===null)await once(child,'exit');setImportedCatalog({revision:0,assets:[]});rmSync(directory,{recursive:true,force:true});}
});
