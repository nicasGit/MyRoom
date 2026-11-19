import { vortexView } from './vortex-view';
import * as THREE from 'three';
import { label } from '../adventure-view';
import { staffView } from './staff-view';
import { STAFF_IDS,type PortalPublic } from '../../../server/src/portal/portal-types.js';
export function portalView(state:PortalPublic,slot=0){
  const clockOffset=state.serverNow-Date.now();
  const group=new THREE.Group(),c=state.config,roots:Record<string,THREE.Group>={};group.userData.grabbables=roots;
  state.players.forEach((player,i)=>{const position=state.staffPositions?.[STAFF_IDS[i]]??(state.staffPositions?undefined:{x:c.stand.x+(i-1.5)*0.42,y:c.stand.y+0.9,z:c.stand.z});if(!position)return;const staff=staffView(player.name+(slot===player.slot?' (vous)':''),c.staffs[i],player.claimed,i);staff.position.set(position.x,position.y,position.z);staff.userData.grabDisabled=slot>0&&slot!==player.slot;roots[STAFF_IDS[i]]=staff;group.add(staff);});
  const counter=label(`${state.players.filter(p=>p.claimed).length}/${state.config.playerCount??4} bâtons · ${state.players.filter(p=>p.crossed).length}/${state.config.playerCount??4} passages`,'#ffffff');counter.position.set(c.stand.x,c.stand.y+0.65,c.stand.z+0.28);group.add(counter);
  const gate=new THREE.Group();gate.position.set(c.portal.x,c.portal.height/2,c.portal.z);gate.rotation.y=c.portal.yaw;group.add(gate);
  const vortex=vortexView(c.portal.width,c.portal.height);vortex.group.scale.z=c.portal.direction;gate.add(vortex.group);
  const beams=c.staffs.map((staff,i)=>{const position=state.staffPositions?.[STAFF_IDS[i]]??c.stand;const start=new THREE.Vector3(position.x,position.y+staff.length,position.z),end=gate.position.clone(),delta=end.sub(start),beam=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,delta.length(),6),new THREE.MeshBasicMaterial({color:staff.color,transparent:true,opacity:0.5,depthWrite:false}));beam.position.copy(start).addScaledVector(delta,0.5);beam.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());group.add(beam);return beam;});
  const beamStart=new THREE.Vector3(),beamDelta=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  group.userData.updateBeams=()=>beams.forEach((beam,i)=>{const staff=roots[STAFF_IDS[i]];if(!staff){beam.visible=false;return;}staff.updateMatrix();beamStart.set(0,c.staffs[i].length+c.staffs[i].crystal+(staff.children[0]?.position.y??0),0).applyMatrix4(staff.matrix);beamDelta.copy(gate.position).sub(beamStart);const length=beamDelta.length();beam.position.copy(beamStart).addScaledVector(beamDelta,0.5);if(length>0.001)beam.quaternion.setFromUnitVectors(up,beamDelta.divideScalar(length));beam.scale.y=length/(beam.geometry as THREE.CylinderGeometry).parameters.height;});
  const confirm=label('Passage accessible : confirmer','#ffe082');confirm.position.set(c.stand.x,c.stand.y+1.3,c.stand.z+0.3);confirm.userData.portalConfirm=true;group.add(confirm);
  if(state.players.find(p=>p.slot===slot)?.crossed){vortex.crossed();const message=label('Votre passage est validé','#ffe082');message.position.set(c.portal.x,1.4,c.portal.z);group.add(message);}
  // Floor arrow identifies the approach side without moving the XR camera.
  const arrow=new THREE.ArrowHelper(new THREE.Vector3(-Math.sin(c.portal.yaw)*c.portal.direction,0,-Math.cos(c.portal.yaw)*c.portal.direction),new THREE.Vector3(c.portal.x+Math.sin(c.portal.yaw)*c.portal.direction*c.portal.approach,0.03,c.portal.z+Math.cos(c.portal.yaw)*c.portal.direction*c.portal.approach),c.portal.approach,0xffe082,0.2,0.12);group.add(arrow);
  group.userData.animatePortal=(now:number)=>{for(const staff of Object.values(roots))staff.userData.animateStaff?.(now+clockOffset);group.userData.updateBeams();const elapsed=now+clockOffset-state.startedAt;const amount=state.phase==='opening'?THREE.MathUtils.clamp(elapsed/5000,0.02,1):state.phase==='transitioning'?THREE.MathUtils.clamp(1-elapsed/2000,0.02,1):state.phase==='portal-open'?1:0.02;gate.scale.setScalar(amount);vortex.animate((now+clockOffset)/1000);beams.forEach((b,i)=>b.visible=!!roots[STAFF_IDS[i]]&&(state.phase==='opening'||state.phase==='portal-open'));confirm.visible=state.phase==='portal-open';};
  return group;
}
