import { Vector3 } from 'three';

// Horizontal rigid transform: local XR coordinates -> common room coordinates.
export function makeCalibration(a: Vector3, b: Vector3) {
  const delta = b.clone().sub(a); delta.y = 0;
  if (delta.length() < 0.5) throw new Error('Les repères doivent être séparés de 50 cm minimum.');
  const yaw = Math.atan2(delta.z, delta.x);
  return { origin: a.clone(), yaw, distance: delta.length() };
}
export function toRoom(point: Vector3, calibration: ReturnType<typeof makeCalibration>) {
  return point.clone().sub(calibration.origin).applyAxisAngle(new Vector3(0, 1, 0), calibration.yaw);
}
