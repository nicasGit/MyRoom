import type { PuzzleModule,Reward } from '../engine/puzzle-types.js';
import { record,list,unique,integer,text,identifier } from '../engine/validation.js';

export const TAPES=['tape-backfuture','tape-goonies','tape-gremlins','tape-indiana'] as const;
const LEGACY_TAPES=['tape-red','tape-blue','tape-gold'] as const;
export type TapeId=typeof TAPES[number]|typeof LEGACY_TAPES[number];
export const TAPE_INFO:Record<TapeId,{title:string;year:number;hide:string;placementKey:string;color:number}>= {
  'tape-backfuture':{title:'Retour vers le futur',year:1985,hide:'Derriere une affiche retro',placementKey:'four',color:0xe85d75},
  'tape-goonies':{title:'Les Goonies',year:1985,hide:'Dans une boite a cartes',placementKey:'eight',color:0x4ba3c7},
  'tape-gremlins':{title:'Gremlins',year:1984,hide:'Dans la boite des Gremlins',placementKey:'chest',color:0x8fcf77},
  'tape-indiana':{title:'Indiana Jones',year:1981,hide:'Sous le bureau',placementKey:'king',color:0xd29a4a},
  'tape-red':{title:'Cassette rouge',year:1984,hide:'Cachette rouge',placementKey:'four',color:0xe85d75},
  'tape-blue':{title:'Cassette bleue',year:1985,hide:'Cachette bleue',placementKey:'eight',color:0x4ba3c7},
  'tape-gold':{title:'Cassette doree',year:1986,hide:'Cachette doree',placementKey:'king',color:0xd29a4a},
};
export type RetroState={found:TapeId[];slots:(TapeId|null)[];attempts:number};
type Config={order:TapeId[];hints:string[];rewards:Reward[]};
type Action={action:'discover_tape'|'place_tape'|'reset_tapes';tape?:TapeId;slot?:number};
const tape=(value:unknown):TapeId=>{if(![...TAPES,...LEGACY_TAPES].some(id=>id===value))throw new Error('Cassette invalide.');return value as TapeId;};

export const retroVideoclub:PuzzleModule<Config,RetroState,Action>={
  type:'retro-videoclub',schemaVersion:1,allowedActions:['discover_tape','place_tape','reset_tapes'],
  parseConfig(value){const c=record(value,['order','hints','rewards']),order=unique(list(c.order,4).map(tape));if(order.length<3||order.length>4)throw new Error('Trois ou quatre cassettes attendues.');
    const hints=list(c.hints,8).map(h=>text(h,500)),rewards=list(c.rewards,4).map(value=>{const r=record(value,['id','label']);return {id:identifier(r.id),label:text(r.label,64)};});unique(rewards.map(r=>r.id));return {order,hints,rewards};},
  initialState:config=>({found:[],slots:Array.from({length:config.order.length},()=>null),attempts:0}),
  parseState(value,config){const s=record(value,['found','slots','attempts']),found=unique(list(s.found,4).map(tape)),slots=list(s.slots,4).map(item=>item===null?null:tape(item));if(slots.length!==config.order.length||unique(slots.filter((item):item is TapeId=>item!==null)).length!==slots.filter(item=>item!==null).length||slots.some((item):item is TapeId=>item!==null&&!found.includes(item)))throw new Error('Etat du videoclub incoherent.');return {found,slots,attempts:integer(s.attempts)};},
  parseAction(value){const a=record(value,['action','tape','slot']);if(a.action==='discover_tape'&&Object.keys(a).sort().join(',')==='action,tape')return {action:a.action,tape:tape(a.tape)};if(a.action==='place_tape'&&Object.keys(a).sort().join(',')==='action,slot,tape')return {action:a.action,tape:tape(a.tape),slot:integer(a.slot,0,3)};if(a.action==='reset_tapes'&&Object.keys(a).length===1)return {action:a.action};throw new Error('Action videoclub invalide.');},
  reduce(config,state,action){const reject=(message:string)=>({accepted:false,state,message});if(action.action==='reset_tapes')return {accepted:true,state:{...state,slots:Array.from({length:config.order.length},()=>null)},message:'Les cassettes sont remises en reserve.'};
    if(action.action==='discover_tape'){const id=action.tape!;if(state.found.includes(id))return reject('Cette cassette est deja decouverte.');return {accepted:true,state:{...state,found:[...state.found,id]},message:'Cassette decouverte pour toute equipe.'};}
    const id=action.tape!,slot=action.slot!;if(!state.found.includes(id))return reject('Retrouvez cette cassette avant de la placer.');const slots=state.slots.map(item=>item===id?null:item);if(slot>=slots.length||slots[slot]!==null)return reject('Cet emplacement est deja occupe.');slots[slot]=id;
    if(slots.every((item):item is TapeId=>item!==null)){if(slots.every((item,index)=>item===config.order[index]))return {accepted:true,state:{...state,slots},message:'Le projecteur demarre : le videoclub est deverrouille.'};return {accepted:true,state:{...state,slots:Array.from({length:config.order.length},()=>null),attempts:state.attempts+1},message:'Mauvais montage. Les cassettes sont ejectees.'};}
    return {accepted:true,state:{...state,slots},message:'Cassette inseree dans le projecteur.'};
  },
  isSolved:(_config,state)=>state.slots.every((item):item is TapeId=>item!==null),
  publicState:(_config,state)=>structuredClone(state),
  hints:config=>config.hints,
  objects:config=>config.order.map(id=>({id,view:'retro-tape',role:'interactive' as const})),
  rewards:config=>config.rewards,
};
