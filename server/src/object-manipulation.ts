import { PUZZLE_ITEMS,inside,puzzlePanel,findPuzzlePanel,type PuzzleItem,type RoomModel } from './scene-schema.js';
import { record,integer,list,text } from './engine/validation.js';
export type ObjectId=PuzzleItem|'panel';
export type ObjectPose={x:number;y:number;z:number;yaw:number};
export type HandPoint={x:number;y:number;z:number};
export type ObjectCommand={type:'object_action';action:'grab'|'move'|'drop'|'cancel';target:ObjectId;revision:number;lease:string;seq:number;hands:HandPoint[];pose:ObjectPose};
export type ObjectSnapshot={revision:number;poses:Partial<Record<ObjectId,ObjectPose>>;held:{target:ObjectId;owner:string;lease:string;expiresAt:number}[]};
export const requiredHands=(target:ObjectId)=>['chest','table','panel'].includes(target)?2:1;
function point(value:unknown){const p=record(value,['x','y','z']);for(const n of [p.x,p.y,p.z])if(typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>30)throw new Error('Coordonnées invalides.');return p as HandPoint;}
export function parseObjectCommand(value:unknown):ObjectCommand{
  const c=record(value,['type','action','target','revision','lease','seq','hands','pose']);
  if(Object.keys(c).length!==8||c.type!=='object_action'||!['grab','move','drop','cancel'].includes(String(c.action))||![...PUZZLE_ITEMS,'panel'].includes(c.target as ObjectId))throw new Error('Commande de manipulation invalide.');
  const pose=record(c.pose,['x','y','z','yaw']);const p=point({x:pose.x,y:pose.y,z:pose.z});if(typeof pose.yaw!=='number'||!Number.isFinite(pose.yaw)||Math.abs(pose.yaw)>Math.PI)throw new Error('Rotation invalide.');
  return {type:'object_action',action:c.action as ObjectCommand['action'],target:c.target as ObjectId,revision:integer(c.revision),lease:text(c.lease,64),seq:integer(c.seq),hands:list(c.hands,2).map(point),pose:{...p,yaw:pose.yaw}};
}
export class ObjectManipulation {
  private revision=0;
  private poses:Partial<Record<ObjectId,ObjectPose>>={};
  private held=new Map<ObjectId,{owner:string;lease:string;expiresAt:number;seq:number;original:ObjectPose}>();
  private key='';
  configure(model:RoomModel|null,epoch:number){const key=JSON.stringify([model,epoch]);if(key===this.key)return;this.key=key;this.held.clear();this.poses={};this.revision++;
    if(!model?.puzzles)return;for(const id of PUZZLE_ITEMS)this.poses[id]={...model.puzzles.points[id],y:model.puzzles.poses?.[id]?.y??0,yaw:model.puzzles.poses?.[id]?.yaw??0};
    const panel=puzzlePanel(model);if(panel)this.poses.panel={...panel.position,y:panel.height,yaw:panel.yaw};
  }
  snapshot():ObjectSnapshot{return {revision:this.revision,poses:structuredClone(this.poses),held:[...this.held].map(([target,l])=>({target,owner:l.owner,lease:l.lease,expiresAt:l.expiresAt}))};}
  maintain(players:readonly string[],now:number){let changed=false;for(const [id,lease] of this.held)if(!players.includes(lease.owner)||lease.expiresAt<=now){this.poses[id]=lease.original;this.held.delete(id);changed=true;}if(changed)this.revision++;return changed;}
  act(c:ObjectCommand,owner:string,model:RoomModel|null,now:number,leaseId:string){
    const reject=(message:string)=>({changed:false,message});if(!model?.puzzles||!this.poses[c.target])return reject('Objet indisponible.');
    const current=this.poses[c.target]!,held=this.held.get(c.target);
    if(c.action==='grab'){
      if(c.revision!==this.revision)return reject('Les objets ont changé. Réessayez.');
      if(held||[...this.held.values()].some(l=>l.owner===owner))return reject('Objet déjà tenu ou vous portez déjà un objet.');
    }else if(!held||held.owner!==owner||held.lease!==c.lease||c.seq<=held.seq)return reject('Prise expirée, propriétaire différent ou commande déjà reçue.');
    if(c.action==='cancel'){this.poses[c.target]=held!.original;this.held.delete(c.target);this.revision++;return {changed:true,message:'Déplacement annulé.'};}
    if(c.hands.length!==requiredHands(c.target)||c.hands.some(p=>Math.hypot(p.x-current.x,p.z-current.z)>1.6)||c.hands.length===2&&(Math.hypot(c.hands[0].x-c.hands[1].x,c.hands[0].y-c.hands[1].y,c.hands[0].z-c.hands[1].z)<0.12||Math.hypot(c.hands[0].x-c.hands[1].x,c.hands[0].y-c.hands[1].y,c.hands[0].z-c.hands[1].z)>1.8))return reject('Saisissez à proximité avec le nombre de mains requis.');
    if(c.action==='grab')this.held.set(c.target,{owner,lease:leaseId,expiresAt:now+4000,seq:c.seq,original:{...current}});
    else {
      if(c.pose.y<0||c.pose.y>model.height-0.2||!inside(c.pose,model.floor)||Math.hypot(c.pose.x-current.x,c.pose.y-current.y,c.pose.z-current.z)>0.8)return reject('Déplacement trop rapide, hors pièce ou hauteur invalide.');
      if(model.obstacles.some(o=>Math.abs(c.pose.x-o.x)<o.width/2&&Math.abs(c.pose.z-o.z)<o.depth/2&&c.pose.y<o.height-0.02))return reject('Objet dans un obstacle.');
      let pose={...c.pose};
      if(c.target==='panel') {const panel=findPuzzlePanel(model,c.pose);if(!panel)return reject('Aucun mur libre pour le panneau.');const p=puzzlePanel({...model,puzzles:{...model.puzzles,panel}})!;pose={...p.position,y:p.height,yaw:p.yaw};}
      this.poses[c.target]=pose;held!.seq=c.seq;held!.expiresAt=now+4000;
      if(c.action==='drop')this.held.delete(c.target);
    }
    this.revision++;return {changed:true,message:c.action==='drop'?'Objet posé.':c.action==='grab'?'Objet saisi.':'Objet déplacé.'};
  }
}
