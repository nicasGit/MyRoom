import { ModelStore } from './model-store.js';
import { importedCatalog } from './object-library.js';
import { readFileSync } from 'node:fs';
import { DisplayModes,parseModeCommand } from './display-modes.js';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { Room } from './room.js';
import { log } from './logger.js';
import { admin, type Connection } from './admin.js';
import { parseXREvent } from './xr-events.js';
import { RoomStore } from './room-store.js';
import { Adventure,parseAdventureCommand,parsePuzzleCommand } from './adventure.js';
import { createRegistry,createCatalog } from './adventures/catalog.js';
import { join } from 'node:path';
import { PortalPlacementStore } from './portal/placement-store.js';
import { parsePortalCommand,STAFF_IDS } from './portal/portal-types.js';
import { parseObjectCommand } from './object-manipulation.js';
import { CoverStore } from './cover-store.js';

const registry=createRegistry();
const catalog=createCatalog(registry,process.env.ADVENTURE_CATALOG_DIR??join(process.env.DATA_DIR??'data','adventures'));
const models = new ModelStore(process.env.DATA_DIR??'data');
const covers = new CoverStore(process.env.DATA_DIR??'data');
const room = new Room(new Adventure(registry,catalog));
room.display=new DisplayModes(process.env.DATA_DIR??'data');
const store = new RoomStore(process.env.DATA_DIR ?? 'data');
room.portalStore=new PortalPlacementStore(process.env.DATA_DIR??'data');
room.model = store.active(); room.libraryRevision = store.snapshot().revision;
const connections = new Map<string, Connection>();
const http = createServer((req, res) => {
  if(req.method==='GET'&&req.url==='/api/library/catalog'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(importedCatalog()));return;}
  if(req.method==='GET'&&req.url?.startsWith('/api/library/models/')){
    const path=models.publicPath(req.url.slice('/api/library/models/'.length));
    try{if(!path)throw Error('not found');const bytes=readFileSync(path);res.writeHead(200,{'Content-Type':'model/gltf-binary','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'});res.end(bytes);}catch{res.writeHead(404);res.end();}return;
  }
  if(req.method==='GET'&&req.url==='/api/covers'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(covers.publicSnapshot()));return;}
  if(req.method==='GET'&&req.url?.startsWith('/api/covers/files/')){try{const path=covers.publicFile(req.url.slice('/api/covers/files/'.length));if(!path)throw Error();const bytes=readFileSync(path);const ext=path.split('.').pop();res.writeHead(200,{'Content-Type':ext==='svg'?'image/svg+xml':`image/${ext==='jpg'?'jpeg':ext}`,'Cache-Control':'public, max-age=31536000, immutable'});res.end(bytes);}catch{res.writeHead(404);res.end();}return;}
  if (req.url?.startsWith('/api/admin/')) {
    void admin(req, res, room, connections, broadcast, store, models, covers).catch(error => {
      log('admin_error', { message: String(error) });
      if (!res.headersSent) { res.writeHead(500); res.end(); }
    });
    return;
  }
  res.writeHead(req.url === '/health' ? 200 : 404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: req.url === '/health' }));
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
http.on('upgrade', (req, socket, head) => {
  // Browser clients must use the same public origin; also checked behind Nginx.
  const origin = req.headers.origin;
  const allowedOrigin = process.env.PUBLIC_ORIGIN;
  if (new URL(req.url??'/', 'http://localhost').pathname !== '/ws' || !origin || (allowedOrigin ? origin !== allowedOrigin : !['http://localhost:5173', 'http://127.0.0.1:5173'].includes(origin))) {
    log('connection_rejected', { reason: req.url !== '/ws' ? 'invalid_path' : 'origin_not_allowed', origin: origin?.slice(0, 256), expectedOrigin: allowedOrigin ?? 'localhost:5173', address: req.socket.remoteAddress });
    socket.destroy(); return;
  }
  wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
});
const broadcast = () => {
  const data = JSON.stringify(room.snapshot());
  for (const client of wss.clients) if (client.readyState === WebSocket.OPEN) client.send(data);
};
wss.on('connection', (ws, req) => {
  const id = randomUUID();
  const peer = req.socket.remoteAddress;
  // Only the container's loopback Nginx may supply the real peer address.
  const forwarded = req.headers['x-real-ip'];
  const address = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(peer ?? '') && typeof forwarded === 'string' ? forwarded.slice(0, 128) : peer;
  const context = { id, address, userAgent: req.headers['user-agent']?.slice(0, 256), origin: req.headers.origin?.slice(0, 256) };
  ws.on('error', error => log('socket_error', { ...context, message: error.message }));
  let seat:{slot:number;token:string};
  try{const protocol=req.headers['sec-websocket-protocol'];if(protocol&&!/^myroom-resume\.[0-9a-f]{64}$/.test(protocol))throw Error('Protocole invalide.');seat=room.seats.acquire(id,protocol?.slice('myroom-resume.'.length),room.portal.active);}
  catch{log('connection_rejected',{...context,reason:req.headers['sec-websocket-protocol']?'invalid_resume':'room_full',connected:room.players.size});ws.close(1008,'Place réservée ou reprise refusée.');return;}
  if (!room.join(id,seat.slot)) {
    room.seats.disconnect(id,false);
    log('connection_rejected', { ...context, reason: 'room_full', connected: room.players.size });
    ws.close(1008, 'Salle complete pour le nombre de joueurs choisi'); return;
  }
  const slot = room.players.get(id);
  connections.set(id, { socket: ws, address, userAgent: context.userAgent, connectedAt: new Date().toISOString() });
  log('player_connected', { ...context, slot, connected: room.players.size });
  ws.send(JSON.stringify({ type: 'welcome', id,resumeToken:seat.token })); broadcast();
  let alive = true;
  let count = 0;
  let objectCount=0,portalCount=0;
  const timer = setInterval(() => {
    count = 0;
    objectCount=0;portalCount=0;
    if (!alive) { log('heartbeat_timeout', { id, slot }); ws.terminate(); return; }
    alive = false; ws.ping();
  }, 10000);
  ws.on('pong', () => { alive = true; });
  ws.on('message', (raw, binary) => {
    let counted=false;
    try {
      if (binary) throw new Error('JSON texte attendu');
      const message: unknown = JSON.parse(raw.toString());
      if(message&&typeof message==='object'&&'type' in message&&message.type==='display_mode'){
        counted=true;if(++count>30){ws.close(1008,'Trop de messages');return;}
        try{const command=parseModeCommand(message);const previousMode=room.display.mode(id);const result=room.display.act(id,command);if(previousMode!==result.mode)room.portal.clearTracking(slot!);ws.send(JSON.stringify(result));log('display_mode',{id,slot,mode:result.mode,action:command.action});broadcast();}
        catch(error){ws.send(JSON.stringify({type:'display_mode_result',accepted:false,message:error instanceof Error?error.message:'Mode refuse.'}));}return;
      }
      if(message&&typeof message==='object'&&'type' in message&&message.type==='portal_action'){
        counted=true;if(++portalCount>60){ws.close(1008,'Trop de poses portail');return;}
        try{room.snapshot();const command=parsePortalCommand(message);const alreadyCrossed=room.portal.snapshot().players.find(p=>p.slot===slot)?.crossed;room.portal.act(command,slot!,room.model,Date.now(),room.display.mode(id));if(!alreadyCrossed&&room.portal.snapshot().players.find(p=>p.slot===slot)?.crossed)log('portal_validation',{id,slot,method:room.portal.snapshot().players.find(p=>p.slot===slot)?.validationMethod});room.maintain();ws.send(JSON.stringify({type:'portal_result',accepted:true,commandId:command.commandId}));broadcast();}
        catch(error){ws.send(JSON.stringify({type:'portal_result',accepted:false,message:error instanceof Error?error.message:'Commande refusee.'}));}return;
      }
      if(message&&typeof message==='object'&&'type' in message&&message.type==='object_action'){
        counted=true;
        if(++objectCount>80){ws.close(1008,'Trop de déplacements');return;}
        room.snapshot();const command=parseObjectCommand(message);
        const staff=STAFF_IDS.includes(command.target as any);
        if(room.portal.active&&(staff?!room.portal.canGrab(slot!,command.target):!command.target.startsWith('prop:'))&&command.action!=='cancel'){ws.send(JSON.stringify({type:'object_result',changed:false,message:'Baton reserve a sa place ; introduction active.'}));return;}
        if(staff&&!room.portal.active){ws.send(JSON.stringify({type:'object_result',changed:false,message:'Introduction inactive.'}));return;}
        const result=room.objects.act(command,id,room.model,Date.now(),randomUUID());
        if(result.changed&&staff&&command.action==='grab'&&!room.portal.snapshot().players[slot!-1].claimed)room.portal.claim(slot!,command.target);
        ws.send(JSON.stringify({type:'object_result',...result}));if(result.changed){if(command.action!=='move')log('object_manipulation',{id,slot,target:command.target,action:command.action});broadcast();}else ws.send(JSON.stringify(room.snapshot()));return;
      }
      counted=true;if (++count > 30) { log('rate_limit_exceeded', { id, slot }); ws.close(1008, 'Trop de messages'); return; }
      if(message&&typeof message==='object'&&'type' in message&&message.type==='puzzle_action'){
        room.maintain();const command=parsePuzzleCommand(message),result=room.adventure.actPuzzle(command,room.model,room.libraryRevision,id,room.objects.snapshot());
        log('puzzle_action',{id,slot,instanceId:command.instanceId,accepted:result.changed,message:result.message});
        ws.send(JSON.stringify({type:'puzzle_result',...result}));if(result.changed)broadcast();else ws.send(JSON.stringify(room.snapshot()));return;
      }
      if(message&&typeof message==='object'&&'type' in message&&message.type==='adventure_action'){
        const command=parseAdventureCommand(message),result=room.adventure.act(command,room.model,room.libraryRevision,room.objects.snapshot());
        log('adventure_action',{id,slot,action:command.action,target:command.target,simulation:command.simulation,accepted:result.changed,message:result.message});
        ws.send(JSON.stringify({type:'adventure_result',...result}));
        if(result.changed)broadcast();else ws.send(JSON.stringify(room.snapshot()));
        return;
      }
      const xr = parseXREvent(message);
      if (xr) {
        // Older pages may still send tracking diagnostics: acknowledge without log noise.
        if(xr.event!=='tracking_changed')log('client_xr', { id, slot, action: xr.event, details: xr.details });
        ws.send(JSON.stringify({ type: 'xr_ack', event: xr.event }));
        return;
      }
      if (!message || typeof message !== 'object' || !('type' in message) || message.type !== 'solve' || !('revision' in message) || !Number.isSafeInteger(message.revision)) throw new Error('Message invalide');
      const accepted = room.solve(message.revision as number);
      log('puzzle_solve', { id, slot, accepted, requestedRevision: message.revision, revision: room.revision });
      // Always return authoritative state, including stale requests.
      broadcast();
    } catch {
      if(!counted&&++count>30){ws.close(1008,'Trop de messages');return;}
      log('invalid_message', { id, slot, binary, bytes: Buffer.byteLength(raw.toString()) });
      ws.send(JSON.stringify({ type: 'error', message: 'Message invalide' }));
    }
  });
  ws.on('close', (code, reason) => {
    clearInterval(timer);room.seats.disconnect(id,room.portal.active); room.leave(id); connections.delete(id);
    log('player_disconnected', { id, slot, code, reason: reason.toString().slice(0, 128), connected: room.players.size });
    broadcast();
  });
});
const port = Number(process.env.PORT ?? 3000);
const maintenance=setInterval(()=>{if(room.maintain())broadcast();},1000);maintenance.unref();
http.on('error', error => { log('server_error', { message: error.message }); process.exitCode = 1; });
http.listen(port, '0.0.0.0', () => log('server_started', { port, maxPlayers: 4, publicOrigin: process.env.PUBLIC_ORIGIN ?? 'localhost:5173', savedRooms:store.snapshot().rooms.length, activeRoom:room.model?.name ?? null }));
function shutdown() {
  clearInterval(maintenance);
  log('server_stopping', { connected: room.players.size });
  for (const client of wss.clients) client.terminate();
  wss.close(); http.close();
}
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
