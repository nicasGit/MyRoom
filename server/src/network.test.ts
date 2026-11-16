import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { WebSocket } from 'ws';

test('WebSocket : quatre joueurs, cinquième refusé, état partagé et origine contrôlée', { timeout: 15000 }, async () => {
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    env: { ...process.env, PORT: '13017', PUBLIC_ORIGIN: 'https://myroom.test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const clients: WebSocket[] = [];
  try {
    await Promise.race([
      once(child.stdout, 'data'),
      once(child, 'exit').then(() => { throw new Error('Serveur arrêté avant démarrage'); }),
    ]);
    assert.equal((await fetch('http://localhost:13017/health')).status, 200);
    for (let i = 0; i < 4; i++) {
      const ws = new WebSocket('ws://localhost:13017/ws', { origin: 'https://myroom.test' });
      clients.push(ws);
      const [, message] = await Promise.all([once(ws, 'open'), once(ws, 'message')]);
      assert.equal(JSON.parse(String(message[0])).type, 'welcome');
    }
    const extra = new WebSocket('ws://localhost:13017/ws', { origin: 'https://myroom.test' });
    clients.push(extra);
    const [code] = await once(extra, 'close'); assert.equal(code, 1008);
    const states = clients.slice(0, 4).map(ws => once(ws, 'message'));
    clients[0].send(JSON.stringify({ type: 'solve', revision: 0 }));
    for (const [data] of await Promise.all(states)) {
      const state = JSON.parse(String(data));
      assert.equal(state.players.length, 4);
      assert.equal(state.puzzle.solved, true); assert.equal(state.puzzle.revision, 1);
    }
    const bad = new WebSocket('ws://localhost:13017/ws', { origin: 'https://other.test' });
    clients.push(bad);
    await new Promise<void>(resolve => bad.once('error', () => resolve()));
  } finally {
    for (const ws of clients) ws.terminate();
    child.kill(); await once(child, 'exit');
  }
});
