import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { suggestPuzzleLayout,type RoomModel } from './scene-schema.js';
import { RoomStore } from './room-store.js';
function wait(ws:WebSocket,type:string){return new Promise<any>((resolve,reject)=>{const timer=setTimeout(()=>{ws.off('message',receive);reject(Error('Timeout '+type));},5000);function receive(raw:unknown){const message=JSON.parse(String(raw));if(message.type===type){clearTimeout(timer);ws.off('message',receive);resolve(message);}}ws.on('message',receive);});}
test('prises réseau : déplacement partagé pendant le jeu, progression préservée, sauvegarde protégée', {timeout:20000},async()=>{
  const directory=mkdtempSync(join(tmpdir(),'myroom-objects-')),clients:WebSocket[]=[];
  const child=spawn(process.execPath,['--import','tsx','src/index.ts'],{env:{...process.env,DATA_DIR:directory,PORT:'13019',PUBLIC_ORIGIN:'https://myroom.test',ADMIN_TOKEN:'objects-network-test-token'},stdio:['ignore','pipe','pipe']});
  const base='http://localhost:13019/api/admin/',headers={Authorization:'Bearer objects-network-test-token',Origin:'https://myroom.test','Content-Type':'application/json'};
  const state=async()=>await (await fetch(base+'state',{headers})).json(),post=(path:string,body:unknown)=>fetch(base+path,{method:'POST',headers,body:JSON.stringify(body)});
  async function send(index:number,command:unknown,type='object_result'){const reply=wait(clients[index],type);clients[index].send(JSON.stringify(command));return reply;}
  try{
    await once(child.stdout!,'data');for(let i=0;i<2;i++){const ws=new WebSocket('ws://localhost:13019/ws',{origin:'https://myroom.test'});clients.push(ws);const welcome=wait(ws,'welcome');await once(ws,'open');await welcome;}
    const model:RoomModel={id:'grab',name:'Grab',height:2.5,floor:[{x:0,z:0},{x:8,z:0},{x:8,z:6},{x:0,z:6}],obstacles:[],openings:[]};model.puzzles=suggestPuzzleLayout(model,()=>0.3);
    assert.equal((await post('rooms/save',{revision:0,room:model})).status,200);assert.equal((await post('adventure/test-mode',{enabled:true})).status,200);await post('adventure/start',{});
    let s=await state();assert.equal((await send(0,{type:'adventure_action',revision:s.adventure.revision,libraryRevision:1,action:'discover_symbol',target:'sun',position:model.puzzles.points.sun,simulation:true},'adventure_result')).changed,true);
    s=await state();const game=s.adventure.revision,pose=s.adventure.objects.poses.chest,command={type:'object_action',action:'grab',target:'chest',revision:s.adventure.objects.revision,lease:'request',seq:1,hands:[{x:pose.x-0.25,y:0.4,z:pose.z},{x:pose.x+0.25,y:0.4,z:pose.z}],pose};
    assert.equal((await send(0,{...command,hands:[command.hands[0]]})).changed,false);const shared=wait(clients[1],'state');assert.equal((await send(0,command)).changed,true);assert.equal((await shared).adventure.objects.held.length,1);
    s=await state();const lease=s.adventure.objects.held[0].lease,move={...command,action:'move',lease,seq:2,pose:{...pose,y:0.3}};
    assert.equal((await send(1,move)).changed,false);assert.equal((await send(0,move)).changed,true);assert.equal((await send(0,move)).changed,false);assert.equal((await send(0,{...move,action:'drop',seq:3})).changed,true);
    s=await state();assert.equal(s.adventure.revision,game);assert.deepEqual(s.adventure.symbols.found,['sun']);assert.equal(s.library.revision,1);assert.equal(s.adventure.objects.poses.chest.y,0.3);
    const save={revision:1,objectRevision:s.adventure.objects.revision};assert.equal((await post('adventure/save-objects',save)).status,400);assert.equal((await fetch(base+'adventure/save-objects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(save)})).status,401);
    await post('adventure/stop',{});s=await state();assert.equal((await post('adventure/save-objects',{revision:1,objectRevision:s.adventure.objects.revision})).status,200);
    const restored=new RoomStore(directory).active();assert.equal(restored?.puzzles?.poses?.chest?.y,0.3);assert.deepEqual(restored?.puzzles?.points,model.puzzles.points);
    s=await state();assert.equal((await send(0,{...command,revision:s.adventure.objects.revision,pose:s.adventure.objects.poses.chest})).changed,true);clients[0].close();await once(clients[0],'close');for(let i=0;i<30;i++){s=await state();if(!s.adventure.objects.held.length)break;await new Promise(resolve=>setTimeout(resolve,10));}assert.equal(s.adventure.objects.held.length,0);
  }finally{for(const ws of clients)ws.terminate();child.kill();if(child.exitCode===null)await once(child,'exit');rmSync(directory,{recursive:true,force:true});}
});
