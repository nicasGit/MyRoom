import type { AdventureManifest,AdventureSnapshot,RuntimeInstance,ProgressEvent } from './puzzle-types.js';
import type { AdventureCatalog } from './adventure-manifest.js';
import type { PuzzleRegistry } from './puzzle-registry.js';
import { record,integer,bool,list,text,identifier,unique } from './validation.js';
export class AdventureEngine {
  private manifest:AdventureManifest;
  private state:AdventureSnapshot;
  constructor(private registry:PuzzleRegistry,private catalog:AdventureCatalog,id:string,version:string){this.manifest=catalog.get(id,version);this.state=this.initial(0);}
  private initial(revision:number):AdventureSnapshot{
    return {schemaVersion:1,adventureId:this.manifest.id,adventureVersion:this.manifest.version,revision,running:false,stepId:this.manifest.steps[0].id,instances:this.manifest.instances.map(spec=>({ ...structuredClone(spec),state:this.registry.get(spec.type,spec.schemaVersion).initialState(spec.config),solved:false,hintLevel:0})),inventory:[],completedSteps:[],status:'ready'};
  }
  definition(){return structuredClone(this.manifest);}
  snapshot(){return structuredClone(this.state);}
  currentStep(){return structuredClone(this.manifest.steps.find(s=>s.id===this.state.stepId)!);}
  activeInstance(){const step=this.currentStep();return step.kind==='puzzle'?structuredClone(this.state.instances.find(i=>i.id===step.instanceId)):undefined;}
  select(id:string,version:string){if(this.state.running)throw new Error('Arrêtez la partie avant de changer d’aventure.');const manifest=this.catalog.get(id,version);this.manifest=manifest;this.state=this.initial(this.state.revision+1);}
  reset(){this.state=this.initial(this.state.revision+1);}
  start(){if(this.state.status==='pending'||this.state.status==='complete')throw new Error('Étape indisponible ou aventure terminée.');if(!this.state.running){this.state.running=true;this.state.status='playing';this.state.revision++;}}
  stop(){if(this.state.running){this.state.running=false;this.state.status='ready';this.state.revision++;}}
  act(instanceId:string,revision:number,action:unknown){
    const reject=(message:string)=>({changed:false,message,events:[] as ProgressEvent[]});
    if(revision!==this.state.revision)return reject('La partie a changé. Actualisez son état.');
    if(!this.state.running||this.state.status!=='playing')return reject('La partie n’est pas active.');
    const instance=this.activeInstance();if(!instance||instance.id!==instanceId)return reject('Cette instance n’est pas active.');
    const module=this.registry.get(instance.type,instance.schemaVersion);
    let result;try{result=module.act(instance.config,instance.state,action);}catch{return reject('Action d’énigme invalide.');}
    if(!result.accepted)return reject(result.message);
    const next=structuredClone(this.state),updated=next.instances.find(i=>i.id===instance.id)!;updated.state=module.parseState(result.state,instance.config);
    const events:ProgressEvent[]=[];
    if(module.isSolved(instance.config,updated.state)){
      updated.solved=true;next.completedSteps.push(this.currentStep().id);events.push({type:'puzzle-solved',id:instance.id});
      for(const reward of module.rewards(instance.config)){if(!next.inventory.some(r=>r.id===reward.id)){next.inventory.push(structuredClone(reward));events.push({type:'reward-added',id:reward.id});}}
      const nextId=this.currentStep().next;
      if(nextId){next.stepId=nextId;events.push({type:'step-changed',id:nextId});if(this.manifest.steps.find(s=>s.id===nextId)!.kind==='planned'){next.status='pending';next.running=false;}}
      else {next.status='complete';next.running=false;}
    }
    next.revision++;this.state=next;return {changed:true,message:result.message,events};
  }
  publicState(){
    const snapshot=this.snapshot();return {...snapshot,title:this.manifest.title,step:this.currentStep(),instances:snapshot.instances.map(instance=>{
      const module=this.registry.get(instance.type,instance.schemaVersion);
      const {config,...publicInstance}=instance;return {...publicInstance,state:module.publicState(config,instance.state),allowedActions:module.allowedActions,hints:module.hints(config).slice(0,instance.hintLevel),objects:module.objects(config)};
    })};
  }
  // Pure validation/restore contract. Disk persistence and admin restoration are Phase 3.
  restore(value:unknown){
    const s=record(value,['schemaVersion','adventureId','adventureVersion','revision','running','stepId','instances','inventory','completedSteps','status']);
    if(s.schemaVersion!==1||s.adventureId!==this.manifest.id||s.adventureVersion!==this.manifest.version)throw new Error('Session d’une autre aventure ou version.');
    const revision=integer(s.revision),running=bool(s.running),stepId=identifier(s.stepId),stepIndex=this.manifest.steps.findIndex(step=>step.id===stepId);
    if(stepIndex<0||!['ready','playing','pending','complete'].includes(String(s.status)))throw new Error('Étape ou statut invalide.');
    const instances:RuntimeInstance[]=list(s.instances,32).map(value=>{const i=record(value,['id','type','schemaVersion','config','state','solved','hintLevel']),spec=this.manifest.instances.find(spec=>spec.id===i.id);
      if(!spec||spec.type!==i.type||spec.schemaVersion!==i.schemaVersion||JSON.stringify(spec.config)!==JSON.stringify(i.config))throw new Error('Configuration de session incompatible.');
      const module=this.registry.get(spec.type,spec.schemaVersion),state=module.parseState(i.state,spec.config),solved=bool(i.solved),hintLevel=integer(i.hintLevel,0,module.hints(spec.config).length);
      if(solved!==module.isSolved(spec.config,state))throw new Error('Réussite de session incohérente.');return {...structuredClone(spec),state,solved,hintLevel};});
    unique(instances.map(i=>i.id));if(instances.length!==this.manifest.instances.length)throw new Error('Instances manquantes.');
    const completedSteps=unique(list(s.completedSteps,32).map(identifier)),expectedCompleted=this.manifest.steps.filter(step=>step.kind==='puzzle'&&instances.find(i=>i.id===step.instanceId)?.solved).map(step=>step.id);
    if(JSON.stringify(completedSteps)!==JSON.stringify(expectedCompleted)||completedSteps.some(id=>this.manifest.steps.findIndex(step=>step.id===id)>stepIndex))throw new Error('Progression incohérente.');
    for(let index=0;index<stepIndex;index++)if(!completedSteps.includes(this.manifest.steps[index].id))throw new Error('Étape précédente non résolue.');
    for(let index=stepIndex+1;index<this.manifest.steps.length;index++){
      const future=this.manifest.steps[index];if(future.kind==='puzzle'){const i=instances.find(i=>i.id===future.instanceId)!;const module=this.registry.get(i.type,i.schemaVersion);if(JSON.stringify(i.state)!==JSON.stringify(module.initialState(i.config))||i.hintLevel!==0)throw new Error('Une étape future a déjà progressé.');}
    }
    const expectedInventory=completedSteps.flatMap(id=>{const step=this.manifest.steps.find(s=>s.id===id)!;if(step.kind!=='puzzle')return [];const i=instances.find(i=>i.id===step.instanceId)!;return this.registry.get(i.type,i.schemaVersion).rewards(i.config);}).filter((r,index,array)=>array.findIndex(other=>other.id===r.id)===index);
    const inventory=list(s.inventory,256).map(value=>{const r=record(value,['id','label']);return {id:identifier(r.id),label:text(r.label,64)};});
    if(JSON.stringify(inventory)!==JSON.stringify(expectedInventory))throw new Error('Inventaire incohérent.');
    const step=this.manifest.steps[stepIndex],complete=this.manifest.victory.requiredSteps.every(id=>completedSteps.includes(id));
    if((s.status==='complete')!==complete||(s.status==='pending')!==(step.kind==='planned')||(running!==(s.status==='playing'))||(!complete&&step.kind==='puzzle'&&completedSteps.includes(stepId)))throw new Error('Statut de session incohérent.');
    this.state={schemaVersion:1,adventureId:this.manifest.id,adventureVersion:this.manifest.version,revision:Math.max(this.state.revision,revision)+1,running,stepId,instances,inventory,completedSteps,status:s.status as AdventureSnapshot['status']};
  }
}
