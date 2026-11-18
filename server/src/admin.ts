import type { IncomingMessage, ServerResponse } from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { WebSocket } from 'ws';
import type { Room } from './room.js';
import { log, recentLogs } from './logger.js';
import type { RoomStore } from './room-store.js';
import { puzzlePanel } from './scene-schema.js';

export type Connection = { socket: WebSocket; address?: string; userAgent?: string; connectedAt: string };
const started = Date.now();
function reply(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(body));
}
export async function admin(req: IncomingMessage, res: ServerResponse, room: Room, connections: Map<string, Connection>, broadcast: () => void, store: RoomStore) {
  const token = process.env.ADMIN_TOKEN ?? '';
  if (token.length < 16) { reply(res, 503, { error: 'Configurer admin_token avec au moins 16 caractères puis redémarrer.' }); return; }
  const supplied = req.headers.authorization ?? '';
  const hash = (text: string) => createHash('sha256').update(text).digest();
  if (!timingSafeEqual(hash(supplied), hash(`Bearer ${token}`))) {
    reply(res, 401, { error: 'Jeton administrateur incorrect.' }); return;
  }
  if (req.method === 'GET' && req.url === '/api/admin/state') {
    reply(res, 200, {
      uptimeSeconds: Math.floor((Date.now() - started) / 1000),
      publicOrigin: process.env.PUBLIC_ORIGIN ?? 'http://localhost:5173',
      puzzle: room.snapshot().puzzle,
      library:store.snapshot(),
      adventure:room.snapshot().adventure,
      adventures:room.adventure.listAdventures(),
      playerNames:room.playerNames,playerNamesRevision:room.playerNamesRevision,
      players: [...room.players].map(([id, slot]) => {
        const connection = connections.get(id);
        return { id, slot, name:room.playerNames[slot-1],address: connection?.address, userAgent: connection?.userAgent, connectedAt: connection?.connectedAt };
      }),
      logs: recentLogs(),
    }); return;
  }
  if (req.method !== 'POST' || !['/api/admin/reset', '/api/admin/kick', '/api/admin/rooms/save', '/api/admin/rooms/activate', '/api/admin/rooms/delete','/api/admin/players/names','/api/admin/adventure/hint','/api/admin/adventure/reset-puzzle','/api/admin/adventure/select','/api/admin/adventure/test-step','/api/admin/adventure/stop','/api/admin/adventure/reset','/api/admin/adventure/start','/api/admin/adventure/place','/api/admin/adventure/test-mode'].includes(req.url ?? '')) {
    reply(res, 404, { error: 'Route inconnue.' }); return;
  }
  const allowed = process.env.PUBLIC_ORIGIN;
  if (!req.headers.origin || (allowed ? req.headers.origin !== allowed : !['http://localhost:5173', 'http://127.0.0.1:5173'].includes(req.headers.origin))) {
    reply(res, 403, { error: 'Origine non autorisée : vérifier public_origin.' }); return;
  }
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') {
    reply(res, 415, { error: 'JSON attendu.' }); return;
  }
  try {
    const chunks: Buffer[] = [];
    let bytes = 0;
    for await (const chunk of req) {
      bytes += Buffer.byteLength(chunk);
      if (bytes > (req.url?.startsWith('/api/admin/rooms/') ? 32768 : 4096)) { reply(res, 413, { error: 'Message trop volumineux.' }); return; }
      chunks.push(Buffer.from(chunk));
    }
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString());
    if (!body || typeof body !== 'object' || Array.isArray(body)) { reply(res, 400, { error: 'Objet JSON attendu.' }); return; }
    if(req.url==='/api/admin/players/names'){
      try{if(Object.keys(body).sort().join(',')!=='names,revision')throw new Error('Noms et révision attendus.');const command=body as Record<string,unknown>;room.setPlayerNames(command.names,command.revision);}
      catch(error){reply(res,400,{error:error instanceof Error?error.message:'Noms invalides.'});return;}
      log('player_names_changed',{revision:room.playerNamesRevision});broadcast();reply(res,200,{ok:true});return;
    }
    if(req.url?.startsWith('/api/admin/adventure/')){
      room.adventure.configure(room.model);
      if(req.url.endsWith('/hint')||req.url.endsWith('/reset-puzzle')){
        try{const command=body as Record<string,unknown>;if(Object.keys(command).join(',')!=='revision'||!Number.isSafeInteger(command.revision))throw new Error('Révision attendue.');room.adventure.adminPuzzle(req.url.endsWith('/hint')?'hint':'reset-puzzle',command.revision as number);}
        catch(error){reply(res,400,{error:error instanceof Error?error.message:'Commande refusée.'});return;}
        log('adventure_admin',{action:req.url.split('/').at(-1)});broadcast();reply(res,200,{ok:true});return;
      }
      if(req.url.endsWith('/test-step')){
        try{const command=body as Record<string,unknown>;if(Object.keys(command).sort().join(',')!=='revision,stepId'||typeof command.stepId!=='string'||command.stepId.length>64||!Number.isSafeInteger(command.revision))throw new Error('Étape et révision attendues.');room.adventure.testStep(command.stepId,command.revision as number);}
        catch(error){reply(res,400,{error:error instanceof Error?error.message:'Test impossible.'});return;}
        log('adventure_test_step',{stepId:room.adventure.snapshot().engine.stepId,revision:room.adventure.snapshot().revision});broadcast();reply(res,200,{ok:true});return;
      }
      if(req.url.endsWith('/select')){
        try{const command=body as Record<string,unknown>;if(Object.keys(command).sort().join(',')!=='id,revision,version'||typeof command.id!=='string'||typeof command.version!=='string'||!Number.isSafeInteger(command.revision))throw new Error('Sélection invalide.');room.adventure.select(command.id,command.version,command.revision as number);}
        catch(error){reply(res,400,{error:error instanceof Error?error.message:'Sélection impossible.'});return;}
        log('adventure_selected',{id:room.adventure.snapshot().engine.adventureId,version:room.adventure.snapshot().engine.adventureVersion});broadcast();reply(res,200,{ok:true});return;
      }
      if(req.url.endsWith('/place')){
        if(!room.model||room.adventure.snapshot().running||!('gameRevision' in body)||body.gameRevision!==room.adventure.snapshot().revision||!['gameRevision,points,revision','gameRevision,panel,points,revision'].includes(Object.keys(body).sort().join(',')))throw new Error('Placement impossible : actualisez la préparation.');
        const command=body as Record<string,unknown>;
        const panel=command.panel??room.model.puzzles?.panel??puzzlePanel(room.model)?.panel;
        const library=store.change('save',command.revision,{...room.model,puzzles:{points:command.points,...(panel===undefined?{}:{panel})}});
        room.model=store.active();room.libraryRevision=library.revision;
        log('adventure_placement',{revision:library.revision,activeId:library.activeId});broadcast();reply(res,200,{library});return;
      }
      if(req.url.endsWith('/start')){if(Object.keys(body).length)throw new Error('Objet vide attendu');if(!room.model||!puzzlePanel(room.model)){reply(res,400,{error:'Aucun mur libre pour le panneau des symboles.'});return;}room.adventure.start();}
      else if(req.url.endsWith('/stop')){if(Object.keys(body).length)throw new Error('Objet vide attendu');room.adventure.stop();}
      else if(req.url.endsWith('/reset')){if(Object.keys(body).length)throw new Error('Objet vide attendu');room.adventure.reset();}
      else {if(Object.keys(body).length!==1||!('enabled' in body)||typeof body.enabled!=='boolean')throw new Error('Booléen attendu');room.adventure.setTestMode(body.enabled);}
      log('adventure_admin',{action:req.url.split('/').at(-1),testMode:room.adventure.snapshot().testMode});broadcast();reply(res,200,{ok:true});return;
    }
    if(req.url?.startsWith('/api/admin/rooms/')) {
      const command=body as Record<string,unknown>;
      const action=req.url.split('/').at(-1) as 'save'|'activate'|'delete';
      try {
        const library=store.change(action,command.revision,action==='save'?command.room:command.id);
        room.model=store.active(); room.libraryRevision=library.revision;
        log('room_library_changed',{action,revision:library.revision,rooms:library.rooms.length,activeId:library.activeId});
        broadcast(); reply(res,200,{library});
      } catch(error) {
        log('room_library_error',{action,message:String(error)});
        reply(res,400,{error: error instanceof Error ? error.message : 'Enregistrement impossible.'});
      }
      return;
    }
    if (req.url === '/api/admin/reset') {
      if (Object.keys(body).length) { reply(res, 400, { error: 'Objet vide attendu.' }); return; }
      room.reset(); log('admin_puzzle_reset', { revision: room.revision }); broadcast();
    } else {
      if (!('id' in body) || typeof body.id !== 'string' || body.id.length > 64 || Object.keys(body).length !== 1) {
        reply(res, 400, { error: 'Identifiant joueur attendu.' }); return;
      }
      const target = connections.get(body.id);
      if (!target) { reply(res, 404, { error: 'Joueur déjà déconnecté.' }); return; }
      log('admin_player_kicked', { id: body.id, slot: room.players.get(body.id) });
      // 1008 also prevents the player's automatic reconnection loop.
      target.socket.close(1008, 'Déconnecté par un administrateur');
    }
    reply(res, 200, { ok: true });
  } catch { if (!res.headersSent) reply(res, 400, { error: 'Requête JSON invalide.' }); }
}
