import { vortexView } from './vortex-view';
import { hasStaffAccess } from './portal-access';
import { vortexSign,signPlacement } from './vortex-sign';
import * as THREE from 'three';
import { label } from '../adventure-view';
import { staffView } from './staff-view';
import { STAFF_IDS,type PortalPublic } from '../../../server/src/portal/portal-types.js';
export function portalView(state:PortalPublic,slot=0){
  const unlocked=hasStaffAccess(state,slot);
  const clockOffset=state.serverNow-Date.now();
  const group=new THREE.Group(),c=state.config,roots:Record<string,THREE.Group>={};group.userData.grabbables=roots;
  state.players.forEach((player,i)=>{const position=state.staffPositions?.[STAFF_IDS[i]]??(state.staffPositions?undefined:{x:c.stand.x+(i-1.5)*0.42,y:c.stand.y+0.9,z:c.stand.z});if(!position)return;const staff=staffView(player.name+(slot===player.slot?' (vous)':''),c.staffs[i],player.claimed,i);staff.position.set(position.x,position.y,position.z);staff.userData.grabDisabled=slot>0&&slot!==player.slot;roots[STAFF_IDS[i]]=staff;group.add(staff);});
  const counter=label(`${state.players.filter(p=>p.claimed).length}/${state.config.playerCount??4} bâtons · ${state.players.filter(p=>p.crossed).length}/${state.config.playerCount??4} passages`,'#ffffff');counter.position.set(c.stand.x,c.stand.y+0.65,c.stand.z+0.28);group.add(counter);
  const gate=new THREE.Group();gate.position.set(c.portal.x,c.portal.height/2,c.portal.z);gate.rotation.y=c.portal.yaw;group.add(gate);
  const vortex=vortexView(c.portal.width,c.portal.height);vortex.group.scale.z=c.portal.direction;gate.add(vortex.group);
  const fogPositions=new Float32Array(180*3);for(let i=0;i<180;i++){const angle=i*2.39996,radius=.15+(i%12)/12*c.portal.width*.9;fogPositions[i*3]=Math.cos(angle)*radius;fogPositions[i*3+1]=(i%17)/17*c.portal.height;fogPositions[i*3+2]=Math.sin(angle)*radius;};const fogGeometry=new THREE.BufferGeometry();fogGeometry.setAttribute('position',new THREE.BufferAttribute(fogPositions,3));const fogMaterial=new THREE.PointsMaterial({color:0xb9e8ff,size:.055,transparent:true,opacity:0,depthWrite:false});const fog=new THREE.Points(fogGeometry,fogMaterial);fog.visible=false;gate.add(fog);const completedAt=Date.now();
  const sign=vortexSign(c.portal.width*.85,.72),signPose=signPlacement(c.portal,Math.min(.6,c.portal.exit*.7));sign.group.position.set(signPose.x,signPose.y,signPose.z);sign.group.rotation.y=signPose.yaw;group.add(sign.group);
  const confirm=label('Passage accessible : confirmer','#ffe082');confirm.position.set(c.portal.x+Math.cos(c.portal.yaw)*c.portal.width*.8,c.stand.y+.85,c.portal.z-Math.sin(c.portal.yaw)*c.portal.width*.8);confirm.userData.portalConfirm=true;group.add(confirm);
  if(unlocked&&state.players.find(p=>p.slot===slot)?.crossed){vortex.crossed();const message=label('Votre passage est validé','#ffe082');message.position.set(c.portal.x,1.4,c.portal.z);group.add(message);}
  // Floor arrow identifies the approach side without moving the XR camera.
  const arrow=new THREE.ArrowHelper(new THREE.Vector3(-Math.sin(c.portal.yaw)*c.portal.direction,0,-Math.cos(c.portal.yaw)*c.portal.direction),new THREE.Vector3(c.portal.x+Math.sin(c.portal.yaw)*c.portal.direction*c.portal.approach,0.03,c.portal.z+Math.cos(c.portal.yaw)*c.portal.direction*c.portal.approach),c.portal.approach,0xffe082,0.2,0.12);group.add(arrow);
  group.userData.animatePortal=(now:number)=>{for(const staff of Object.values(roots))staff.userData.animateStaff?.(now+clockOffset);const elapsed=now+clockOffset-state.startedAt;const completedElapsed=state.phase==='completed'?Math.max(0,now-completedAt):0;const amount=state.phase==='opening'?THREE.MathUtils.clamp(elapsed/5000,0.02,1):state.phase==='transitioning'?THREE.MathUtils.clamp(1-elapsed/2000,0.02,1):state.phase==='portal-open'?1:state.phase==='completed'?THREE.MathUtils.clamp(1-completedElapsed/10000,0,1):0.02;gate.scale.setScalar(Math.max(amount,.001));gate.visible=unlocked&&(['opening','portal-open','transitioning'].includes(state.phase)||state.phase==='completed');fog.visible=state.phase==='completed';fog.scale.setScalar(1+(1-amount)*2.5);fogMaterial.opacity=state.phase==='completed'?amount*.7:0;arrow.visible=unlocked&&state.phase==='portal-open';vortex.animate((now+clockOffset)/1000);confirm.visible=unlocked&&state.phase==='portal-open';sign.group.visible=unlocked&&state.phase==='portal-open';};
  group.userData.animatePortal(Date.now());
  return group;
}
