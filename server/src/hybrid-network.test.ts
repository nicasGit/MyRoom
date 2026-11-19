import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { suggestPuzzleLayout,type RoomModel } from './scene-schema.js';
function wait(ws:WebSocket,type:string){return new Promise<any>((resolve,reject)=>{const timer=setTimeout(()=>{ws.off('message',receive);reject(Error('Timeout '+type));},6000);function receive(raw:unknown){const m=JSON.parse(String(raw));if(m.type===type){clearTimeout(timer);ws.off('message',receive);resolve(m);}}ws.on('message',receive);});}
test('hybride réseau : quatre joueurs, secret, capitaine, concurrence, verrous, indices et trois récompenses', {timeout:25000},async()=>{
  const directory=mkdtempSync(join(tmpdir(),'myroom-hybrid-')),clients:WebSocket[]=[],ids:string[]=[];
  const child=spawn(process.execPath,['--import','tsx','src/index.ts'],{env:{...process.env,DATA_DIR:directory,PORT:'13018',PUBLIC_ORIGIN:'https://myroom.test',ADMIN_TOKEN:'hybrid-network-test-token'},stdio:['ignore','pipe','pipe']});
  const base='http://localhost:13018/api/admin/',headers={Authorization:'Bearer hybrid-network-test-token',Origin:'https://myroom.test','Content-Type':'application/json'};
  const state=async()=>await (await fetch(base+'state',{headers})).json();
  const post=(path:string,body:unknown)=>fetch(base+path,{method:'POST',headers,body:JSON.stringify(body)});
  async function command(index:number,action:unknown,revision?:number){const s=await state(),reply=wait(clients[index],'puzzle_result');clients[index].send(JSON.stringify({type:'puzzle_action',revision:revision??s.adventure.revision,libraryRevision:s.library.revision,instanceId:'menthe-blackjack',action,position:s.library.rooms[0].puzzles.points.table,simulation:true}));return await reply;}
  async function accepted(index:number,action:unknown){const result=await command(index,action);assert.equal(result.changed,true,result.message);return state();}
  try{
    await Promise.race([once(child.stdout!,'data'),once(child,'exit').then(()=>{throw Error('Server startup failed');})]);
    for(let index=0;index<4;index++){const ws=new WebSocket('ws://localhost:13018/ws',{origin:'https://myroom.test'});clients.push(ws);const message=wait(ws,'welcome');await once(ws,'open');ids.push((await message).id);}
    assert.equal((await post('display-modes',{version:1,revision:0,defaultMode:'virtual-3d',allowPlayerChange:true,cameraAREnabled:true})).status,200);
    for(let index=0;index<4;index++){
      let response=wait(clients[index],'display_mode_result');clients[index].send(JSON.stringify({type:'display_mode',action:'hello',requestId:'hello',capabilities:{webgl:true,webxr:true,immersiveAR:true,camera:true,touch:true,secureContext:true}}));assert.equal((await response).accepted,true);
      response=wait(clients[index],'display_mode_result');clients[index].send(JSON.stringify({type:'display_mode',action:'change',requestId:'change',mode:['virtual-3d','camera-ar','quest-webxr','virtual-3d'][index]}));assert.equal((await response).accepted,true);
    }
    assert.deepEqual((await state()).displayClients.map((c:any)=>c.mode),['virtual-3d','camera-ar','quest-webxr','virtual-3d']);
    const model:RoomModel={id:'test-hybrid',name:'Test hybrid',height:2.5,floor:[{x:0,z:0},{x:8,z:0},{x:8,z:6},{x:0,z:6}],obstacles:[],openings:[]};model.puzzles=suggestPuzzleLayout(model);
    assert.equal((await post('rooms/save',{revision:0,room:model})).status,200);
    let s=await state();assert.equal((await post('adventure/select',{id:'menthe27',version:'0.2.0',revision:s.adventure.revision})).status,200);
    assert.equal((await post('adventure/test-mode',{enabled:true})).status,200);s=await state();const broadcasts=clients.map(ws=>wait(ws,'state'));
    assert.equal((await post('adventure/test-step',{stepId:'casino',revision:s.adventure.revision})).status,200);
    for(const message of await Promise.all(broadcasts)){assert.equal(message.adventure.phase,'hybrid');assert.equal(message.adventure.captainId,ids[0]);}
    s=await state();assert.equal((await post('adventure/reset-puzzle',{revision:s.adventure.revision,extra:true})).status,400);
    assert.equal((await fetch(base+'adventure/reset-puzzle',{method:'POST',headers:{...headers,Origin:'https://other.test'},body:JSON.stringify({revision:s.adventure.revision})})).status,403);
    assert.equal((await post('adventure/reset-puzzle',{revision:s.adventure.revision})).status,200);assert.equal((await post('adventure/reset-puzzle',{revision:s.adventure.revision})).status,400);
    assert.equal((await command(1,{action:'deal'})).changed,false);s=await accepted(0,{action:'deal'});
    const checkSecret=(s:any)=>{const instance=s.adventure.engine.instances.find((i:any)=>i.type==='blackjack-hybrid');assert.ok(!('config' in instance));assert.ok(!('shoe' in instance.state));if(s.adventure.hybrid.status==='playing'){assert.equal(s.adventure.hybrid.dealer[1],null);assert.equal(s.adventure.hybrid.dealerTotal,null);}};
    checkSecret(s);
    const beforePolicy=s.adventure;
    assert.equal((await post('display-modes',{...(await state()).displayPolicy,allowPlayerChange:false,defaultMode:'quest-webxr'})).status,200);
    assert.deepEqual((await state()).adventure,beforePolicy);
    const refused=wait(clients[0],'display_mode_result');clients[0].send(JSON.stringify({type:'display_mode',action:'change',requestId:'locked',mode:'camera-ar'}));assert.equal((await refused).accepted,false);
    clients[0].close();await once(clients[0],'close');
    for(let tries=0;tries<30;tries++){s=await state();if(s.adventure.captainId===ids[1])break;await new Promise(resolve=>setTimeout(resolve,10));}assert.equal(s.adventure.captainId,ids[1]);
    for(let tries=0;s.adventure.hybrid.status!=='won'&&tries<10;tries++){const action=s.adventure.hybrid.status==='playing'?'stand':'retry';s=await accepted(1,{action});checkSecret(s);}assert.equal(s.adventure.hybrid.status,'won');assert.deepEqual(s.adventure.engine.inventory.map((r:any)=>r.label),['♣']);
    s=await accepted(1,{action:'next_round'});const staleRevision=s.adventure.revision;
    const responses=await Promise.all([command(1,{action:'pick_card',card:'AD'},staleRevision),command(2,{action:'pick_card',card:'AD'},staleRevision)]);assert.equal(responses.filter(r=>r.changed).length,1);
    s=await state();const holder=s.adventure.hybrid.locks[0].owner===ids[1]?1:2;await accepted(holder,{action:'cancel_card'});
    await accepted(3,{action:'pick_card',card:'AD'});clients[3].close();await once(clients[3],'close');for(let tries=0;tries<30;tries++){s=await state();if(!s.adventure.hybrid.locks.length)break;await new Promise(resolve=>setTimeout(resolve,10));}assert.equal(s.adventure.hybrid.locks.length,0);
    assert.equal((await fetch(base+'adventure/hint',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://myroom.test'},body:JSON.stringify({revision:s.adventure.revision})})).status,401);
    assert.equal((await post('adventure/hint',{revision:s.adventure.revision})).status,200);assert.equal((await post('adventure/hint',{revision:s.adventure.revision})).status,400);
    s=await state();assert.equal(s.adventure.engine.instances[1].hints.length,1);
    async function place(index:number,cards:string[]){for(const [slot,card] of cards.entries()){await accepted(index,{action:'pick_card',card});await accepted(index,{action:'drop_card',slot});}}
    await place(2,['AD','9S','AH']);await accepted(2,{action:'assign_ace',card:'AD',value:11});s=await accepted(2,{action:'submit'});assert.deepEqual(s.adventure.engine.inventory.map((r:any)=>r.label),['♣','♥']);
    await accepted(2,{action:'next_round'});await place(2,['10H','8C','3S']);s=await accepted(2,{action:'submit'});
    assert.equal(s.adventure.phase,'pending');assert.equal(s.adventure.engine.stepId,'videoclub');assert.deepEqual(s.adventure.engine.inventory.map((r:any)=>r.label),['♣','♥','♠']);assert.equal(s.adventure.engine.status,'pending');assert.equal(s.library.rooms[0].id,model.id);assert.equal(s.library.revision,1);
    const late=new WebSocket('ws://localhost:13018/ws',{origin:'https://myroom.test'});clients.push(late);const pending=wait(late,'state');await once(late,'open');const restored=await pending;assert.equal(restored.adventure.phase,'pending');assert.equal(restored.adventure.engine.inventory.length,3);
  }finally{for(const ws of clients)ws.terminate();child.kill();if(child.exitCode===null)await once(child,'exit');rmSync(directory,{recursive:true,force:true});}
});
