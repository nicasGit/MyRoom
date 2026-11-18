import * as THREE from 'three';
import { toRoom,type makeCalibration } from './calibration';
import type { GrabHand } from './object-grab';

// Explicit simulation: a virtual right hand 55 cm in front of the phone.
export function phoneHand(position:THREE.Vector3,orientation:THREE.Quaternion,calibration:ReturnType<typeof makeCalibration>,pressed:boolean):{local:THREE.Vector3;hand:GrabHand}{
  const local=new THREE.Vector3(0,-.08,-.55).applyQuaternion(orientation).add(position);
  const forward=new THREE.Vector3(0,0,-1).applyQuaternion(orientation).applyAxisAngle(new THREE.Vector3(0,1,0),calibration.yaw);
  return {local,hand:{side:'right',position:toRoom(local,calibration),pressed,yaw:Math.atan2(forward.x,-forward.z)}};
}
