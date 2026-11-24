import type { PuzzleModule,Reward } from '../engine/puzzle-types.js';
import { record,list,unique,integer,text,identifier } from '../engine/validation.js';

export const TAPES=['tape-red','tape-blue','tape-gold'] as const;
export type TapeId=typeof TAPES[number];
export type RetroState={found:TapeId[];slots:(TapeId|null)[];attempts:number};
type Config={order:TapeId[];hints:string[];rewards:Reward[]};
type Action={action:'discover_tape'|'place_tape'|'reset_tapes';tape?:TapeId;slot?:number};
const tape=(value:unknown):TapeId=>{if(!TAPES.some(id=>id===value))throw new Error('Cassette invalide.');return value as TapeId;};

export const retroVideoclub:PuzzleModule<Config,RetroState,Action>={
  type:'retro-videoclub',schemaVersion:1,allowedActions:['discover_tape','place_tape','reset_tapes'],
  parseConfig(value){const c=record(value,['order','hints','rewards']),order=unique(list(c.order,3).map(tape));if(order.length!==3)throw new Error('Trois cassettes attendues.');
    const hints=list(c.hints,8).map(h=>text(h,500)),rewards=list(c.rewards,4).map(value=>{const r=record(value,['id','label']);return {id:identifier(r.id),label:text(r.label,64)};});unique(rewards.map(r=>r.id));return {order,hints,rewards};},
  initialState:()=>({found:[],slots:[null,null,null],attempts:0}),
  parseState(value,config){const s=record(value,['found','slots','attempts']),found=unique(list(s.found,3).map(tape)),slots=list(s.slots,3).map(item=>item===null?null:tape(item));if(slots.length!==3||unique(slots.filter((item):item is TapeId=>item!==null)).length!==slots.filter(item=>item!==null).length||slots.some(item=>item!==null&&!found.includes(item))||found.some(item=>!TAPES.includes(item)))throw new Error('État du vidéoclub incohérent.');return {found,slots,attempts:integer(s.attempts)};},
  parseAction(value){const a=record(value,['action','tape','slot']);if(a.action==='discover_tape'&&Object.keys(a).sort().join(',')==='action,tape')return {action:a.action,tape:tape(a.tape)};if(a.action==='place_tape'&&Object.keys(a).sort().join(',')==='action,slot,tape')return {action:a.action,tape:tape(a.tape),slot:integer(a.slot,0,2)};if(a.action==='reset_tapes'&&Object.keys(a).length===1)return {action:a.action};throw new Error('Action vidéoclub invalide.');},
  reduce(config,state,action){const reject=(message:string)=>({accepted:false,state,message});if(action.action==='reset_tapes')return {accepted:true,state:{...state,slots:[null,null,null]},message:'Les cassettes sont remises en réserve.'};
    if(action.action==='discover_tape'){const id=action.tape!;if(state.found.includes(id))return reject('Cette cassette est déjà découverte.');return {accepted:true,state:{...state,found:[...state.found,id]},message:'Cassette découverte pour toute l’équipe.'};}
    const id=action.tape!,slot=action.slot!;if(!state.found.includes(id))return reject('Retrouvez cette cassette avant de la placer.');const slots=state.slots.map(item=>item===id?null:item);if(slots[slot]!==null)return reject('Cet emplacement est déjà occupé.');slots[slot]=id;
    if(slots.every((item):item is TapeId=>item!==null)){if(slots.every((item,index)=>item===config.order[index]))return {accepted:true,state:{...state,slots},message:'Le projecteur démarre : le vidéoclub est déverrouillé.'};return {accepted:true,state:{...state,slots:[null,null,null],attempts:state.attempts+1},message:'Mauvais montage. Les cassettes sont éjectées.'};}
    return {accepted:true,state:{...state,slots},message:'Cassette insérée dans le projecteur.'};
  },
  isSolved:(_config,state)=>state.slots.every((item):item is TapeId=>item!==null),
  publicState:(_config,state)=>structuredClone(state),
  hints:config=>config.hints,
  objects:()=>TAPES.map(id=>({id,view:'retro-tape',role:'interactive' as const})),
  rewards:config=>config.rewards,
};
