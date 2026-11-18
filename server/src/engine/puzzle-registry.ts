import type { PuzzleModule,PuzzleInstanceSpec,PuzzleResult,PuzzleObject,Reward,PuzzleContext } from './puzzle-types.js';
export interface RegisteredPuzzle {
  type:string;schemaVersion:number;allowedActions:readonly string[];
  parseConfig(value:unknown):unknown;initialState(config:unknown):unknown;
  parseState(value:unknown,config:unknown):unknown;
  act(config:unknown,state:unknown,action:unknown,context?:PuzzleContext):PuzzleResult<unknown>;
  maintain(config:unknown,state:unknown,context:PuzzleContext):unknown;
  earnedRewards(config:unknown,state:unknown):readonly Reward[];
  isSolved(config:unknown,state:unknown):boolean;
  publicState(config:unknown,state:unknown):unknown;
  hints(config:unknown):readonly string[];objects(config:unknown):readonly PuzzleObject[];rewards(config:unknown):readonly Reward[];
}
export class PuzzleRegistry {
  private modules=new Map<string,RegisteredPuzzle>();
  register<C,S,A>(module:PuzzleModule<C,S,A>){
    if(this.modules.has(module.type))throw new Error('Type de module déjà enregistré.');
    const config=(value:unknown)=>module.parseConfig(value);
    this.modules.set(module.type,{
      type:module.type,schemaVersion:module.schemaVersion,allowedActions:[...module.allowedActions],
      parseConfig:config,initialState:value=>module.initialState(config(value)),
      parseState:(value,c)=>module.parseState(value,config(c)),
      act:(c,s,a,context)=>{const parsed=config(c);return module.reduce(parsed,module.parseState(structuredClone(s),parsed),module.parseAction(a),context);},
      maintain:(c,s,context)=>{const parsed=config(c),state=module.parseState(structuredClone(s),parsed);return module.parseState(module.maintain?module.maintain(parsed,state,context):state,parsed);},
      earnedRewards:(c,s)=>{const parsed=config(c),state=module.parseState(s,parsed);return module.earnedRewards?module.earnedRewards(parsed,state):module.isSolved(parsed,state)?module.rewards(parsed):[];},
      isSolved:(c,s)=>{const parsed=config(c);return module.isSolved(parsed,module.parseState(s,parsed));},
      publicState:(c,s)=>{const parsed=config(c);return structuredClone(module.publicState(parsed,module.parseState(s,parsed)));},
      hints:c=>module.hints(config(c)),objects:c=>module.objects(config(c)),rewards:c=>module.rewards(config(c)),
    });return this;
  }
  get(type:string,schemaVersion:number){const module=this.modules.get(type);if(!module||module.schemaVersion!==schemaVersion)throw new Error(`Module indisponible : ${type}@${schemaVersion}`);return module;}
  validate(spec:PuzzleInstanceSpec){const module=this.get(spec.type,spec.schemaVersion);return {...spec,config:module.parseConfig(spec.config)};}
}
