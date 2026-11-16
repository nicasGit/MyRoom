import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { WebSocket } from 'ws';

function messageOfType(ws: WebSocket, type: string, revision?: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { ws.off('message', receive); reject(new Error(`Message attendu : ${type}`)); }, 5000);
    function receive(raw: unknown) {
      const message = JSON.parse(String(raw));
      if (message.type !== type || (revision !== undefined && message.puzzle?.revision !== revision)) return;
      clearTimeout(timeout); ws.off('message', receive); resolve(message);
    }
    ws.on('message', receive);
  });
}

test('WebSocket : quatre joueurs, cinquième refusé, état partagé et origine contrôlée', { timeout: 15000 }, async () => {
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    env: { ...process.env, PORT: '13017', PUBLIC_ORIGIN: 'https://myroom.test', ADMIN_TOKEN: 'test-admin-token-not-for-production' },
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
    const resetStates = clients.slice(0, 4).map(ws => messageOfType(ws, 'state', 2));
    assert.equal((await fetch(`${adminUrl}reset`, { method: 'POST', headers, body: '{}' })).status, 200);
    for (const state of await Promise.all(resetStates)) {
      assert.equal(state.puzzle.solved, false); assert.equal(state.puzzle.revision, 2);
    }
    assert.equal((await fetch(`${adminUrl}kick`, { method: 'POST', headers, body: '{"id":42}' })).status, 400);
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
  }
  const events = output.trim().split(/\r?\n/).map(line => JSON.parse(line));
  assert.equal(events.filter(event => event.event === 'player_connected').length, 4);
  assert.ok(events.some(event => event.event === 'connection_rejected' && event.reason === 'room_full'));
  assert.ok(events.some(event => event.event === 'connection_rejected' && event.reason === 'origin_not_allowed'));
  assert.ok(events.some(event => event.event === 'puzzle_solve' && event.accepted === true));
  assert.ok(events.some(event => event.event === 'client_xr' && event.action === 'placement_rejected' && event.slot === 1));
  assert.ok(events.some(event => event.event === 'player_disconnected' && event.code === 1000));
  assert.ok(events.every(event => typeof event.timestamp === 'string'));
});
