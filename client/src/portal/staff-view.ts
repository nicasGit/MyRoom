import * as THREE from 'three';
import { label } from '../adventure-view';
import type { PortalConfig } from '../../../server/src/portal/portal-types.js';
export function staffView(name:string,config:PortalConfig['staffs'][number],claimed:boolean){
  const group=new THREE.Group(),material=new THREE.MeshBasicMaterial({color:config.color});
  const handle=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.025,config.length,8),new THREE.MeshBasicMaterial({color:0x6d4c41}));handle.position.y=config.length/2;group.add(handle);
  const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(config.crystal),material);crystal.position.y=config.length+config.crystal;group.add(crystal);
  const halo=new THREE.Mesh(new THREE.SphereGeometry(config.crystal*1.7,12,8),new THREE.MeshBasicMaterial({color:config.color,transparent:true,opacity:claimed?0.3:0.08,depthWrite:false}));halo.position.copy(crystal.position);group.add(halo);
  const title=label(`${config.symbol} ${name}`,config.color);title.scale.set(0.4,0.16,1);title.position.set(0,config.length+0.24,0);group.add(title);
  return group;
}
