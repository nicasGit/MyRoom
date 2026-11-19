import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,writeFileSync,readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DisplayModes,parseModeCommand,parseModePolicy,parseCapabilities,type DisplayMode } from './display-modes.js';
import { CameraStream } from '../../client/src/modes/camera-stream.js';
import { Virtual3D,CameraAR,QuestWebXR } from '../../client/src/modes/adapters.js';
import { canStand,roomStart } from '../../client/src/modes/navigation.js';
import { DisplayClient } from '../../client/src/modes/display-client.js';
const caps={webgl:true,webxr:true,immersiveAR:true,camera:true,touch:true,secureContext:true};
const hello=(manager:DisplayModes,id:string)=>manager.act(id,{type:'display_mode',action:'hello',requestId:id,capabilities:caps});
const change=(manager:DisplayModes,id:string,mode:DisplayMode)=>manager.act(id,{type:'display_mode',action:'change',requestId:id,mode});
test('virtual navigation starts inside concave rooms and avoids furniture',()=>{
  const room={id:'concave',name:'Concave',height:2.5,floor:[{x:0,z:0},{x:4,z:0},{x:4,z:1},{x:1,z:1},{x:1,z:4},{x:0,z:4}],obstacles:[{name:'Desk',x:.5,z:.5,width:.5,depth:.5,height:1}],openings:[]};
  assert.equal(canStand(room,2,2),false);assert.equal(canStand(room,.5,.5),false);const start=roomStart(room);assert.ok(start);assert.equal(canStand(room,start.x,start.z),true);
});
test('display policy: persistence, stale writes and defaults apply only to future clients',()=>{
  const directory=mkdtempSync(join(tmpdir(),'myroom-modes-'));
  try{const modes=new DisplayModes(directory);assert.equal(hello(modes,'one').mode,'virtual-3d');
    modes.configure({...modes.snapshot(),cameraAREnabled:true,defaultMode:'camera-ar'});
    assert.equal(modes.mode('one'),'virtual-3d');assert.equal(hello(modes,'two').mode,'camera-ar');
    assert.throws(()=>modes.configure({...modes.snapshot(),revision:0}));
    assert.deepEqual(new DisplayModes(directory).snapshot(),modes.snapshot());
    writeFileSync(join(directory,'display-modes.json'),'{}');assert.throws(()=>new DisplayModes(directory));
    assert.equal(readFileSync(join(directory,'display-modes.json'),'utf8'),'{}');
  }finally{rmSync(directory,{recursive:true,force:true});}
});
test('display policy: mixed clients, permissions, fallback and legacy Quest compatibility',()=>{
  const modes=new DisplayModes();hello(modes,'virtual');hello(modes,'quest');hello(modes,'camera');
  assert.throws(()=>change(modes,'camera','camera-ar'));
  modes.configure({...modes.snapshot(),cameraAREnabled:true});change(modes,'camera','camera-ar');change(modes,'quest','quest-webxr');
  assert.deepEqual(modes.clients().map(c=>c.mode),['virtual-3d','quest-webxr','camera-ar']);
  modes.configure({...modes.snapshot(),allowPlayerChange:false,cameraAREnabled:false});
  assert.equal(modes.mode('camera'),'camera-ar');assert.throws(()=>change(modes,'virtual','quest-webxr'));
  modes.act('camera',{type:'display_mode',action:'fallback',reason:'camera-failed',requestId:'fallback'});
  assert.equal(modes.mode('camera'),'virtual-3d');assert.equal(modes.mode('old-client'),'quest-webxr');
  const snapshot=modes.clients();snapshot[0].capabilities.camera=false;assert.equal(modes.clients()[0].capabilities.camera,true);
  modes.remove('camera');assert.equal(modes.clients().length,2);
});
test('display protocol: strict input and unavailable capabilities',()=>{
  assert.throws(()=>parseCapabilities({...caps,camera:'true'}));assert.throws(()=>parseCapabilities({...caps,extra:true}));
  assert.throws(()=>parseModePolicy({version:1,revision:0,defaultMode:'camera-ar',allowPlayerChange:true,cameraAREnabled:false}));
  assert.throws(()=>parseModeCommand({type:'display_mode',action:'change',requestId:'x',mode:'camera-ar',capabilities:caps}));
  const modes=new DisplayModes();modes.configure({...modes.snapshot(),defaultMode:'quest-webxr'});
  assert.equal(modes.act('ipad',{type:'display_mode',action:'hello',requestId:'ipad',capabilities:{...caps,webxr:false,immersiveAR:false}}).mode,'virtual-3d');
  assert.throws(()=>change(modes,'ipad','quest-webxr'));
});
function fakeCamera(){
  const track=new EventTarget() as EventTarget&{stop:()=>void};let stopped=0;track.stop=()=>{stopped++;};
  const stream={getTracks:()=>[track],getVideoTracks:()=>[track]} as unknown as MediaStream;
  const video={muted:false,playsInline:false,srcObject:null as MediaStream|null,play:async()=>{},pause:()=>{}};
  return {track,stream,video,stopped:()=>stopped};
}
test('camera: permission only on activation, inline muted video, complete cleanup and track loss',async()=>{
  const fake=fakeCamera();let acquired=0,ended=0;
  const camera=new CameraStream(fake.video,async constraints=>{acquired++;assert.equal(constraints.audio,false);return fake.stream;},()=>ended++);
  assert.equal(acquired,0);assert.equal(fake.video.muted,true);assert.equal(fake.video.playsInline,true);
  assert.equal(await camera.start(),true);assert.equal(fake.video.srcObject,fake.stream);
  fake.track.dispatchEvent(new Event('ended'));assert.equal(ended,1);assert.equal(fake.video.srcObject,null);assert.equal(fake.stopped(),1);
  camera.stop();assert.equal(fake.stopped(),1);
});
test('camera: refusal, playback failure and late permission result cannot leak streams',async()=>{
  const fake=fakeCamera();await assert.rejects(new CameraStream(fake.video,async()=>{throw Error('NotAllowedError');}).start());
  let resolve!:(stream:MediaStream)=>void;const pending=new Promise<MediaStream>(r=>resolve=r),camera=new CameraStream(fake.video,()=>pending);
  const starting=camera.start();camera.stop();resolve(fake.stream);assert.equal(await starting,false);assert.equal(fake.stopped(),1);assert.equal(fake.video.srcObject,null);
  const broken=fakeCamera();broken.video.play=async()=>{throw Error('play refused');};
  await assert.rejects(new CameraStream(broken.video,async()=>broken.stream).start());assert.equal(broken.stopped(),1);assert.equal(broken.video.srcObject,null);
});
test('display adapters share the scene and retain the existing native XR lifecycle',async()=>{
  const events:string[]=[];const scene={start:(camera:boolean)=>events.push(camera?'camera':'virtual'),stop:()=>{events.push('stop');},recenter:()=>{events.push('center');}};
  const virtual=new Virtual3D(scene);await virtual.start();virtual.recenter();await virtual.stop();
  const fake=fakeCamera(),camera=new CameraAR(scene,fake.video as unknown as HTMLVideoElement,async()=>fake.stream);
  await camera.start();await camera.stop();assert.equal(fake.stopped(),1);
  const quest=new QuestWebXR(async()=>{events.push('native-start');},async()=>{events.push('native-end');},()=>{events.push('native-center');});
  await quest.start();quest.recenter();await quest.stop();
  assert.deepEqual(events,['virtual','center','stop','camera','stop','native-start','native-center','native-end']);
});
test('display client: mode selection never asks permission; activating and leaving Quest closes native XR',async()=>{
  class Element {
    options:Element[]=[];value='';textContent='';disabled=false;hidden=false;className='';
    setAttribute(){} append(...children:Element[]){this.options.push(...children);} prepend(){} querySelector(){return null;}
  }
  const oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document'),oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window');
  Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:()=>new Element(),addEventListener(){}}});
  Object.defineProperty(globalThis,'window',{configurable:true,value:{addEventListener(){}}});
  try{
    const events:string[]=[],commands:unknown[]=[];
    const adapter=(id:DisplayMode)=>({id,async start(){events.push(id+':start');},async stop(){events.push(id+':stop');},recenter(){}});
    const client=new DisplayClient(new Element() as unknown as HTMLElement,{'virtual-3d':adapter('virtual-3d'),'camera-ar':adapter('camera-ar'),'quest-webxr':adapter('quest-webxr')},command=>{commands.push(command);return true;},()=>{});
    const policy={version:1 as const,revision:0,defaultMode:'virtual-3d' as const,allowPlayerChange:true,cameraAREnabled:true};
    client.receive({accepted:true,mode:'virtual-3d',policy});await new Promise(setImmediate);
    client.receive({accepted:true,mode:'camera-ar',policy});await new Promise(setImmediate);
    assert.equal(events.includes('camera-ar:start'),false);
    client.receive({accepted:true,mode:'quest-webxr',policy});await new Promise(setImmediate);await client.activate();
    assert.equal(events.includes('quest-webxr:start'),true);
    client.receive({accepted:true,mode:'virtual-3d',policy});await new Promise(setImmediate);
    assert.equal(events.includes('quest-webxr:stop'),true);
    client.fallback('camera-failed');await new Promise(setImmediate);assert.equal(client.current,'virtual-3d');assert.equal(commands.length,1);
  }finally{
    if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else Reflect.deleteProperty(globalThis,'document');
    if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else Reflect.deleteProperty(globalThis,'window');
  }
});
