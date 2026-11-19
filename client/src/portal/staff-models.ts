import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const STAFF_MODELS=[
  '/models/staffs/adventurers/staff.gltf',
  '/models/staffs/adventurers/wand.gltf',
  '/models/staffs/skeletons/Skeleton_Staff.gltf',
  '/models/staffs/wizard/staff.glb',
] as const;
const templates=new Map<string,Promise<THREE.Group>>();

export function fitStaff(model:THREE.Object3D,height:number){
  model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
  if(!Number.isFinite(size.y)||size.y<=0)throw Error('Empty staff model');
  const scale=height/size.y,center=bounds.getCenter(new THREE.Vector3());
  const group=new THREE.Group();model.position.sub(new THREE.Vector3(center.x,bounds.min.y,center.z));group.add(model);group.scale.setScalar(scale);return group;
}

export async function loadStaffModel(index:number,height:number){
  const url=STAFF_MODELS[index%STAFF_MODELS.length];
  let pending=templates.get(url);
  if(!pending){pending=new GLTFLoader().loadAsync(url).then(gltf=>gltf.scene);templates.set(url,pending);pending.catch(()=>templates.delete(url));}
  const model=(await pending).clone(true);
  model.traverse(node=>{
    const mesh=node as THREE.Mesh;if(!mesh.isMesh)return;
    mesh.geometry=mesh.geometry.clone();
    const clone=(source:THREE.MeshStandardMaterial)=>new THREE.MeshBasicMaterial({color:source.color,map:source.map?.clone()??null,side:source.side,transparent:source.transparent,opacity:source.opacity,alphaTest:source.alphaTest});
    mesh.material=Array.isArray(mesh.material)?mesh.material.map(m=>clone(m as THREE.MeshStandardMaterial)):clone(mesh.material as THREE.MeshStandardMaterial);
  });
  return fitStaff(model,height);
}
