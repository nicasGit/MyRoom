// Compatibility boundary: network/spatial checks stay outside the pure puzzle modules.
import { inside,puzzlePanel,type Point2,type RoomModel } from './scene-schema.js';
import { AdventureEngine } from './engine/adventure-engine.js';
import { createRegistry,createCatalog } from './adventures/catalog.js';
import type { PuzzleRegistry } from './engine/puzzle-registry.js';
import type { AdventureCatalog } from './engine/adventure-manifest.js';
import { SYMBOLS,type SymbolId,type SymbolState } from './puzzles/symbol-chest.js';
import { CARDS,type CardId,type LegacyBlackjackState,blackjackScore } from './puzzles/blackjack-legacy.js';
import type { HybridPublicState } from './puzzles/blackjack-hybrid.js';
import type { PuzzleContext } from './engine/puzzle-types.js';
import type { ObjectSnapshot } from './object-manipulation.js';
export { SYMBOLS,CARDS,blackjackScore };
export type { SymbolId,CardId };
export type AdventureCommand={type:'adventure_action';revision:number;libraryRevision:number;action:'discover_symbol'|'press_symbol'|'discover_card'|'choose_card';target:string;position:Point2;simulation:boolean};
export type PuzzleCommand={type:'puzzle_action';revision:number;libraryRevision:number;instanceId:string;action:unknown;position:Point2;simulation:boolean};
export type AdventureState={objects?:ObjectSnapshot;running:boolean;revision:number;phase:'unconfigured'|'symbols'|'blackjack'|'hybrid'|'pending'|'complete';testMode:boolean;symbols:SymbolState;blackjack:LegacyBlackjackState;hybrid?:HybridPublicState;captainId?:string;message:string;engine:ReturnType<AdventureEngine['publicState']>};
function envelope(value:unknown,type:'adventure_action'|'puzzle_action'){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Action attendue.');
  const v=value as Record<string,unknown>,p=v.position as Record<string,unknown>|null;
  const keys=type==='adventure_action'?'action,libraryRevision,position,revision,simulation,target,type':'action,instanceId,libraryRevision,position,revision,simulation,type';
  if(Object.keys(v).sort().join(',')!==keys||v.type!==type||!Number.isSafeInteger(v.revision)||Number(v.revision)<0||!Number.isSafeInteger(v.libraryRevision)||Number(v.libraryRevision)<0||typeof v.simulation!=='boolean'||!p||typeof p!=='object'||Object.keys(p).sort().join(',')!=='x,z'||![p.x,p.z].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=30))throw new Error('Action d’énigme invalide.');
  return v;
}
export function parseAdventureCommand(value:unknown):AdventureCommand{
  const v=envelope(value,'adventure_action'),symbols=v.action==='discover_symbol'||v.action==='press_symbol',cards=v.action==='discover_card'||v.action==='choose_card';
  if((!symbols&&!cards)||typeof v.target!=='string'||!(symbols?SYMBOLS:CARDS).some(id=>id===v.target))throw new Error('Cible d’énigme invalide.');
  return v as unknown as AdventureCommand;
}
export function parsePuzzleCommand(value:unknown):PuzzleCommand{
  const v=envelope(value,'puzzle_action');if(typeof v.instanceId!=='string'||!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(v.instanceId))throw new Error('Instance invalide.');return v as unknown as PuzzleCommand;
}
export class Adventure {
  sceneEpoch=0;
  private context:PuzzleContext={players:[],now:0};
  maintain(context:PuzzleContext){const captainChanged=this.context.captainId!==context.captainId;this.context=context;const changed=this.engine.maintain(context);if(changed||captainChanged)this.revision++;return changed||captainChanged;}
  adminPuzzle(action:'hint'|'reset-puzzle',revision:number){if(revision!==this.revision)throw new Error('La partie a changé. Actualisez.');if(action==='hint')this.engine.hint(this.engine.snapshot().revision);else this.engine.resetActive(this.engine.snapshot().revision);this.revision++;this.message=action==='hint'?'Nouvel indice partagé avec l’équipe.':'Énigme active réinitialisée.';}
  private beforeTest:ReturnType<AdventureEngine['snapshot']>|undefined;
  readonly engine:AdventureEngine;
  private key='';private configured=false;private revision=0;private testMode=false;private message='Configurer les énigmes dans l’administration.';
  constructor(registry:PuzzleRegistry=createRegistry(),private catalog:AdventureCatalog=createCatalog(registry)){
    this.engine=new AdventureEngine(registry,catalog,'myroom-classic','1.0.0');
  }
  configure(model:RoomModel|null){const key=JSON.stringify(model);if(key!==this.key){this.key=key;this.reset(!!model?.puzzles);}}
  reset(configured=this.configured){this.sceneEpoch++;this.beforeTest=undefined;this.configured=configured;this.engine.reset();this.revision++;this.message=configured?'Retrouvez les quatre balises, puis entrez les symboles au panneau mural.':'Configurer les énigmes dans l’administration.';}
  start(){if(!this.configured)throw new Error('Configurez les placements avant de commencer.');const previous=this.engine.snapshot().revision;this.engine.start();if(this.engine.snapshot().revision!==previous)this.revision++;}
  stop(){const previous=this.engine.snapshot().revision;this.engine.stop();if(this.engine.snapshot().revision!==previous)this.revision++;}
  setTestMode(enabled:boolean){if(enabled!==this.testMode){if(!enabled&&this.beforeTest){this.engine.restore(this.beforeTest);this.sceneEpoch++;this.beforeTest=undefined;this.message=this.engine.currentStep().narrative;}this.testMode=enabled;this.revision++;}}
  testStep(stepId:string,revision:number){
    if(!this.testMode)throw new Error('Activez le mode test avant de choisir une énigme.');
    if(!this.configured)throw new Error('Configurez les placements avant de tester.');
    if(revision!==this.revision)throw new Error('La partie a changé. Actualisez avant de tester.');
    const previous=this.engine.snapshot();this.engine.testStep(stepId,previous.revision);this.sceneEpoch++;
    this.beforeTest??=previous;this.revision++;this.message='Session de test temporaire : '+this.engine.currentStep().narrative;
  }
  listAdventures(){return this.catalog.list();}
  select(id:string,version:string,revision:number){if(this.beforeTest)throw new Error('Quittez le mode test avant de changer d’aventure.');if(revision!==this.revision)throw new Error('La partie a changé. Actualisez avant de sélectionner.');const manifest=this.catalog.get(id,version);if(manifest.objects.some(o=>o.objectId!==o.placementKey))throw new Error('Ce placement nécessite le futur moteur de rendu par aventure.');this.engine.select(id,version);this.sceneEpoch++;this.revision++;this.message=this.engine.currentStep().narrative;}
  snapshot():AdventureState{
    const engine=this.engine.publicState(),active=this.engine.activeInstance();
    const symbols=active?.type==='symbol-chest'?active:engine.instances.find(i=>i.type==='symbol-chest'),blackjack=active?.type==='blackjack-legacy'?active:engine.instances.find(i=>i.type==='blackjack-legacy');
    const phase:AdventureState['phase']=!this.configured?'unconfigured':engine.status==='pending'?'pending':engine.status==='complete'?'complete':active?.type==='blackjack-hybrid'?'hybrid':active?.type==='blackjack-legacy'?'blackjack':'symbols';
    const hybrid=engine.instances.find(i=>i.type==='blackjack-hybrid'&&(active?.id===i.id||engine.status==='pending'&&i.solved))?.state as HybridPublicState|undefined;
    return {running:engine.running,revision:this.revision,phase,testMode:this.testMode,symbols:structuredClone(symbols?.state??{found:[],entered:[],attempts:0}) as SymbolState,blackjack:structuredClone(blackjack?.state??{found:[],chosen:null,total:17,ace:11,attempts:0}) as LegacyBlackjackState,hybrid,captainId:this.context.captainId,message:this.message,engine};
  }
  act(command:AdventureCommand,model:RoomModel|null,libraryRevision:number,objects?:ObjectSnapshot){
    const instanceId=this.engine.activeInstance()?.id??'';
    return this.actPuzzle({type:'puzzle_action',revision:command.revision,libraryRevision:command.libraryRevision,instanceId,action:{action:command.action,target:command.target},position:command.position,simulation:command.simulation},model,libraryRevision,undefined,objects);
  }
  actPuzzle(command:PuzzleCommand,model:RoomModel|null,libraryRevision:number,actorId?:string,objects?:ObjectSnapshot):{changed:boolean;message:string}{
    this.configure(model);const reject=(message:string)=>({changed:false,message});
    if(!model?.puzzles)return reject('Les énigmes ne sont pas encore placées.');
    const state=this.snapshot();if(!state.running)return reject('La partie est en préparation ou cette étape est indisponible.');
    if(command.revision!==this.revision||command.libraryRevision!==libraryRevision)return reject('La partie a changé. Réessayez avec le nouvel état.');
    if(command.simulation&&!this.testMode)return reject('Le test PC doit être autorisé par l’administrateur.');
    if(!inside(command.position,model.floor))return reject('Position déclarée hors de la pièce. Refaites le calibrage A/B.');
    const active=this.engine.activeInstance();if(!active||active.id!==command.instanceId)return reject('Cette instance n’est pas active.');
    const action=command.action as {action?:unknown;target?:unknown}|null;
    if(!action||typeof action!=='object')return reject('Action d’énigme invalide.');
    const objectId=active.type==='blackjack-hybrid'?'table':action.action==='press_symbol'?'panel':action.action==='choose_card'?'table':action.target;
    const binding=this.engine.definition().objects.find(o=>o.instanceId===active.id&&o.objectId===objectId);
    const position=objects?.poses[binding?.placementKey as keyof ObjectSnapshot['poses']]??(binding?.placementKey==='panel'?puzzlePanel(model)?.position:model.puzzles.points[binding?.placementKey as keyof typeof model.puzzles.points]);
    if(!position)return reject('Objet sans placement compatible.');
    if(Math.hypot(command.position.x-position.x,command.position.z-position.z)>1.3)return reject('Approchez-vous à moins de 1,3 m de cet élément.');
    const result=this.engine.act(active.id,this.engine.snapshot().revision,command.action,{...this.context,actorId,now:Date.now()});
    if(result.changed){this.revision++;this.message=result.message;if(this.engine.snapshot().status==='pending')this.message=this.engine.currentStep().narrative;else if(state.phase==='symbols'&&this.snapshot().phase==='blackjack')this.message='Le coffre s’ouvre ! La table du dernier As est accessible.';}
    return {changed:result.changed,message:result.changed?this.message:result.message};
  }
}
