import { randomUUID } from 'node:crypto';
import { record,identifier } from './engine/validation.js';
import { libraryAsset,parseRoomObjects,type RoomObject } from './object-library.js';
import { parseRoom,validateObjectPlacement,type RoomModel } from './scene-schema.js';
import type { ObjectSnapshot } from './object-manipulation.js';

/** Authoring changes only. The existing RoomStore commits the result atomically. */
export function editRoomObjects(model:RoomModel,body:unknown,objects:ObjectSnapshot):RoomModel {
  const command=record(body,['action','asset','id','object','pose','revision','objectRevision']);
  const fields=Object.keys(command).sort().join(',');
  const expected=command.action==='add'?(command.pose===undefined?'action,asset,objectRevision,revision':'action,asset,objectRevision,pose,revision'):command.action==='update'?'action,object,objectRevision,revision':command.action==='remove'?'action,id,objectRevision,revision':command.action==='save'?'action,objectRevision,revision':'';
  if(fields!==expected||!expected)throw Error('Commande de bibliothèque invalide.');
  if(command.objectRevision!==objects.revision||objects.held.length)throw Error('Objets modifiés ou encore tenus. Relâchez et actualisez.');
  const next=structuredClone(model);
  next.objects??={version:1,items:[]};
  // Preserve all current library placements when editing any one item.
  for(const item of next.objects.items){const pose=objects.poses[`prop:${item.id}`];if(pose)item.pose={x:pose.x,y:pose.y,z:pose.z,yaw:pose.yaw,scale:pose.scale??1};}
  if(command.action==='add'){
    const asset=libraryAsset(identifier(command.asset));if(!asset)throw Error('Objet inconnu.');
    if(next.objects.items.length>=32)throw Error('Maximum 32 objets par pièce.');
    const item:RoomObject={id:randomUUID(),asset:asset.id,...(asset.version?{assetVersion:asset.version}:{}),name:asset.name,movable:asset.defaultMovable??true,pose:{x:0,y:0,z:0,yaw:asset.defaultYaw??0,scale:1}};
    if(command.pose!==undefined){
      const placed=parseRoomObjects({version:1,items:[{...item,pose:command.pose}]}).items[0];
      validateObjectPlacement(model,placed);next.objects.items.push(placed);return parseRoom(next);
    }
    const xs=model.floor.map(p=>p.x),zs=model.floor.map(p=>p.z),cx=(Math.min(...xs)+Math.max(...xs))/2,cz=(Math.min(...zs)+Math.max(...zs))/2;
    const candidates:{x:number;z:number;score:number}[]=[];
    for(let x=Math.min(...xs);x<=Math.max(...xs);x+=.25)for(let z=Math.min(...zs);z<=Math.max(...zs);z+=.25){
      const pose={...item.pose,x,z};try{validateObjectPlacement(model,item,pose);}catch{continue;}
      if(model.obstacles.some(o=>Math.abs(x-o.x)<(o.width+asset.size.width)/2&&Math.abs(z-o.z)<(o.depth+asset.size.depth)/2))continue;
      if(next.objects.items.some(other=>{const size=libraryAsset(other.asset,other.assetVersion??1)!.size;return Math.abs(x-other.pose.x)<(asset.size.width+size.width*other.pose.scale)/2+.05&&Math.abs(z-other.pose.z)<(asset.size.depth+size.depth*other.pose.scale)/2+.05;}))continue;
      candidates.push({x,z,score:Math.hypot(x-cx,z-cz)});
    }
    const point=candidates.sort((a,b)=>a.score-b.score)[0];
    if(!point)throw Error('Aucun emplacement libre assez grand pour cet objet.');
    item.pose.x=point.x;item.pose.z=point.z;next.objects.items.push(item);
  }else if(command.action==='update'){
    const raw=record(command.object,['id','asset','assetVersion','name','movable','pose']);
    const index=next.objects.items.findIndex(item=>item.id===raw.id);
    if(index<0||raw.asset!==next.objects.items[index].asset||raw.assetVersion!==next.objects.items[index].assetVersion)throw Error('Objet absent ou modèle différent.');
    next.objects.items[index]=raw as unknown as RoomObject;
  }else if(command.action==='remove'){
    const id=identifier(command.id),index=next.objects.items.findIndex(item=>item.id===id);
    if(index<0)throw Error('Objet absent.');next.objects.items.splice(index,1);
  }
  return parseRoom(next);
}
