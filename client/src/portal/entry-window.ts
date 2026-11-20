import * as THREE from 'three';
import type { PortalConfig,Vec3 } from '../../../server/src/portal/portal-types.js';

/** Intersection with the actual elliptical aperture, in the common room frame. */
export function crossesEntry(a:Vec3,b:Vec3,p:PortalConfig['portal']){
  const distance=(q:Vec3)=>((q.x-p.x)*Math.sin(p.yaw)+(q.z-p.z)*Math.cos(p.yaw))*p.direction;
  const before=distance(a),after=distance(b);
  if(before===after||before*after>0)return false;
  const t=before/(before-after);if(t<0||t>1)return false;
  const x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,y=a.y+(b.y-a.y)*t;
  const u=(x-p.x)*Math.cos(p.yaw)-(z-p.z)*Math.sin(p.yaw);
  return (u/(p.width/2))**2+((y-p.height/2)/(p.height/2))**2<=1;
}

/** Write transparent pixels after the virtual world: native AR shows through. */
export function entryWindow(){
  const mesh=new THREE.Mesh(new THREE.CircleGeometry(.5,96),new THREE.MeshBasicMaterial({color:0,opacity:0,transparent:true,blending:THREE.NoBlending,side:THREE.DoubleSide,depthTest:false,depthWrite:false}));
  mesh.name='entry-passthrough-window';mesh.renderOrder=10000;mesh.frustumCulled=false;
  return mesh;
}

