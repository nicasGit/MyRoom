import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { WebSocket } from 'ws';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,resolve,dirname } from 'node:path';
import { parseRoom,suggestPuzzleLayout,findPuzzlePanel } from './scene-schema.js';

function messageOfType(ws: WebSocket, type: string, revision?: number,modelId?:string|null): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { ws.off('message', receive); reject(new Error(`Message attendu : ${type}`)); }, 5000);
    function receive(raw: unknown) {
      const message = JSON.parse(String(raw));
      if (message.type !== type || (revision !== undefined && message.puzzle?.revision !== revision)) return;
      if(modelId!==undefined&&(message.model?.id??null)!==modelId)return;
      clearTimeout(timeout); ws.off('message', receive); resolve(message);
    }
    ws.on('message', receive);
  });
}

test('WebSocket : quatre joueurs, cinquième refusé, état partagé et origine contrôlée', { timeout: 15000 }, async () => {
  const directory=mkdtempSync(join(tmpdir(),'myroom-network-'));
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    env: { ...process.env, DATA_DIR:directory, PORT: '13017', PUBLIC_ORIGIN: 'https://myroom.test', ADMIN_TOKEN: 'test-admin-token-not-for-production' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const clients: WebSocket[] = [];
  let output = '';
  child.stdout.on('data', chunk => { output += String(chunk); });
  try {
    await Promise.race([
      once(child.stdout, 'data'),
      once(child, 'exit').then(() => { throw new Error('Serveur arrêté avant démarrage'); }),
    ]);
    assert.equal((await fetch('http://localhost:13017/health')).status, 200);
    const adminUrl = 'http://localhost:13017/api/admin/';
    const headers = { Authorization: 'Bearer test-admin-token-not-for-production', Origin: 'https://myroom.test', 'Content-Type': 'application/json' };
    assert.equal((await fetch(`${adminUrl}state`)).status, 401);
    assert.equal((await fetch(`${adminUrl}state`, { headers: { Authorization: 'Bearer incorrect' } })).status, 401);
    assert.equal((await fetch(`${adminUrl}reset`, { method: 'POST', headers: { ...headers, Origin: 'https://other.test' }, body: '{}' })).status, 403);
    for (let i = 0; i < 4; i++) {
      const ws = new WebSocket('ws://localhost:13017/ws', { origin: 'https://myroom.test' });
      clients.push(ws);
      const [, message] = await Promise.all([once(ws, 'open'), once(ws, 'message')]);
      assert.equal(JSON.parse(String(message[0])).type, 'welcome');
    }
    const xrAck = messageOfType(clients[0], 'xr_ack');
    clients[0].send(JSON.stringify({ type: 'xr_event', event: 'placement_rejected', details: { step: 'A', reason: 'Suivi indisponible' } }));
    assert.deepEqual(await xrAck, { type: 'xr_ack', event: 'placement_rejected' });
    const trackingAck=messageOfType(clients[0],'xr_ack');
    clients[0].send(JSON.stringify({type:'xr_event',event:'tracking_changed',details:{reason:'Visée valide'}}));
    assert.deepEqual(await trackingAck,{type:'xr_ack',event:'tracking_changed'});
    const invalidXR = messageOfType(clients[0], 'error');
    clients[0].send(JSON.stringify({ type: 'xr_event', event: 'server_started', details: {} }));
    assert.equal((await invalidXR).type, 'error');
    const extra = new WebSocket('ws://localhost:13017/ws', { origin: 'https://myroom.test' });
    clients.push(extra);
    const [code] = await once(extra, 'close'); assert.equal(code, 1008);
    const states = clients.slice(0, 4).map(ws => messageOfType(ws, 'state', 1));
    clients[0].send(JSON.stringify({ type: 'solve', revision: 0 }));
    for (const state of await Promise.all(states)) {
      assert.equal(state.players.length, 4);
      assert.equal(state.puzzle.solved, true); assert.equal(state.puzzle.revision, 1);
    }
    const overview = await (await fetch(`${adminUrl}state`, { headers })).json();
    assert.equal(overview.players.length, 4);
    assert.ok(overview.logs.some((entry: {event: string; action: string; id: string}) => entry.event === 'client_xr' && entry.action === 'placement_rejected' && entry.id === overview.players.find((p: {slot: number}) => p.slot === 1).id));
    assert.ok(!JSON.stringify(overview).includes('test-admin-token-not-for-production'));
    assert.ok(overview.logs.length <= 100);
    assert.ok(!overview.logs.some((entry:{action?:string})=>entry.action==='tracking_changed'));
    const resetStates = clients.slice(0, 4).map(ws => messageOfType(ws, 'state', 2));
    assert.equal((await fetch(`${adminUrl}reset`, { method: 'POST', headers, body: '{}' })).status, 200);
    for (const state of await Promise.all(resetStates)) {
      assert.equal(state.puzzle.solved, false); assert.equal(state.puzzle.revision, 2);
    }
    assert.equal((await fetch(`${adminUrl}kick`, { method: 'POST', headers, body: '{"id":42}' })).status, 400);
    const roomModel={id:'salon',name:'Salon',height:2.5,floor:[{x:0,z:0},{x:4,z:0},{x:4,z:3},{x:0,z:3}],obstacles:[{name:'Table',x:2,z:1.5,width:1,depth:1,height:0.8}]};
    assert.equal((await fetch(`${adminUrl}rooms/save`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:0,room:roomModel})})).status,401);
    const modelStates=clients.slice(0,4).map(ws=>messageOfType(ws,'state',2,'salon'));
    const saved=await fetch(`${adminUrl}rooms/save`,{method:'POST',headers,body:JSON.stringify({revision:0,room:roomModel})});
    assert.equal(saved.status,200);
    for(const state of await Promise.all(modelStates)){assert.equal(state.model.obstacles[0].name,'Table');assert.equal(state.libraryRevision,1);}
    assert.equal((await fetch(`${adminUrl}rooms/save`,{method:'POST',headers,body:JSON.stringify({revision:0,room:roomModel})})).status,400);
    assert.equal((await fetch(`${adminUrl}rooms/save`,{method:'POST',headers,body:JSON.stringify({revision:1,room:{...roomModel,id:'bureau',name:'Bureau'}})})).status,200);
    assert.equal((await fetch(`${adminUrl}rooms/activate`,{method:'POST',headers,body:JSON.stringify({revision:2,id:'salon'})})).status,200);
    const library=(await (await fetch(`${adminUrl}state`,{headers})).json()).library;
    assert.equal(library.rooms.length,2);assert.equal(library.activeId,'salon');
    const configured=parseRoom({...roomModel,puzzles:suggestPuzzleLayout(parseRoom(roomModel))});
    assert.equal((await fetch(`${adminUrl}rooms/save`,{method:'POST',headers,body:JSON.stringify({revision:3,room:configured})})).status,200);
    assert.equal((await fetch(`${adminUrl}adventure/test-mode`,{method:'POST',headers,body:'{"enabled":"yes"}'})).status,400);
    assert.equal((await fetch(`${adminUrl}adventure/test-mode`,{method:'POST',headers:{...headers,Origin:'https://other.test'},body:'{"enabled":true}'})).status,403);
    assert.equal((await fetch(`${adminUrl}adventure/test-mode`,{method:'POST',headers,body:'{"enabled":true}'})).status,200);
    const preparation=(await (await fetch(`${adminUrl}state`,{headers})).json()).adventure;
    let points=structuredClone(configured.puzzles!.points);
    for(const offset of [{x:0.05,z:0},{x:-0.05,z:0},{x:0,z:0.05},{x:0,z:-0.05}]){
      const candidate=structuredClone(points);candidate.chest.x+=offset.x;candidate.chest.z+=offset.z;
      try{parseRoom({...configured,puzzles:{points:candidate}});points=candidate;break;}catch{/* Try the other direction around the obstacle. */}
    }
    const placement={revision:4,gameRevision:preparation.revision,points,panel:findPuzzlePanel(configured)};
    assert.equal((await fetch(`${adminUrl}adventure/place`,{method:'POST',headers,body:JSON.stringify({...placement,panel:{wall:0,offset:0.01}})})).status,400);
    assert.equal((await fetch(`${adminUrl}adventure/place`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(placement)})).status,401);
    assert.equal((await fetch(`${adminUrl}adventure/place`,{method:'POST',headers,body:JSON.stringify(placement)})).status,200);
    assert.equal((await fetch(`${adminUrl}adventure/place`,{method:'POST',headers,body:JSON.stringify(placement)})).status,400);
    assert.equal((await fetch(`${adminUrl}adventure/start`,{method:'POST',headers,body:'{}'})).status,200);
    const started=(await (await fetch(`${adminUrl}state`,{headers})).json()).adventure;
    assert.equal((await fetch(`${adminUrl}adventure/place`,{method:'POST',headers,body:JSON.stringify({revision:5,gameRevision:started.revision,points})})).status,400);
    const gameState=(await (await fetch(`${adminUrl}state`,{headers})).json()).adventure;
    const shared=clients.slice(0,4).map(ws=>new Promise<any>((resolve,reject)=>{
      const timeout=setTimeout(()=>{ws.off('message',receive);reject(new Error('État partagé des énigmes absent'));},3000);
      function receive(raw:unknown){const state=JSON.parse(String(raw));if(state.type==='state'&&state.adventure?.revision===gameState.revision+1){clearTimeout(timeout);ws.off('message',receive);resolve(state);}}
      ws.on('message',receive);
    }));
    const result=messageOfType(clients[0],'adventure_result');
    const command={type:'adventure_action',revision:gameState.revision,libraryRevision:5,action:'discover_symbol',target:'sun',position:configured.puzzles!.points.sun,simulation:true};
    clients[0].send(JSON.stringify(command));assert.equal((await result).changed,true);
    for(const state of await Promise.all(shared))assert.deepEqual(state.adventure.symbols.found,['sun']);
    const stale=messageOfType(clients[1],'adventure_result');clients[1].send(JSON.stringify(command));assert.equal((await stale).changed,false);
    const malformed=messageOfType(clients[1],'error');clients[1].send(JSON.stringify({...command,target:'invalid'}));assert.equal((await malformed).type,'error');
    assert.equal((await fetch(`${adminUrl}adventure/reset`,{method:'POST',headers,body:'{}'})).status,200);
    assert.deepEqual((await (await fetch(`${adminUrl}state`,{headers})).json()).adventure.symbols.found,[]);
    assert.equal((await fetch(`${adminUrl}kick`, { method: 'POST', headers, body: '{"id":"absent"}' })).status, 404);
    const kicked = once(clients[3], 'close');
    assert.equal((await fetch(`${adminUrl}kick`, { method: 'POST', headers, body: JSON.stringify({ id: overview.players.find((p: {slot: number}) => p.slot === 4).id }) })).status, 200);
    assert.equal((await kicked)[0], 1008);
    const bad = new WebSocket('ws://localhost:13017/ws', { origin: 'https://other.test' });
    clients.push(bad);
    await new Promise<void>(resolve => bad.once('error', () => resolve()));
    const disconnected = once(clients[0], 'close');
    clients[0].close(1000, 'Test terminé');
    await disconnected;
  } finally {
    for (const ws of clients) ws.terminate();
    const closed = once(child, 'close');
    child.kill(); await closed;
    if(resolve(dirname(directory))!==resolve(tmpdir()))throw new Error('Chemin temporaire inattendu');
    rmSync(directory,{recursive:true,force:true});
  }
  const events = output.trim().split(/\r?\n/).map(line => JSON.parse(line));
  assert.equal(events.filter(event => event.event === 'player_connected').length, 4);
  assert.ok(events.some(event => event.event === 'connection_rejected' && event.reason === 'room_full'));
  assert.ok(events.some(event => event.event === 'connection_rejected' && event.reason === 'origin_not_allowed'));
  assert.ok(events.some(event => event.event === 'puzzle_solve' && event.accepted === true));
  assert.ok(events.some(event => event.event === 'client_xr' && event.action === 'placement_rejected' && event.slot === 1));
  assert.ok(!events.some(event=>event.event==='client_xr'&&event.action==='tracking_changed'));
  assert.ok(events.some(event => event.event === 'player_disconnected' && event.code === 1000));
  assert.ok(events.every(event => typeof event.timestamp === 'string'));
});
