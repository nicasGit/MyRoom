import { test } from 'node:test';import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';import { once } from 'node:events';import { randomUUID } from 'node:crypto';
import { mkdtempSync,rmSync } from 'node:fs';import { tmpdir } from 'node:os';import { join } from 'node:path';
import { WebSocket } from 'ws';import { DEFAULT_PORTAL,STAFF_IDS } from './portal-types.js';import { suggestPuzzleLayout,type RoomModel } from '../scene-schema.js';
function wait(ws:WebSocket,type:string){return new Promise<any>((resolve,reject)=>{const timer=setTimeout(()=>{ws.off('message',receive);reject(Error('Timeout '+type));},6000);function receive(raw:unknown){const data=JSON.parse(String(raw));if(data.type===type){clearTimeout(timer);ws.off('message',receive);resolve(data);}}ws.on('message',receive);});}
test('portail réseau : quatre prises, reprise privée, passages géométriques, administration et départ unique',{timeout:35000},async()=>{
  const directory=mkdtempSync(join(tmpdir(),'portal-network-')),clients:WebSocket[]=[],tokens:string[]=[];
  const child=spawn(process.execPath,['--import','tsx','src/index.ts'],{env:{...process.env,DATA_DIR:directory,PORT:'13021',PUBLIC_ORIGIN:'https://myroom.test',ADMIN_TOKEN:'portal-network-test-token'},stdio:['ignore','pipe','pipe']});
  const headers={Authorization:'Bearer portal-network-test-token',Origin:'https://myroom.test','Content-Type':'application/json'},base='http://localhost:13021/api/admin/';
  const state=async()=>await (await fetch(base+'state',{headers})).json(),post=(path:string,body:unknown)=>fetch(base+path,{method:'POST',headers,body:JSON.stringify(body)});
  async function until(predicate:(s:any)=>boolean,timeout=9000){const end=Date.now()+timeout;while(Date.now()<end){const s=await state();if(predicate(s))return s;await new Promise(resolve=>setTimeout(resolve,60));}throw Error('Condition portail non atteinte.');}
  async function connect(index:number,token?:string){const ws=new WebSocket('ws://localhost:13021/ws',token?['myroom-resume.'+token]:[],{origin:'https://myroom.test'});const welcome=wait(ws,'welcome');clients[index]=ws;await once(ws,'open');tokens[index]=(await welcome).resumeToken;}
  async function send(index:number,command:unknown,type:string){const result=wait(clients[index],type);clients[index].send(JSON.stringify(command));return result;}
  let pulse:ReturnType<typeof setInterval>|undefined;
  try{
    await once(child.stdout!,'data');for(let i=0;i<4;i++)await connect(i);
    const room:RoomModel={id:'portal',name:'Portal',floor:[{x:0,z:0},{x:8,z:0},{x:8,z:8},{x:0,z:8}],height:2.5,obstacles:[],openings:[]};room.puzzles=suggestPuzzleLayout(room,()=>0.4);
    assert.equal((await post('rooms/save',{revision:0,room})).status,200);let s=await state();
    assert.equal((await post('adventure/select',{id:'menthe27',version:'0.3.0',revision:s.adventure.revision})).status,200);
    s=await state();assert.equal((await post('portal',{action:'configure',revision:s.portal.revision,config:{...structuredClone(DEFAULT_PORTAL),confirmed:true}})).status,200);
    assert.equal((await post('adventure/start',{})).status,200);s=await state();assert.equal(s.adventure.running,false);
    const noAuth=await fetch(base+'portal',{method:'POST',headers:{Origin:'https://myroom.test','Content-Type':'application/json'},body:JSON.stringify({action:'skip',revision:s.portal.revision})});assert.equal(noAuth.status,401);
    let latest=s;clients.forEach(ws=>ws.on('message',raw=>{const data=JSON.parse(String(raw));if(data.type==='state')latest=data;}));
    const seq=[0,0,0,0],depth=[.6,.6,.6,.6];
    pulse=setInterval(()=>{for(let i=0;i<4;i++)if(clients[i]?.readyState===WebSocket.OPEN&&latest.portal?.active)clients[i].send(JSON.stringify({type:'portal_action',sessionId:latest.portal.sessionId,revision:latest.portal.revision,commandId:randomUUID(),seq:++seq[i],action:'pose',position:{x:4,y:1.6,z:3+depth[i]}}));},350);
    await until(s=>s.portal.players.every((p:any)=>p.ready));
    await until(s=>s.portal.ghosts?.length===4);
    const ghostBroadcast=await wait(clients[1],'state');
    assert.equal(ghostBroadcast.portal.ghosts.length,4);assert.equal(ghostBroadcast.portal.ghosts[0].head.y,1.6);
    async function grab(index:number,target:string){const s=await state(),pose=s.adventure.objects.poses[target];return send(index,{type:'object_action',action:'grab',target,revision:s.adventure.objects.revision,lease:'request',seq:1,hands:[{x:pose.x,y:pose.y+.2,z:pose.z}],pose},'object_result');}
    assert.equal((await grab(0,'staff2')).changed,false);
    for(let i=0;i<4;i++){
      assert.equal((await grab(i,STAFF_IDS[i])).changed,true);s=await state();
      const held=s.adventure.objects.held.find((h:any)=>h.target===STAFF_IDS[i]),pose=s.adventure.objects.poses[STAFF_IDS[i]];
      const rotated={...pose,quaternion:{x:Math.SQRT1_2,y:0,z:0,w:Math.SQRT1_2}};
      let observed=false;
      const observe=(raw:unknown)=>{const message=JSON.parse(String(raw));if(message.type==='state'&&message.adventure.objects.poses[STAFF_IDS[i]]?.quaternion?.x===Math.SQRT1_2)observed=true;};
      clients[(i+1)%4].on('message',observe);
      assert.equal((await send(i,{type:'object_action',action:'move',target:STAFF_IDS[i],revision:s.adventure.objects.revision,lease:held.lease,seq:2,hands:[{x:pose.x,y:pose.y+.2,z:pose.z}],pose:rotated},'object_result')).changed,true);
      assert.equal((await send(i,{type:'object_action',action:'drop',target:STAFF_IDS[i],revision:s.adventure.objects.revision,lease:held.lease,seq:3,hands:[{x:pose.x,y:pose.y+.2,z:pose.z}],pose:rotated},'object_result')).changed,true);
      await until(state=>state.adventure.objects.poses[STAFF_IDS[i]]?.quaternion?.x===Math.SQRT1_2);
      await new Promise(resolve=>setTimeout(resolve,30));assert.equal(observed,true);clients[(i+1)%4].off('message',observe);
    }
    clients[3].close();await once(clients[3],'close');const disconnected=await until(s=>!s.portal.players[3].present);assert.equal(disconnected.portal.ghosts.some((g:any)=>g.slot===4),false);await connect(3,tokens[3]);clients[3].on('message',raw=>{const data=JSON.parse(String(raw));if(data.type==='state')latest=data;});await until(s=>s.portal.players[3].ready&&s.portal.ghosts.some((g:any)=>g.slot===4));assert.equal((await state()).portal.players[3].claimed,true);
    await until(s=>s.portal.phase==='portal-open');
    for(let i=0;i<4;i++){
      for(const d of [.2,-.05]){depth[i]=d;await new Promise(resolve=>setTimeout(resolve,450));}
      const crossed=await until(s=>s.portal.players[i].crossed,3000);
      assert.equal(crossed.portal.players[i].validationMethod,'physical-xr');
      if(i<3){assert.equal(crossed.adventure.running,false);assert.equal(crossed.portal.players.filter((p:any)=>p.crossed).length,i+1);}
    }
    s=await until(s=>s.adventure.running,16000);assert.equal(s.portal.phase,'completed');assert.equal(s.adventure.engine.stepId,'symbols');assert.deepEqual(s.library.rooms[0],room);
    assert.deepEqual(s.portal.ghosts,[]);
    const revision=s.adventure.revision;await new Promise(resolve=>setTimeout(resolve,1100));assert.equal((await state()).adventure.revision,revision);
    assert.equal((await post('adventure/stop',{})).status,200);s=await state();assert.equal((await post('portal',{action:'simulate-start',revision:s.portal.revision})).status,400);
    assert.equal((await post('adventure/test-mode',{enabled:true})).status,200);s=await state();assert.equal((await post('portal',{action:'simulate-start',revision:s.portal.revision})).status,200);s=await state();assert.equal(s.portal.simulation,true);assert.equal((await post('portal',{action:'skip',revision:s.portal.revision})).status,200);
    s=await state();const previousSession=s.portal.sessionId,instances=s.adventure.engine.instances;
    assert.equal((await post('portal',{action:'reset',revision:s.portal.revision})).status,200);
    s=await state();assert.notEqual(s.portal.sessionId,previousSession);assert.equal(s.portal.active,true);
    assert.ok(s.portal.players.every((p:any)=>!p.claimed&&!p.crossed));assert.equal(s.adventure.objects.held.length,0);assert.deepEqual(s.adventure.engine.instances,instances);
  }finally{clearInterval(pulse);clients.forEach(ws=>ws.terminate());child.kill();await once(child,'exit');rmSync(directory,{recursive:true,force:true});}
});
