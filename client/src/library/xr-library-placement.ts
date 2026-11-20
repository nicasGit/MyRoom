import * as THREE from 'three';
import { libraryAsset,type LibraryPose } from '../../../server/src/object-library.js';
import { validateObjectPlacement,type RoomModel } from '../../../server/src/scene-schema.js';
import { loadLibraryModel } from './object-view';
import { disposeGroup } from '../model-view';

export type PlacementChoice={asset:string;height:number;yaw:number;scale:number};
/** Ray intersection with a manually chosen horizontal plane, not surface detection. */
export function placementPose(origin:THREE.Vector3,direction:THREE.Vector3,choice:PlacementChoice):LibraryPose|undefined{
  if(![...origin.toArray(),...direction.toArray(),choice.height,choice.yaw,choice.scale].every(Number.isFinite)||Math.abs(direction.y)<.05)return;
  const distance=(choice.height-origin.y)/direction.y;
  if(distance<0||distance>8)return;
  const point=origin.clone().addScaledVector(direction,distance);
  return {x:point.x,y:choice.height,z:point.z,yaw:choice.yaw,scale:choice.scale};
}
export class XRLibraryPlacement {
  readonly group=new THREE.Group();
  private key='';private preview?:THREE.Group;private marker?:THREE.LineSegments<THREE.EdgesGeometry,THREE.LineBasicMaterial>;
  pose?:LibraryPose;
  update(choice:PlacementChoice|undefined,room:RoomModel|undefined,origin?:THREE.Vector3,direction?:THREE.Vector3){
    const key=choice?.asset??'';
    if(key!==this.key){
      this.clear();this.key=key;
      const asset=choice&&libraryAsset(choice.asset);
      if(asset){
        const preview=new THREE.Group();this.preview=preview;this.group.add(preview);
        const box=new THREE.Mesh(new THREE.BoxGeometry(asset.size.width,asset.size.height,asset.size.depth),new THREE.MeshBasicMaterial({color:0x67e8f9,wireframe:true}));box.position.y=asset.size.height/2;preview.add(box);
        void loadLibraryModel({asset:asset.id,assetVersion:asset.version}).then(model=>{
          if(this.preview!==preview){disposeGroup(model);return;}
          model.traverse(node=>{const mesh=node as THREE.Mesh;if(!mesh.isMesh)return;for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){material.transparent=true;material.opacity=.55;material.depthWrite=false;}});
          disposeGroup(box);preview.add(model);
        }).catch(()=>{});
        const geometry=new THREE.BoxGeometry(asset.size.width,asset.size.height,asset.size.depth);
        this.marker=new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color:0x67e8f9}));geometry.dispose();
        this.marker.position.y=asset.size.height/2;preview.add(this.marker);
      }
    }
    this.pose=undefined;this.group.visible=false;
    const preview=this.preview,asset=choice&&libraryAsset(choice.asset);
    if(!choice||!asset||!preview||!room||!origin||!direction)return;
    const pose=placementPose(origin,direction,choice);if(!pose)return;
    preview.position.set(pose.x,pose.y,pose.z);preview.rotation.y=pose.yaw;preview.scale.setScalar(pose.scale);
    this.group.visible=true;
    try{validateObjectPlacement(room,{id:'preview',asset:asset.id,assetVersion:asset.version,name:asset.name,movable:true,pose});this.pose=pose;}catch{/* red preview, server also validates */}
    if(this.marker)this.marker.material.color.setHex(this.pose?0x80efb0:0xff5555);
  }
  clear(){this.pose=undefined;this.key='';this.preview=undefined;this.marker=undefined;for(const child of [...this.group.children])disposeGroup(child);this.group.visible=false;}
}
