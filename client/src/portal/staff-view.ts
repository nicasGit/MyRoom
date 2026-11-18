import * as THREE from 'three';
import { label } from '../adventure-view';
import type { PortalConfig } from '../../../server/src/portal/portal-types.js';
export function staffView(name:string,config:PortalConfig['staffs'][number],claimed:boolean){
  const group=new THREE.Group(),visual=new THREE.Group(),material=new THREE.MeshBasicMaterial({color:config.color});group.add(visual);
  const handle=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.025,config.length,8),new THREE.MeshBasicMaterial({color:0x6d4c41}));handle.position.y=config.length/2;visual.add(handle);
  const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(config.crystal),material);crystal.position.y=config.length+config.crystal;visual.add(crystal);
  const halo=new THREE.Mesh(new THREE.SphereGeometry(config.crystal*1.7,12,8),new THREE.MeshBasicMaterial({color:config.color,transparent:true,opacity:claimed?0.3:0.08,depthWrite:false}));halo.position.copy(crystal.position);visual.add(halo);
  const aura=new THREE.Mesh(new THREE.TorusGeometry(0.18,0.006,6,40),new THREE.MeshBasicMaterial({color:config.color,transparent:true,opacity:.35,depthWrite:false}));aura.position.y=config.length/2;visual.add(aura);
  const orbit=new THREE.Mesh(new THREE.TorusGeometry(0.2,0.003,6,40),new THREE.MeshBasicMaterial({color:config.color,transparent:true,opacity:.2,depthWrite:false}));orbit.position.copy(aura.position);orbit.rotation.y=1.2;visual.add(orbit);
  const title=label(`${config.symbol} ${name}`,config.color);title.scale.set(0.4,0.16,1);title.position.set(0,config.length+0.24,0);visual.add(title);
  const phase=config.length+config.color.split('').reduce((sum,char)=>sum+char.charCodeAt(0),0);
  group.userData.animateStaff=(time:number)=>{const breath=(Math.sin(time/650+phase)+1)/2;
    visual.position.y=group.userData.held?0:Math.sin(time/950+phase)*.025;
    aura.scale.set(1+breath*.12,(config.length/.36)*(1+breath*.08),1);aura.material.opacity=.2+breath*.25;
    orbit.scale.copy(aura.scale);orbit.rotation.z=Math.sin(time/1800+phase)*.2;
    halo.scale.setScalar(1+breath*.2);halo.material.opacity=(claimed ? .22 : .1)+breath*.12;
  };
  return group;
}
