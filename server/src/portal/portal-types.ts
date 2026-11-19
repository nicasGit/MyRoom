export type PassageMethod='physical-xr'|'virtual-crossing'|'camera-confirmation'|'accessible-confirmation'|'admin'|'simulation';
import { record,integer,bool,list,text } from '../engine/validation.js';
import { inside,type RoomModel } from '../scene-schema.js';
export type Vec3={x:number;y:number;z:number};
export type StaffId='staff1'|'staff2'|'staff3'|'staff4';
export const STAFF_IDS:StaffId[]=['staff1','staff2','staff3','staff4'];
export type PortalConfig={playerCount?:number;enabled:boolean;confirmed:boolean;stand:Vec3;portal:{x:number;z:number;yaw:number;width:number;height:number;direction:1|-1;approach:number;exit:number};staffs:{color:string;symbol:string;length:number;crystal:number}[]};
export type PortalPhase='waiting'|'collecting'|'opening'|'portal-open'|'transitioning'|'completed';
export type PortalPublic={staffPositions?:Partial<Record<StaffId,Vec3>>;serverNow:number;sessionId:string;revision:number;active:boolean;phase:PortalPhase;config:PortalConfig;simulation:boolean;startedAt:number;players:{slot:number;name:string;present:boolean;ready:boolean;claimed:boolean;crossed:boolean;validationMethod?:PassageMethod}[]};
export const DEFAULT_PORTAL:PortalConfig={enabled:true,confirmed:false,stand:{x:2,y:0,z:2},portal:{x:4,z:3,yaw:0,width:1.4,height:2.2,direction:1,approach:1,exit:1},staffs:[{color:'#80efb0',symbol:'♣',length:0.6,crystal:0.07},{color:'#ffd166',symbol:'★',length:0.6,crystal:0.07},{color:'#448aff',symbol:'ϟ',length:0.6,crystal:0.07},{color:'#bc7bff',symbol:'◎',length:0.6,crystal:0.07}]};
export function number(value:unknown,min:number,max:number){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw Error('Valeur numérique hors limites.');return value;}
export function vec3(value:unknown):Vec3{const p=record(value,['x','y','z']);return {x:number(p.x,-30,30),y:number(p.y,-2,4),z:number(p.z,-30,30)};}
export function parsePortalConfig(value:unknown):PortalConfig{
  const c=record(value,['playerCount','enabled','confirmed','stand','portal','staffs']),p=record(c.portal,['x','z','yaw','width','height','direction','approach','exit']);
  const staffs=list(c.staffs,4).map(value=>{const s=record(value,['color','symbol','length','crystal']),color=text(s.color,7);if(!/^#[0-9a-f]{6}$/i.test(color))throw Error('Couleur #RRGGBB attendue.');return {color,symbol:text(s.symbol,8),length:number(s.length,0.3,1),crystal:number(s.crystal,0.03,0.12)};});
  if(staffs.length!==4||p.direction!==1&&p.direction!==-1)throw Error('Quatre bâtons et sens ±1 attendus.');
  return {...(c.playerCount===undefined?{}:{playerCount:integer(c.playerCount,1,4)}),enabled:bool(c.enabled),confirmed:bool(c.confirmed),stand:vec3(c.stand),portal:{x:number(p.x,-30,30),z:number(p.z,-30,30),yaw:number(p.yaw,-Math.PI,Math.PI),width:number(p.width,0.8,2),height:number(p.height,1.8,2.8),direction:p.direction,approach:number(p.approach,0.7,2),exit:number(p.exit,0.7,2)},staffs};
}
export function validatePlacement(c:PortalConfig,room:RoomModel|null){
  if(!room)throw Error('Choisissez une pièce.');if(c.portal.height>room.height||c.stand.y<0||c.stand.y>0.5)throw Error('Hauteur incompatible avec la pièce.');
  const clear=(x:number,z:number)=>inside({x,z},room.floor)&&!room.obstacles.some(o=>Math.abs(x-o.x)<o.width/2+0.25&&Math.abs(z-o.z)<o.depth/2+0.25);
  // Sample the complete walking corridor, not only the portal center.
  const p=c.portal,nx=Math.sin(p.yaw)*p.direction,nz=Math.cos(p.yaw)*p.direction;
  for(let u=-p.width/2-0.25;u<=p.width/2+0.251;u+=0.1)for(let d=-p.exit;d<=p.approach+0.001;d+=0.1)if(!clear(p.x+Math.cos(p.yaw)*u+nx*d,p.z-Math.sin(p.yaw)*u+nz*d))throw Error('Couloir du portail hors pièce ou dans un obstacle déclaré.');
  if(!clear(c.stand.x,c.stand.z))throw Error('Repère d’informations hors pièce ou dans un obstacle déclaré.');
}
export type PortalCommand={type:'portal_action';sessionId:string;revision:number;commandId:string;action:'pose'|'unready'|'confirm';seq:number;position?:Vec3};
export function parsePortalCommand(value:unknown):PortalCommand{
  const c=record(value,['type','sessionId','revision','commandId','action','seq','position']);
  if(c.type!=='portal_action'||!['pose','unready','confirm'].includes(String(c.action)))throw Error('Commande portail invalide.');
  if(c.action==='pose'&&c.position===undefined||c.action!=='pose'&&c.position!==undefined)throw Error('Pose inattendue ou absente.');
  return {type:'portal_action',sessionId:text(c.sessionId,64),revision:integer(c.revision),commandId:text(c.commandId,64),seq:integer(c.seq),action:c.action as PortalCommand['action'],...(c.position===undefined?{}:{position:vec3(c.position)})};
}
