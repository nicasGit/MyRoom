import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { libraryAsset,type RoomObject } from '../../../server/src/object-library.js';
import type { RoomModel } from '../../../server/src/scene-schema.js';
import type { ObjectId } from '../../../server/src/object-manipulation.js';
import { disposeGroup } from '../model-view';

const templates=new Map<string,Promise<THREE.Group>>();
async function modelFor(item:RoomObject){
  const asset=libraryAsset(item.asset)!;
  let pending=templates.get(asset.model);
  if(!pending){pending=new GLTFLoader().loadAsync(asset.model).then(gltf=>gltf.scene);templates.set(asset.model,pending);pending.catch(()=>templates.delete(asset.model));}
  const model=(await pending).clone(true);
  model.traverse(node=>{
    const mesh=node as THREE.Mesh;if(!mesh.isMesh)return;
    mesh.geometry=mesh.geometry.clone();
    const copy=(material:THREE.Material)=>{
      const source=material as THREE.MeshStandardMaterial;
      return new THREE.MeshBasicMaterial({color:source.color,map:source.map?.clone()??null,side:source.side,transparent:source.transparent,opacity:source.opacity,alphaTest:source.alphaTest});
    };
    mesh.material=Array.isArray(mesh.material)?mesh.material.map(copy):copy(mesh.material);
  });
  model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  if(size.y<=0){disposeGroup(model);throw Error('Modèle vide');}
  model.position.sub(new THREE.Vector3(center.x,bounds.min.y,center.z));
  const normalized=new THREE.Group();normalized.add(model);normalized.scale.setScalar(asset.size.height/size.y);
  return normalized;
}
/** Same object roots for WebXR, desktop, camera overlay and previews. */
export function addLibraryObjects(group:THREE.Group,room:RoomModel){
  const roots=(group.userData.grabbables??={}) as Partial<Record<ObjectId,THREE.Object3D>>;
  for(const item of room.objects?.items??[]){
    const asset=libraryAsset(item.asset)!;
    const node=new THREE.Group();node.name=item.name;node.userData.libraryObject=item.id;
    node.userData.grabDisabled=!item.movable;
    node.userData.grabBounds=new THREE.Box3(new THREE.Vector3(-asset.size.width/2,0,-asset.size.depth/2),new THREE.Vector3(asset.size.width/2,asset.size.height,asset.size.depth/2));
    node.position.set(item.pose.x,item.pose.y,item.pose.z);node.rotation.y=item.pose.yaw;node.scale.setScalar(item.pose.scale);
    const placeholder=new THREE.Mesh(new THREE.BoxGeometry(asset.size.width,asset.size.height,asset.size.depth),new THREE.MeshBasicMaterial({color:0x94a3b8,wireframe:true}));placeholder.position.y=asset.size.height/2;node.add(placeholder);
    roots[`prop:${item.id}`]=node;group.add(node);
    void modelFor(item).then(model=>{
      if(node.userData.disposed||group.userData.disposed){disposeGroup(model);return;}
      disposeGroup(placeholder);node.add(model);
    }).catch(()=>{if(!node.userData.disposed){placeholder.material.color.set(0xef4444);node.userData.modelError=true;}});
  }
  return group;
}
