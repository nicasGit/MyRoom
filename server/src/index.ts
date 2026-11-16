import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { Room } from './room.js';
import { log } from './logger.js';
import { admin, type Connection } from './admin.js';
import { parseXREvent } from './xr-events.js';
import { RoomStore } from './room-store.js';

const room = new Room();
const store = new RoomStore(process.env.DATA_DIR ?? 'data');
room.model = store.active(); room.libraryRevision = store.snapshot().revision;
const connections = new Map<string, Connection>();
const http = createServer((req, res) => {
  if (req.url?.startsWith('/api/admin/')) {
    void admin(req, res, room, connections, broadcast, store).catch(error => {
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
  if (req.url !== '/ws' || !origin || (allowedOrigin ? origin !== allowedOrigin : !['http://localhost:5173', 'http://127.0.0.1:5173'].includes(origin))) {
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
  if (!room.join(id)) {
    log('connection_rejected', { ...context, reason: 'room_full', connected: room.players.size });
    ws.close(1008, 'Salle complète (4 joueurs)'); return;
  }
  const slot = room.players.get(id);
  connections.set(id, { socket: ws, address, userAgent: context.userAgent, connectedAt: new Date().toISOString() });
  log('player_connected', { ...context, slot, connected: room.players.size });
  ws.send(JSON.stringify({ type: 'welcome', id })); broadcast();
  let alive = true;
  let count = 0;
  const timer = setInterval(() => {
    count = 0;
    if (!alive) { log('heartbeat_timeout', { id, slot }); ws.terminate(); return; }
    alive = false; ws.ping();
  }, 10000);
  ws.on('pong', () => { alive = true; });
  ws.on('message', (raw, binary) => {
    if (++count > 30) { log('rate_limit_exceeded', { id, slot }); ws.close(1008, 'Trop de messages'); return; }
    try {
      if (binary) throw new Error('JSON texte attendu');
      const message: unknown = JSON.parse(raw.toString());
      const xr = parseXREvent(message);
      if (xr) {
        log('client_xr', { id, slot, action: xr.event, details: xr.details });
        ws.send(JSON.stringify({ type: 'xr_ack', event: xr.event }));
        return;
      }
      if (!message || typeof message !== 'object' || !('type' in message) || message.type !== 'solve' || !('revision' in message) || !Number.isSafeInteger(message.revision)) throw new Error('Message invalide');
      const accepted = room.solve(message.revision as number);
      log('puzzle_solve', { id, slot, accepted, requestedRevision: message.revision, revision: room.revision });
      // Always return authoritative state, including stale requests.
      broadcast();
    } catch {
      log('invalid_message', { id, slot, binary, bytes: Buffer.byteLength(raw.toString()) });
      ws.send(JSON.stringify({ type: 'error', message: 'Message invalide' }));
    }
  });
  ws.on('close', (code, reason) => {
    clearInterval(timer); room.players.delete(id); connections.delete(id);
    log('player_disconnected', { id, slot, code, reason: reason.toString().slice(0, 128), connected: room.players.size });
    broadcast();
  });
});
const port = Number(process.env.PORT ?? 3000);
http.on('error', error => { log('server_error', { message: error.message }); process.exitCode = 1; });
http.listen(port, '0.0.0.0', () => log('server_started', { port, maxPlayers: 4, publicOrigin: process.env.PUBLIC_ORIGIN ?? 'localhost:5173', savedRooms:store.snapshot().rooms.length, activeRoom:room.model?.name ?? null }));
function shutdown() {
  log('server_stopping', { connected: room.players.size });
  for (const client of wss.clients) client.terminate();
  wss.close(); http.close();
}
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
