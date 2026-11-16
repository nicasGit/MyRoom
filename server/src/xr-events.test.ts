import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseXREvent } from './xr-events.js';
import { bindPress } from '../../client/src/press.ts';
import { PlacementRequest } from '../../client/src/placement.ts';

test('le contact tactile agit immédiatement, même si le suivi se perd avant le relâchement', () => {
  const target = new EventTarget();
  let now = 0;
  let presses = 0;
  const unbind = bindPress(target, () => presses++, () => now);
  target.dispatchEvent(new Event('pointerdown'));
  assert.equal(presses, 1);
  now = 1000; target.dispatchEvent(new Event('pointerup'));
  now = 1050; target.dispatchEvent(new Event('click'));
  assert.equal(presses, 1);
  now = 1100; target.dispatchEvent(new Event('pointerdown'));
  assert.equal(presses, 2);
  target.dispatchEvent(new Event('pointercancel'));
  target.dispatchEvent(new Event('click'));
  assert.equal(presses, 2);
  unbind();
});

test('un appui utilise une position valide très récente une seule fois', () => {
  let now = 0;
  const placement = new PlacementRequest<string>(() => now);
  placement.update('A'); now = 90;
  assert.equal(placement.request(), 'A');
  assert.equal(placement.pending, false);
  assert.equal(placement.request(), undefined); // Consumed point is not reused as B.
  assert.equal(placement.pending, true);
});
test('un appui survit à des images sans suivi et attend la première position valide', () => {
  let now = 0;
  const placement = new PlacementRequest<string>(() => now);
  placement.update('ancienne'); placement.update(undefined);
  assert.equal(placement.request(), undefined);
  now = 200; assert.equal(placement.update(undefined), undefined);
  assert.equal(placement.pending, true);
  now = 500; assert.equal(placement.update('nouvelle'), 'nouvelle');
  assert.equal(placement.pending, false);
  assert.equal(placement.update('autre image'), undefined);
});
test('une position périmée, une attente expirée ou un recentrage ne placent pas de repère', () => {
  let now = 0;
  const placement = new PlacementRequest<string>(() => now);
  placement.update('ancienne'); now = 101;
  assert.equal(placement.request(), undefined);
  now = 1700;
  assert.equal(placement.update('trop tard'), undefined);
  placement.cancel();
  assert.equal(placement.update('après annulation'), undefined);
  placement.cancel();
  assert.equal(placement.request(), undefined);
  assert.equal(placement.pending, true);
});

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
  assert.deepEqual(parseXREvent({type:'xr_event',event:'scan_imported',details:{reason:'4 coins, 1 meuble'}}),{event:'scan_imported',details:{reason:'4 coins, 1 meuble'}});
  assert.deepEqual(parseXREvent({ type: 'xr_event', event: 'placement_accepted', details: { step: 'A', x: 1, y: 0, z: -2 } }), { event: 'placement_accepted', details: { step: 'A', x: 1, y: 0, z: -2 } });
  for (const value of [null, {}, { type: 'xr_event', event: 'server_started', details: {} }, { type: 'xr_event', event: 'session_started', details: { id: 'spoofed' } }, { type: 'xr_event', event: 'placement_accepted', details: { x: Infinity } }, { type: 'xr_event', event: 'placement_rejected', details: { reason: 'x'.repeat(161) } }, { type: 'xr_event', event: 'session_started', details: [] }]) {
    assert.equal(parseXREvent(value), undefined);
  }
});
