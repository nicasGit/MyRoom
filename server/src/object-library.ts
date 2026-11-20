import { record, list, identifier, text, bool } from './engine/validation.js';

export type LibraryAsset = {
  id: string; name: string; category: 'mobilier'|'accessoires'|'decoration';
  model: string; size: {width:number;height:number;depth:number}; hands: 1|2;
};
const asset=(id:string,name:string,file:string,category:LibraryAsset['category'],width:number,height:number,depth:number,hands:1|2):LibraryAsset=>({
  id,name,category,model:`/models/library/kenney-furniture/${file}.glb`,size:{width,height,depth},hands,
});
/** Versioned, local-only catalogue. New packs can append validated definitions. */
export const OBJECT_CATALOG = {
  version: 1, pack: 'kenney-furniture-2', license: 'CC0-1.0',
  source: 'https://kenney.nl/assets/furniture-kit',
  assets: [
    asset('kenney-table','Table','table','mobilier',1.94,.75,1.03,2),
    asset('kenney-chair','Chaise','chair','mobilier',.41,.95,.41,2),
    asset('kenney-desk','Bureau','desk','mobilier',1.44,.75,.77,2),
    asset('kenney-bed','Lit','bedSingle','mobilier',1.22,.8,2.4,2),
    asset('kenney-cabinet','Armoire','bookcaseClosedDoors','mobilier',.95,2,.59,2),
    asset('kenney-lamp','Lampe','lampRoundTable','accessoires',.17,.35,.20,1),
    asset('kenney-books','Livres','books','accessoires',.32,.22,.21,1),
    asset('kenney-plant','Plante','plantSmall1','decoration',.21,.3,.21,1),
  ],
} as const;
export type LibraryPose={x:number;y:number;z:number;yaw:number;scale:number};
export type RoomObject={id:string;asset:string;name:string;movable:boolean;pose:LibraryPose};
export type RoomObjects={version:1;items:RoomObject[]};
export const isLibraryObjectId=(id:unknown):id is `prop:${string}`=>typeof id==='string'&&/^prop:[a-z0-9][a-z0-9_-]{0,63}$/.test(id);
export const libraryAsset=(id:string)=>OBJECT_CATALOG.assets.find(asset=>asset.id===id);
export function libraryNumber(value:unknown,min:number,max:number):number {
  if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw Error('Dimension ou position d’objet invalide.');
  return value;
}
export function parseRoomObjects(value:unknown):RoomObjects {
  const data=record(value,['version','items']);
  if(data.version!==1||Object.keys(data).length!==2)throw Error('Version de bibliothèque d’objets inconnue.');
  const items=list(data.items,32).map(value=>{
    const item=record(value,['id','asset','name','movable','pose']);
    if(Object.keys(item).length!==5)throw Error('Définition d’objet incomplète.');
    const id=identifier(item.id),asset=identifier(item.asset);
    if(!libraryAsset(asset))throw Error('Objet absent du catalogue.');
    const raw=record(item.pose,['x','y','z','yaw','scale']);
    if(Object.keys(raw).length!==5)throw Error('Transformation d’objet incomplète.');
    const pose={x:libraryNumber(raw.x,-30,30),y:libraryNumber(raw.y,0,6),z:libraryNumber(raw.z,-30,30),yaw:libraryNumber(raw.yaw,-Math.PI,Math.PI),scale:libraryNumber(raw.scale,.1,3)};
    return {id,asset,name:text(item.name,64),movable:bool(item.movable),pose};
  });
  if(new Set(items.map(item=>item.id)).size!==items.length)throw Error('Identifiant d’objet dupliqué.');
  return {version:1,items};
}
export function objectFootprint(item:RoomObject,pose:LibraryPose=item.pose){
  const asset=libraryAsset(item.asset)!;
  const w=asset.size.width*pose.scale/2,d=asset.size.depth*pose.scale/2,c=Math.cos(pose.yaw),s=Math.sin(pose.yaw);
  return [[-w,-d],[w,-d],[w,d],[-w,d]].map(([x,z])=>({x:pose.x+c*x+s*z,z:pose.z-s*x+c*z}));
}
