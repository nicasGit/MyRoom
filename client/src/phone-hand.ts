import * as THREE from 'three';
import { toRoom,type makeCalibration } from './calibration';
import type { GrabHand } from './object-grab';

export function hasTrackedHands(sources:Iterable<Pick<XRInputSource,'targetRayMode'|'hand'|'gripSpace'>>){
  return Array.from(sources).some(source=>source.targetRayMode==='tracked-pointer'&&!!(source.hand||source.gripSpace));
}

// Explicit simulation: a virtual right hand 55 cm in front of the phone.
export function usePhoneHand(overlay:boolean,mode:string|undefined,sources:Iterable<Pick<XRInputSource,'targetRayMode'|'hand'|'gripSpace'>>){
  return overlay&&(mode==='screen-space'||!hasTrackedHands(sources));
}
export function phoneHand(position:THREE.Vector3,orientation:THREE.Quaternion,calibration:ReturnType<typeof makeCalibration>,pressed:boolean):{local:THREE.Vector3;hand:GrabHand}{
  const local=new THREE.Vector3(0,-.08,-.55).applyQuaternion(orientation).add(position);
  const forward=new THREE.Vector3(0,0,-1).applyQuaternion(orientation).applyAxisAngle(new THREE.Vector3(0,1,0),calibration.yaw);
  return {local,hand:{side:'right',position:toRoom(local,calibration),pressed,yaw:Math.atan2(forward.x,-forward.z),orientation:new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),calibration.yaw).multiply(orientation)}};
}
