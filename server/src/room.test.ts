import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Room } from './room.js';
import { TEAM_LEON, CHARACTER_NAMES, randomPlayerNames } from './player-name-presets.js';

test('team presets provide four distinct names without mutating the character pool', () => {
  assert.deepEqual(TEAM_LEON, ['Léon', 'Reno', 'Fabien', 'Nico']);
  const original = [...CHARACTER_NAMES];
  for (const sample of [0, 0.25, 0.5, 0.999999]) {
    const names = randomPlayerNames(() => sample);
    assert.equal(names.length, 4);
    assert.equal(new Set(names).size, 4);
    assert.ok(names.every(name => original.includes(name as typeof CHARACTER_NAMES[number])));
  }
  assert.deepEqual(CHARACTER_NAMES, original);
  assert.throws(() => randomPlayerNames(() => 1));
});
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
