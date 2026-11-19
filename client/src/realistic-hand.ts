import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const chains:XRHandJoint[][]=[
  ['wrist','thumb-metacarpal','thumb-phalanx-proximal','thumb-phalanx-distal','thumb-tip'],
  ...(['index','middle','ring','pinky'] as const).map(f=>['wrist',`${f}-finger-metacarpal`,`${f}-finger-phalanx-proximal`,`${f}-finger-phalanx-intermediate`,`${f}-finger-phalanx-distal`,`${f}-finger-tip`] as XRHandJoint[]),
];
const jointNames=[...new Set(chains.flat())];
type Rest={position:THREE.Vector3;quaternion:THREE.Quaternion};
export function controllerHandOrientation(orientation:THREE.Quaternion,side:'left'|'right',phone=false){
  const tilt=.65+THREE.MathUtils.degToRad(30);
  return orientation.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(phone?.65:.25,0,side==='left'?tilt:-tilt)));
}
export class RealisticHand {
  readonly group=new THREE.Group();ready=false;
  private bones=new Map<XRHandJoint,THREE.Object3D>();private rest=new Map<XRHandJoint,Rest>();
  private material=new THREE.MeshStandardMaterial({color:0xd5a587,roughness:.72,metalness:0});
  private disposed=false;private curl=0;private lastTime:number|undefined;
  constructor(private side:'left'|'right'){this.group.name=`realistic-${side}`;this.group.visible=false;}
  load(){return new GLTFLoader().loadAsync(`/models/hands/${this.side}.glb`).then(gltf=>{if(this.disposed){this.release(gltf.scene);return;}this.install(gltf.scene);}).catch(()=>{this.group.userData.loadFailed=true;});}
  install(model:THREE.Group){
    const found=jointNames.map(name=>model.getObjectByName(name));
    if(found.some(bone=>!bone))throw Error('Incomplete WebXR hand skeleton');
    const wrist=found[0]!,inverse=wrist.quaternion.clone().invert();
    jointNames.forEach((name,i)=>{const bone=found[i]!;this.bones.set(name,bone);this.rest.set(name,{position:bone.position.clone().sub(wrist.position).applyQuaternion(inverse),quaternion:inverse.clone().multiply(bone.quaternion)});});
    const materials=new Set<THREE.Material>();model.traverse(node=>{if(node instanceof THREE.Mesh){for(const material of Array.isArray(node.material)?node.material:[node.material])materials.add(material);node.material=this.material;node.frustumCulled=false;}});
    materials.forEach(material=>material.dispose());this.group.add(model);this.ready=true;
  }
  tracked(frame:XRFrame,reference:XRReferenceSpace,hand:XRHand){
    this.group.visible=false;
    if(!this.ready)return false;
    const poses=jointNames.map(name=>{const space=hand.get(name);return space?frame.getJointPose?.(space,reference):undefined;});
    if(poses.some(pose=>!pose))return false;
    this.group.position.set(0,0,0);this.group.quaternion.identity();
    jointNames.forEach((name,i)=>{const bone=this.bones.get(name)!,pose=poses[i]!;bone.position.copy(pose.transform.position);bone.quaternion.copy(pose.transform.orientation);});
    this.group.visible=true;return true;
  }
  grip(position:THREE.Vector3,orientation:THREE.Quaternion,pressed:boolean,time=performance.now(),phone=false){
    if(!this.ready)return false;
    const dt=this.lastTime===undefined?.016:Math.min(.05,Math.max(0,(time-this.lastTime)/1000));this.lastTime=time;
    this.curl=THREE.MathUtils.damp(this.curl,pressed?1:0,16,dt);
    this.group.position.copy(position);this.group.quaternion.copy(controllerHandOrientation(orientation,this.side,phone));
    this.group.position.add(new THREE.Vector3(0,0,.055).applyQuaternion(orientation));
    for(const chain of chains){
      const delta=new THREE.Quaternion();
      for(let i=0;i<chain.length;i++){
        const name=chain[i],bone=this.bones.get(name)!,rest=this.rest.get(name)!;
        if(i===0){bone.position.copy(rest.position);bone.quaternion.copy(rest.quaternion);continue;}
        const previous=this.rest.get(chain[i-1])!,parent=this.bones.get(chain[i-1])!;
        bone.position.copy(rest.position).sub(previous.position).applyQuaternion(delta).add(parent.position);
        if(i>=2){const thumb=chain[1]==='thumb-metacarpal';delta.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-this.curl*(thumb?.35:.65)));}
        bone.quaternion.copy(delta).multiply(rest.quaternion);
      }
    }
    this.group.visible=true;return true;
  }
  private release(model:THREE.Object3D){model.traverse(node=>{if(node instanceof THREE.Mesh){node.geometry.dispose();for(const material of Array.isArray(node.material)?node.material:[node.material])material.dispose();}if(node instanceof THREE.SkinnedMesh)node.skeleton.dispose();});}
  dispose(){this.disposed=true;this.release(this.group);this.material.dispose();this.group.clear();this.group.removeFromParent();this.bones.clear();this.rest.clear();this.ready=false;}
}
