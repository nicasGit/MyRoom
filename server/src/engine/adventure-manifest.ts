import type { AdventureManifest,PuzzleInstanceSpec,AdventureStep } from './puzzle-types.js';
import { record,text,identifier,integer,list,unique } from './validation.js';
import type { PuzzleRegistry } from './puzzle-registry.js';
export function parseManifest(value:unknown,registry:PuzzleRegistry):AdventureManifest{
  const m=record(value,['schemaVersion','id','version','title','description','players','targetMinutes','instances','steps','objects','victory']);
  if(m.schemaVersion!==1)throw new Error('Version de manifeste inconnue.');
  const version=text(m.version,32);if(!/^\d+\.\d+\.\d+$/.test(version))throw new Error('Version attendue : x.y.z.');
  const p=record(m.players,['min','max','suggestedNames']),min=integer(p.min,1,4),max=integer(p.max,min,4),suggestedNames=list(p.suggestedNames,4).map(n=>text(n,40));
  if(suggestedNames.length>max)throw new Error('Trop de noms suggérés.');
  const instances=list(m.instances,32).map(value=>{const i=record(value,['id','type','schemaVersion','config']);return registry.validate({id:identifier(i.id),type:identifier(i.type),schemaVersion:integer(i.schemaVersion,1,100),config:i.config} satisfies PuzzleInstanceSpec);});
  unique(instances.map(i=>i.id));
  const steps:AdventureStep[]=list(m.steps,32).map(value=>{const s=record(value,['id','title','narrative','next','kind','instanceId','puzzleType']);const base={id:identifier(s.id),title:text(s.title,100),narrative:text(s.narrative,2000),next:s.next===null?null:identifier(s.next)};
    if(s.kind==='puzzle'&&s.puzzleType===undefined&&instances.some(i=>i.id===s.instanceId))return {...base,kind:'puzzle',instanceId:identifier(s.instanceId)};
    if(s.kind==='planned'&&s.instanceId===undefined)return {...base,kind:'planned',puzzleType:identifier(s.puzzleType)};
    throw new Error('Étape invalide ou instance inconnue.');});
  if(!steps.length||!instances.length)throw new Error('Aventure vide.');unique(steps.map(s=>s.id));
  unique(steps.filter(s=>s.kind==='puzzle').map(s=>s.instanceId));
  if(instances.some(i=>!steps.some(s=>s.kind==='puzzle'&&s.instanceId===i.id)))throw new Error('Instance sans étape.');
  steps.forEach((s,index)=>{if(s.next!==(steps[index+1]?.id??null))throw new Error('Seul un parcours linéaire est pris en charge en V1.');});
  const objects=list(m.objects,128).map(value=>{const o=record(value,['instanceId','objectId','placementKey']);const instanceId=identifier(o.instanceId),objectId=identifier(o.objectId),spec=instances.find(i=>i.id===instanceId);
    if(!spec||!registry.get(spec.type,spec.schemaVersion).objects(spec.config).some(o=>o.id===objectId))throw new Error('Objet ou instance inconnus.');return {instanceId,objectId,placementKey:identifier(o.placementKey)};});
  unique(objects.map(o=>`${o.instanceId}.${o.objectId}`));
  for(const spec of instances)for(const object of registry.get(spec.type,spec.schemaVersion).objects(spec.config))if(!objects.some(binding=>binding.instanceId===spec.id&&binding.objectId===object.id))throw new Error('Un objet déclaré ne possède pas de liaison spatiale.');
  const victory=record(m.victory,['requiredSteps']),requiredSteps=unique(list(victory.requiredSteps,32).map(identifier));
  if(requiredSteps.length!==steps.length||steps.some(s=>!requiredSteps.includes(s.id)))throw new Error('La victoire V1 exige toutes les étapes.');
  return {schemaVersion:1,id:identifier(m.id),version,title:text(m.title,100),description:text(m.description,2000),players:{min,max,suggestedNames},targetMinutes:integer(m.targetMinutes,1,480),instances,steps,objects,victory:{requiredSteps}};
}
export class AdventureCatalog {
  private manifests=new Map<string,AdventureManifest>();
  constructor(private registry:PuzzleRegistry,manifests:unknown[]=[]){for(const manifest of manifests)this.add(manifest);}
  add(value:unknown){const manifest=parseManifest(value,this.registry),key=`${manifest.id}@${manifest.version}`;if(this.manifests.has(key))throw new Error('Aventure déjà enregistrée.');this.manifests.set(key,manifest);return this;}
  get(id:string,version:string){const manifest=this.manifests.get(`${id}@${version}`);if(!manifest)throw new Error('Aventure ou version inconnue.');return structuredClone(manifest);}
  list(){return [...this.manifests.values()].map(m=>structuredClone(m));}
}
