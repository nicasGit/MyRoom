import * as THREE from 'three';
import { toRoom,type makeCalibration } from './calibration';
import { requiredHands,type ObjectCommand,type ObjectId,type ObjectPose,type ObjectSnapshot } from '../../server/src/object-manipulation.js';
export type GrabHand={side:'left'|'right';position:THREE.Vector3;pressed:boolean;yaw:number};
const up=new THREE.Vector3(0,1,0);
const angle=(n:number)=>Math.atan2(Math.sin(n),Math.cos(n));
export function gripTransform(start:GrabHand[],current:GrabHand[],original:ObjectPose):ObjectPose{
  if(!start.length||start.length!==current.length||new Set(start.map(h=>h.side)).size!==start.length||start.some((h,i)=>h.side!==current[i].side))throw new Error('Mains incohérentes.');
  const center=(hands:GrabHand[])=>hands.reduce((p,h)=>p.add(h.position),new THREE.Vector3()).multiplyScalar(1/hands.length);
  const a=center(start),b=center(current);
  const turn=start.length===2?angle(Math.atan2(current[1].position.z-current[0].position.z,current[1].position.x-current[0].position.x)-Math.atan2(start[1].position.z-start[0].position.z,start[1].position.x-start[0].position.x)):angle(current[0].yaw-start[0].yaw);
  const offset=new THREE.Vector3(original.x,original.y,original.z).sub(a).applyAxisAngle(up,-turn).add(b);
  return {x:offset.x,y:Math.max(0,offset.y),z:offset.z,yaw:angle(original.yaw-turn)};
}
export class GrabInputs {
  isGripping(source:XRInputSource){return this.squeezed.has(source)||!!this.pinched.get(source)||!!source.gamepad?.buttons[1]?.pressed;}
  private squeezed=new Set<XRInputSource>();
  private pinched=new Map<XRInputSource,boolean>();
  squeeze(source:XRInputSource,pressed:boolean){if(pressed)this.squeezed.add(source);else this.squeezed.delete(source);}
  read(frame:XRFrame,reference:XRReferenceSpace,sources:XRInputSourceArray,calibration:ReturnType<typeof makeCalibration>,staffTrigger=false):GrabHand[]{
    const result:GrabHand[]=[];
    for(const source of Array.from(sources).sort((a,b)=>Number(!!b.hand)-Number(!!a.hand))){if(source.targetRayMode==='screen')continue;if(source.handedness!=='left'&&source.handedness!=='right'||result.some(h=>h.side===source.handedness))continue;
      let position:THREE.Vector3|undefined,orientation:DOMPointReadOnly|undefined,pressed=false;
      if(source.hand){
        const thumb=source.hand.get('thumb-tip'),index=source.hand.get('index-finger-tip');if(!thumb||!index)continue;
        const a=frame.getJointPose?.(thumb,reference),b=frame.getJointPose?.(index,reference);if(!a||!b){this.pinched.delete(source);continue;}
        const p=new THREE.Vector3().copy(a.transform.position),q=new THREE.Vector3().copy(b.transform.position),distance=p.distanceTo(q);
        pressed=distance<(this.pinched.get(source)?0.045:0.025);this.pinched.set(source,pressed);position=p.add(q).multiplyScalar(0.5);orientation=b.transform.orientation;
      }else if(source.gripSpace){const pose=frame.getPose(source.gripSpace,reference);if(!pose)continue;position=new THREE.Vector3().copy(pose.transform.position);orientation=pose.transform.orientation;pressed=this.squeezed.has(source)||!!source.gamepad?.buttons[1]?.pressed||staffTrigger&&!!source.gamepad?.buttons[0]?.pressed;}
      if(position&&orientation){const forward=new THREE.Vector3(0,0,-1).applyQuaternion(new THREE.Quaternion().copy(orientation)).applyAxisAngle(up,calibration.yaw);result.push({side:source.handedness,position:toRoom(position,calibration),pressed,yaw:Math.atan2(forward.x,-forward.z)});}
    }
    for(const source of this.pinched.keys())if(!Array.from(sources).includes(source))this.pinched.delete(source);
    for(const source of this.squeezed)if(!Array.from(sources).includes(source))this.squeezed.delete(source);
    return result.sort((a,b)=>a.side.localeCompare(b.side));
  }
}
type Hold={target:ObjectId;start:GrabHand[];original:ObjectPose;pose:ObjectPose;hands:GrabHand[];seq:number;requestedAt:number;lease?:string;lastSent:number};
export class ObjectGrabber {
  private hold:Hold|undefined;
  private attempted=new Set<ObjectId>();
  private guidance='';
  private blockedUntil=0;
  constructor(private actor:()=>string,private snapshot:()=>ObjectSnapshot|undefined,private send:(command:ObjectCommand)=>boolean,private notify:(message:string)=>void){}
  blocksSelect(now=performance.now()){return !!this.hold||now<this.blockedUntil;}
  cancel(){const hold=this.hold;if(hold?.lease)this.command(hold,'cancel');this.hold=undefined;if(hold)this.blockedUntil=performance.now()+600;}
  reject(message:string){if(this.hold)this.cancel();this.notify(message);}
  private command(hold:Hold,action:ObjectCommand['action']){const snapshot=this.snapshot();if(!snapshot)return;this.send({type:'object_action',action,target:hold.target,revision:snapshot.revision,lease:hold.lease??'request',seq:++hold.seq,hands:hold.hands.map(h=>({x:h.position.x,y:h.position.y,z:h.position.z})),pose:hold.pose});}
  update(group:THREE.Group|undefined,hands:GrabHand[],enabled:boolean,now=performance.now()){
    const pressed=hands.filter(h=>h.pressed),snapshot=this.snapshot();
    if(!pressed.length)this.attempted.clear();
    if(!enabled||!group||!snapshot){this.cancel();return;}
    const roots=group.userData.grabbables as Partial<Record<ObjectId,THREE.Object3D>>|undefined;
    if(this.hold){
      const hold=this.hold,lease=snapshot.held.find(l=>l.target===hold.target&&l.owner===this.actor());
      if(lease)hold.lease=lease.lease;
      if(!roots?.[hold.target]||hold.start.some(h=>!hands.some(next=>next.side===h.side))){this.cancel();this.notify('Suivi perdu : prise annulée.');return;}
      if(!hold.lease){if(now-hold.requestedAt>2000){this.hold=undefined;this.notify('Prise non confirmée. Relâchez et réessayez.');}return;}
      if(!lease){this.hold=undefined;this.notify('La réservation a expiré.');return;}
      const current=hold.start.map(h=>hands.find(next=>next.side===h.side)!);
      if(current.some(h=>!h.pressed)){
        this.command(hold,'drop');this.notify('Objet posé ; position partagée dans la session.');
        this.hold=undefined;this.blockedUntil=now+600;return;
      }
      hold.hands=current;hold.pose=gripTransform(hold.start,current,hold.original);const node=roots[hold.target]!;node.position.set(hold.pose.x,hold.pose.y,hold.pose.z);node.rotation.y=hold.pose.yaw;
      if(now-hold.lastSent>=220){this.command(hold,'move');hold.lastSent=now;}
    }else if(pressed.length&&now>=this.blockedUntil&&roots){
      group.updateMatrixWorld(true);const rootInverse=new THREE.Matrix4().copy(group.matrixWorld).invert();
      const candidate=Object.entries(roots).map(([target,node])=>{
        const box=new THREE.Box3().setFromObject(node!),local=box.applyMatrix4(rootInverse),near=pressed.filter(h=>local.distanceToPoint(h.position)<0.15);
        return {target:target as ObjectId,near,distance:Math.min(...pressed.map(h=>local.distanceToPoint(h.position)))};
      }).filter(c=>c.near.length&&!this.attempted.has(c.target)).sort((a,b)=>a.distance-b.distance)[0];
      const guidance=candidate?(snapshot.held.some(l=>l.target===candidate.target)?'Objet déjà tenu par un joueur.':candidate.near.length<requiredHands(candidate.target)?'Gros objet : approchez les deux mains et maintenez les deux prises.':''):'Approchez les mains de l’objet en maintenant la pince ou la poignée.';
      if(guidance&&guidance!==this.guidance)this.notify(guidance);this.guidance=guidance;
      if(candidate&&(candidate.near.length<requiredHands(candidate.target)||snapshot.held.some(l=>l.target===candidate.target)))return;
      if(candidate){const target=candidate.target,selected=candidate.near.slice(0,requiredHands(target)),pose=snapshot.poses[target]!;
        if(selected.length===2&&selected[0].position.distanceTo(selected[1].position)<0.12){this.notify('Écartez les deux mains sur l’objet.');}
        else {this.attempted.add(target);this.hold={target,start:selected.map(h=>({...h,position:h.position.clone()})),original:{...pose},pose:{...pose},hands:selected,seq:0,requestedAt:now,lastSent:now};this.command(this.hold,'grab');this.notify(requiredHands(target)===2?'Objet lourd : gardez les deux mains fermées.':'Objet saisi.');}
      }
    }
  }
}
