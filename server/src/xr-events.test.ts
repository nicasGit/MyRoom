import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseXREvent } from './xr-events.js';
import { bindPress } from '../../client/src/press.ts';

test('un appui tactile suivi du clic synthétique ne place pas deux repères', () => {
  const target = new EventTarget();
  let now = 0;
  let presses = 0;
  const unbind = bindPress(target, () => presses++, () => now);
  target.dispatchEvent(new Event('pointerup'));
  now = 100; target.dispatchEvent(new Event('click'));
  assert.equal(presses, 1);
  now = 200; target.dispatchEvent(new Event('pointerup'));
  now = 300; target.dispatchEvent(new Event('click'));
  assert.equal(presses, 2);
  now = 1100; target.dispatchEvent(new Event('click'));
  assert.equal(presses, 3); // Mouse or keyboard without a recent pointer release.
  unbind(); target.dispatchEvent(new Event('pointerup'));
  assert.equal(presses, 3);
});
test('les diagnostics XR ne peuvent pas injecter des événements serveur ni des champs arbitraires', () => {
  assert.deepEqual(parseXREvent({ type: 'xr_event', event: 'placement_accepted', details: { step: 'A', x: 1, y: 0, z: -2 } }), { event: 'placement_accepted', details: { step: 'A', x: 1, y: 0, z: -2 } });
  for (const value of [null, {}, { type: 'xr_event', event: 'server_started', details: {} }, { type: 'xr_event', event: 'session_started', details: { id: 'spoofed' } }, { type: 'xr_event', event: 'placement_accepted', details: { x: Infinity } }, { type: 'xr_event', event: 'placement_rejected', details: { reason: 'x'.repeat(161) } }, { type: 'xr_event', event: 'session_started', details: [] }]) {
    assert.equal(parseXREvent(value), undefined);
  }
});
