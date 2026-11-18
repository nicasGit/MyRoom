import * as THREE from 'three';

// A local session placement, independent of the direction of subsequent looks.
export class InfoPanelAnchor {
  private placed=false;
  reset(){this.placed=false;}
  place(panel:THREE.Object3D,position:THREE.Vector3,orientation:THREE.Quaternion){
    if(this.placed)return;
    const forward=new THREE.Vector3(0,0,-1).applyQuaternion(orientation);forward.y=0;
    if(forward.lengthSq()<0.01)forward.set(0,0,-1);forward.normalize();
    panel.position.copy(position).addScaledVector(forward,1.6);
    panel.position.y=THREE.MathUtils.clamp(position.y-0.25,0.9,1.5);
    panel.lookAt(position.x,panel.position.y,position.z);this.placed=true;
  }
}
