import { DEFAULT_PORTAL,parsePortalConfig,validatePlacement,type PortalConfig } from './portal-types.js';
import type { RoomModel } from '../scene-schema.js';
import { staffLayout } from './staff-layout.js';

export function configurePortalPlacement(previous:PortalConfig,input:unknown,room:RoomModel|null){
  const next=parsePortalConfig(input);
  const moved=JSON.stringify([previous.stand,previous.portal])!==JSON.stringify([next.stand,next.portal]);
  if(next.enabled&&(moved||!previous.confirmed&&next.confirmed))validatePlacement(next,room);
  else if(next.enabled){try{validatePlacement(next,room);}catch{next.confirmed=false;}}
  return next;
}

// A proposal only: never mark the user's physical space as confirmed.
export function suggestPortalPlacement(room:RoomModel|null,previous:PortalConfig=DEFAULT_PORTAL):PortalConfig{
  if(!room)throw Error('Choisissez une pièce avant de placer le portail.');
  const xs=room.floor.map(p=>p.x),zs=room.floor.map(p=>p.z),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
  const center={x:(minX+maxX)/2,z:(minZ+maxZ)/2},points=[center];
  for(let ix=1;ix<8;ix++)for(let iz=1;iz<8;iz++)points.push({x:minX+(maxX-minX)*ix/8,z:minZ+(maxZ-minZ)*iz/8});
  points.sort((a,b)=>Math.hypot(a.x-center.x,a.z-center.z)-Math.hypot(b.x-center.x,b.z-center.z));
  for(const compact of [false,true])for(const point of points)for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    const config=parsePortalConfig({...previous,confirmed:false,stand:{...point,y:0},portal:{...previous.portal,...point,yaw,height:Math.min(previous.portal.height,room.height),...(compact?{width:.8,approach:.7,exit:.7}:{})}});
    try{validatePlacement(config,room);if(Object.keys(staffLayout(config,room)).length!==(config.playerCount??4))continue;return config;}catch{}
  }
  throw Error('Aucun couloir libre avec assez de place pour les bâtons. Réduisez le groupe ou corrigez les obstacles et le portail.');
}
