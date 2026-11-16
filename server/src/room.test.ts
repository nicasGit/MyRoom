import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Room } from './room.js';
test('quatre places maximum et réutilisation des places libres', () => {
  const room = new Room();
  for (const id of ['a', 'b', 'c', 'd']) assert.equal(room.join(id), true);
  assert.equal(room.join('e'), false);
  room.players.delete('b'); assert.equal(room.join('e'), true);
  assert.equal(room.players.get('e'), 2);
});
test('résolution autoritaire, idempotente et protégée par révision', () => {
  const room = new Room();
  assert.equal(room.solve(1), false); assert.equal(room.solve(0), true);
  assert.equal(room.solve(0), false); assert.equal(room.solve(1), false);
  assert.equal(room.snapshot().puzzle.revision, 1);
  room.reset();
  assert.equal(room.solved, false); assert.equal(room.revision, 2);
  assert.equal(room.solve(0), false); assert.equal(room.solve(1), false);
  assert.equal(room.solve(2), true);
});
