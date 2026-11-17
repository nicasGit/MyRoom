import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { projectToFloor, makeCalibration, toRoom,nudgeCalibration } from '../../client/src/calibration.ts';

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

test('ajustement local : déplacement suivant A/B et rotation sans muter le calibrage initial',()=>{
  const base=makeCalibration(new Vector3(3,0,4),new Vector3(3,0,6));
  const offset=new Vector3(0.05,0.1,0);
  const shifted=nudgeCalibration(base,offset,0);
  assert.ok(shifted.origin.distanceTo(new Vector3(3,0.1,4.05))<1e-9);
  assert.ok(base.origin.distanceTo(new Vector3(3,0,4))<1e-9);assert.equal(offset.x,0.05);
  const rotated=nudgeCalibration(base,new Vector3(),Math.PI/180);
  assert.ok(Math.abs(rotated.yaw-base.yaw-Math.PI/180)<1e-9);
  assert.equal(rotated.distance,base.distance);
  assert.throws(()=>nudgeCalibration(base,new Vector3(NaN,0,0),0));
});
