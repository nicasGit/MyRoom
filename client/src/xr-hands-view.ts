import * as THREE from 'three';

const fingers:XRHandJoint[][]=[
  ['wrist','thumb-metacarpal','thumb-phalanx-proximal','thumb-phalanx-distal','thumb-tip'],
  ...(['index','middle','ring','pinky'] as const).map(finger=>['wrist',`${finger}-finger-metacarpal`,`${finger}-finger-phalanx-proximal`,`${finger}-finger-phalanx-intermediate`,`${finger}-finger-phalanx-distal`,`${finger}-finger-tip`] as XRHandJoint[]),
];
const joints=[...new Set(fingers.flat())];
const links=fingers.flatMap(finger=>finger.slice(1).map((joint,index)=>[finger[index],joint] as const));
type Rig={root:THREE.Group;joints:Map<XRHandJoint,THREE.Mesh>;bones:THREE.Mesh[];controller:THREE.Group;material:THREE.MeshBasicMaterial};

// Procedural models: no external model download, no fabricated optical poses.
export class XRHandsView {
  readonly group=new THREE.Group();
  private rigs=new Map<'left'|'right',Rig>();
  private sphere=new THREE.SphereGeometry(1,10,8);
  private cylinder=new THREE.CylinderGeometry(1,1,1,8);
  private box=new THREE.BoxGeometry(1,1,1);
  constructor(){
    for(const side of ['left','right'] as const){
      const root=new THREE.Group(),material=new THREE.MeshBasicMaterial({color:side==='left'?0x67e8f9:0xa7f3a0,transparent:true,opacity:0.85,depthWrite:false});
      root.name=`hand-${side}`;root.visible=false;this.group.add(root);
      const nodes=new Map<XRHandJoint,THREE.Mesh>();
      for(const joint of joints){const node=new THREE.Mesh(this.sphere,material);node.name=joint;root.add(node);nodes.set(joint,node);}
      const bones=links.map(()=>{const bone=new THREE.Mesh(this.cylinder,material);root.add(bone);return bone;});
      const controller=new THREE.Group();controller.name='controller-glove';root.add(controller);
      const palm=new THREE.Mesh(this.box,material);palm.scale.set(0.07,0.035,0.085);controller.add(palm);
      for(let i=0;i<4;i++){const digit=new THREE.Mesh(this.box,material);digit.scale.set(0.014,0.022,0.045);digit.position.set((i-1.5)*0.018,0,-0.055);controller.add(digit);}
      const thumb=new THREE.Mesh(this.box,material);thumb.scale.set(0.022,0.024,0.045);thumb.position.set(side==='left'?0.043:-0.043,0,-0.005);thumb.rotation.y=side==='left'?-0.5:0.5;controller.add(thumb);
      this.rigs.set(side,{root,joints:nodes,bones,controller,material});
    }
  }
  update(frame:XRFrame|undefined,reference:XRReferenceSpace,sources:XRInputSourceArray,pressed:readonly string[]=[]){
    for(const rig of this.rigs.values())rig.root.visible=false;
    if(!frame)return;
    for(const source of Array.from(sources).sort((a,b)=>Number(!!b.hand)-Number(!!a.hand))){
      if(source.handedness!=='left'&&source.handedness!=='right')continue;
      const rig=this.rigs.get(source.handedness)!;if(rig.root.visible)continue;
      rig.material.color.setHex(pressed.includes(source.handedness)?0xffd54f:source.handedness==='left'?0x67e8f9:0xa7f3a0);
      rig.controller.visible=false;
      for(const node of rig.joints.values())node.visible=false;for(const bone of rig.bones)bone.visible=false;
      if(source.hand){
        for(const [joint,node] of rig.joints){
          const space=source.hand.get(joint),pose=space?frame.getJointPose?.(space,reference):undefined;
          if(!pose)continue;
          node.position.copy(pose.transform.position);node.scale.setScalar(THREE.MathUtils.clamp(pose.radius??0.008,0.004,0.018));node.visible=true;rig.root.visible=true;
        }
        links.forEach(([from,to],index)=>{const a=rig.joints.get(from)!,b=rig.joints.get(to)!,bone=rig.bones[index];if(!a.visible||!b.visible)return;
          const delta=b.position.clone().sub(a.position),length=delta.length();if(length<0.001)return;
          bone.position.copy(a.position).addScaledVector(delta,0.5);bone.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.divideScalar(length));bone.scale.set(Math.min(a.scale.x,b.scale.x)*0.75,length,Math.min(a.scale.x,b.scale.x)*0.75);bone.visible=true;
        });
      }else if(source.gripSpace){
        const pose=frame.getPose(source.gripSpace,reference);if(!pose)continue;
        rig.controller.position.copy(pose.transform.position);rig.controller.quaternion.copy(pose.transform.orientation);rig.controller.visible=true;rig.root.visible=true;
      }
    }
  }
  dispose(){this.group.removeFromParent();this.group.clear();for(const rig of this.rigs.values())rig.material.dispose();this.rigs.clear();this.sphere.dispose();this.cylinder.dispose();this.box.dispose();}
}
