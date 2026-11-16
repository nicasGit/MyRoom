import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { Room } from './room.js';

const room = new Room();
const http = createServer((req, res) => {
  res.writeHead(req.url === '/health' ? 200 : 404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: req.url === '/health' }));
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
http.on('upgrade', (req, socket, head) => {
  // Browser clients must use the same public origin; also checked behind Nginx.
  const origin = req.headers.origin;
  const allowedOrigin = process.env.PUBLIC_ORIGIN;
  if (req.url !== '/ws' || !origin || (allowedOrigin ? origin !== allowedOrigin : !['http://localhost:5173', 'http://127.0.0.1:5173'].includes(origin))) {
    socket.destroy(); return;
  }
  wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws));
});
const broadcast = () => {
  const data = JSON.stringify(room.snapshot());
  for (const client of wss.clients) if (client.readyState === WebSocket.OPEN) client.send(data);
};
wss.on('connection', ws => {
  const id = randomUUID();
  if (!room.join(id)) { ws.close(1008, 'Salle complète (4 joueurs)'); return; }
  ws.send(JSON.stringify({ type: 'welcome', id })); broadcast();
  let alive = true;
  let count = 0;
  const timer = setInterval(() => {
    count = 0;
    if (!alive) { ws.terminate(); return; }
    alive = false; ws.ping();
  }, 10000);
  ws.on('pong', () => { alive = true; });
  ws.on('error', console.error);
  ws.on('message', (raw, binary) => {
    if (++count > 30) { ws.close(1008, 'Trop de messages'); return; }
    try {
      if (binary) throw new Error('JSON texte attendu');
      const message: unknown = JSON.parse(raw.toString());
      if (!message || typeof message !== 'object' || !('type' in message) || message.type !== 'solve' || !('revision' in message) || !Number.isSafeInteger(message.revision)) throw new Error('Message invalide');
      room.solve(message.revision as number);
      // Always return authoritative state, including stale requests.
      broadcast();
    } catch { ws.send(JSON.stringify({ type: 'error', message: 'Message invalide' })); }
  });
  ws.on('close', () => { clearInterval(timer); room.players.delete(id); broadcast(); });
});
http.listen(Number(process.env.PORT ?? 3000), '0.0.0.0', () => console.log('MyRoom WebSocket :3000'));
function shutdown() {
  for (const client of wss.clients) client.terminate();
  wss.close(); http.close();
}
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
