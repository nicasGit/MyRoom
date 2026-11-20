import { record, list, identifier, text, bool,integer } from './engine/validation.js';

export type LibraryAsset = {
  id: string; name: string; category: 'mobilier'|'accessoires'|'decoration';
  model: string; size: {width:number;height:number;depth:number}; hands: 1|2;
  version?:number; source?:string; license?:string; defaultMovable?:boolean; defaultYaw?:number;
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
export type RoomObject={id:string;asset:string;assetVersion?:number;name:string;movable:boolean;pose:LibraryPose};
export type RoomObjects={version:1;items:RoomObject[]};
export const isLibraryObjectId=(id:unknown):id is `prop:${string}`=>typeof id==='string'&&/^prop:[a-z0-9][a-z0-9_-]{0,63}$/.test(id);
let imported:LibraryAsset[]=[];
let revision=0;
export function importedCatalog(){return {revision,assets:structuredClone(imported)};}
export function parseImportedAsset(value:unknown):LibraryAsset{
  const a=record(value,['id','version','name','category','model','size','hands','source','license','defaultMovable','defaultYaw']);
  if(Object.keys(a).length!==11||typeof a.id!=='string'||!/^custom-[a-f0-9-]{36}$/.test(a.id)||typeof a.model!=='string'||!/^\/api\/library\/models\/[a-f0-9]{64}\.glb$/.test(a.model))throw Error('Modèle importé invalide.');
  if(!['mobilier','accessoires','decoration'].includes(String(a.category))||![1,2].includes(Number(a.hands))||typeof a.hands!=='number')throw Error('Catégorie ou mains invalides.');
  const size=record(a.size,['width','height','depth']);if(Object.keys(size).length!==3)throw Error('Dimensions incomplètes.');
  return {id:a.id,version:integer(a.version,1,100000),name:text(a.name,64),category:a.category as LibraryAsset['category'],model:a.model,size:{width:libraryNumber(size.width,.01,20),height:libraryNumber(size.height,.01,6),depth:libraryNumber(size.depth,.01,20)},hands:a.hands as 1|2,source:text(a.source,512),license:text(a.license,128),defaultMovable:bool(a.defaultMovable),defaultYaw:libraryNumber(a.defaultYaw,-Math.PI,Math.PI)};
}
export function setImportedCatalog(value:unknown){
  const data=record(value,['revision','assets']),next=list(data.assets,256).map(parseImportedAsset),nextRevision=integer(data.revision);
  if(new Set(next.map(a=>`${a.id}@${a.version}`)).size!==next.length)throw Error('Versions de modèles dupliquées.');
  imported=next;revision=nextRevision;
}
export function libraryAssets():LibraryAsset[]{const latest=new Map<string,LibraryAsset>();for(const asset of imported)if((latest.get(asset.id)?.version??0)<asset.version!)latest.set(asset.id,asset);return [...OBJECT_CATALOG.assets,...latest.values()];}
export const libraryAsset=(id:string,version?:number):LibraryAsset|undefined=>{
  const builtin=OBJECT_CATALOG.assets.find(asset=>asset.id===id);if(builtin)return version===undefined||version===1?builtin:undefined;
  return imported.filter(asset=>asset.id===id&&(version===undefined||asset.version===version)).sort((a,b)=>b.version!-a.version!)[0];
};
export function libraryNumber(value:unknown,min:number,max:number):number {
  if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw Error('Dimension ou position d’objet invalide.');
  return value;
}
export function parseRoomObjects(value:unknown):RoomObjects {
  const data=record(value,['version','items']);
  if(data.version!==1||Object.keys(data).length!==2)throw Error('Version de bibliothèque d’objets inconnue.');
  const items=list(data.items,32).map(value=>{
    const item=record(value,['id','asset','assetVersion','name','movable','pose']);
    if(Object.keys(item).length!==(item.assetVersion===undefined?5:6))throw Error('Définition d’objet incomplète.');
    const id=identifier(item.id),asset=identifier(item.asset);
    const assetVersion=item.assetVersion===undefined?undefined:integer(item.assetVersion,1,100000);
    if(!libraryAsset(asset,assetVersion??1))throw Error('Objet absent du catalogue.');
    const raw=record(item.pose,['x','y','z','yaw','scale']);
    if(Object.keys(raw).length!==5)throw Error('Transformation d’objet incomplète.');
    const pose={x:libraryNumber(raw.x,-30,30),y:libraryNumber(raw.y,0,6),z:libraryNumber(raw.z,-30,30),yaw:libraryNumber(raw.yaw,-Math.PI,Math.PI),scale:libraryNumber(raw.scale,.1,3)};
    return {id,asset,...(assetVersion===undefined?{}:{assetVersion}),name:text(item.name,64),movable:bool(item.movable),pose};
  });
  if(new Set(items.map(item=>item.id)).size!==items.length)throw Error('Identifiant d’objet dupliqué.');
  return {version:1,items};
}
export function objectFootprint(item:RoomObject,pose:LibraryPose=item.pose){
  const asset=libraryAsset(item.asset,item.assetVersion??1)!;
  const w=asset.size.width*pose.scale/2,d=asset.size.depth*pose.scale/2,c=Math.cos(pose.yaw),s=Math.sin(pose.yaw);
  return [[-w,-d],[w,-d],[w,d],[-w,d]].map(([x,z])=>({x:pose.x+c*x+s*z,z:pose.z-s*x+c*z}));
}
