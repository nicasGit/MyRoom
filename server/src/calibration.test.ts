import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { projectToFloor, makeCalibration, toRoom } from '../../client/src/calibration.ts';

test('projection tactile : intersection du rayon central avec le sol local', () => {
  const origin = new Vector3(1, 1.5, 2);
  const direction = new Vector3(0, -1, -1).normalize();
  const point = projectToFloor(origin, direction);
  assert.ok(point);
  assert.ok(point.distanceTo(new Vector3(1, 0, 0.5)) < 1e-9);
  assert.equal(origin.y, 1.5); // No mutation of the current viewer pose.
});
test('projection tactile : rejette horizon, plafond, suivi invalide et sol trop distant', () => {
  const origin = new Vector3(0, 1.6, 0);
  for (const direction of [new Vector3(0, 0, -1), new Vector3(0, 1, 0), new Vector3(0, -0.06, -1).normalize(), new Vector3(NaN, -1, 0)]) {
    assert.equal(projectToFloor(origin, direction), undefined);
  }
  assert.equal(projectToFloor(new Vector3(0, -1, 0), new Vector3(0, -1, 0)), undefined);
});
test('deux points : distance minimale et repère horizontal en mètres', () => {
  const a = new Vector3(3, 0, 4);
  assert.throws(() => makeCalibration(a, new Vector3(3.1, 0, 4)));
  const b = new Vector3(3, 0, 6);
  const calibration = makeCalibration(a, b);
  assert.ok(toRoom(a, calibration).length() < 1e-9);
  assert.ok(toRoom(b, calibration).distanceTo(new Vector3(2, 0, 0)) < 1e-9);
});
