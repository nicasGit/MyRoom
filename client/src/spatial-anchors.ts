import * as THREE from 'three';

type StoredAnchors={a:string;b:string};
const key=(roomId:string)=>`myroom:anchors:${roomId}`;
export function readSpatialAnchors(roomId:string):StoredAnchors|undefined{try{const value=JSON.parse(localStorage.getItem(key(roomId))??'null');if(value&&typeof value.a==='string'&&typeof value.b==='string')return value;}catch{}return undefined;}
export function writeSpatialAnchors(roomId:string,value:StoredAnchors){try{localStorage.setItem(key(roomId),JSON.stringify(value));}catch{} }
export async function createSpatialAnchorHandles(frame:XRFrame,reference:XRReferenceSpace,a:THREE.Vector3,b:THREE.Vector3){
  if(!frame.createAnchor)return;
  const pose=(point:THREE.Vector3)=>new XRRigidTransform({x:point.x,y:point.y,z:point.z,w:1},{x:0,y:0,z:0,w:1});
  const anchors=await Promise.all([frame.createAnchor(pose(a),reference),frame.createAnchor(pose(b),reference)]);
  if(!anchors[0].requestPersistentHandle||!anchors[1].requestPersistentHandle){anchors.forEach(anchor=>anchor.delete());return;}
  const handles=await Promise.all(anchors.map(anchor=>anchor.requestPersistentHandle!()));anchors.forEach(anchor=>anchor.delete());return {a:handles[0],b:handles[1]};
}
export async function restoreSpatialAnchors(session:XRSession,roomId:string){const saved=readSpatialAnchors(roomId);if(!saved||!session.restorePersistentAnchor)return;try{return await Promise.all([session.restorePersistentAnchor(saved.a),session.restorePersistentAnchor(saved.b)]);}catch{return;}}
