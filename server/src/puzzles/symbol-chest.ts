import type { PuzzleModule,Reward } from '../engine/puzzle-types.js';
import { record,list,unique,integer,text,identifier } from '../engine/validation.js';
export const SYMBOLS=['sun','tree','moon','star'] as const;
export type SymbolId=typeof SYMBOLS[number];
export type SymbolState={found:SymbolId[];entered:SymbolId[];attempts:number};
type Config={order:SymbolId[];hints:string[];rewards:Reward[]};
type Action={action:'discover_symbol'|'press_symbol';target:SymbolId};
const symbol=(value:unknown):SymbolId=>{if(!SYMBOLS.some(id=>id===value))throw new Error('Symbole invalide.');return value as SymbolId;};
export const symbolChest:PuzzleModule<Config,SymbolState,Action>={
  type:'symbol-chest',schemaVersion:1,allowedActions:['discover_symbol','press_symbol'],
  parseConfig(value){const c=record(value,['order','hints','rewards']);const order=unique(list(c.order,4).map(symbol));if(order.length!==4)throw new Error('Quatre symboles attendus.');
    const rewards=list(c.rewards,8).map(value=>{const r=record(value,['id','label']);return {id:identifier(r.id),label:text(r.label,64)};});unique(rewards.map(r=>r.id));
    return {order,hints:list(c.hints,8).map(h=>text(h,500)),rewards};},
  initialState:()=>({found:[],entered:[],attempts:0}),
  parseState(value,config){const s=record(value,['found','entered','attempts']),found=unique(list(s.found,4).map(symbol)),entered=list(s.entered,4).map(symbol),attempts=integer(s.attempts);
    if((entered.length&&found.length!==4)||entered.some((id,index)=>id!==config.order[index]))throw new Error('Combinaison incohérente.');return {found,entered,attempts};},
  parseAction(value){const a=record(value,['action','target']);if(a.action!=='discover_symbol'&&a.action!=='press_symbol')throw new Error('Action non autorisée.');return {action:a.action,target:symbol(a.target)};},
  reduce(config,state,action){
    const reject=(message:string)=>({accepted:false,state,message});
    if(state.entered.length===4)return reject('Le coffre est déjà ouvert.');
    if(action.action==='discover_symbol'){
      if(state.found.includes(action.target))return reject('Cette balise est déjà découverte.');
      return {accepted:true,state:{...state,found:[...state.found,action.target]},message:'Symbole découvert pour toute l’équipe.'};
    }
    if(state.found.length!==4)return reject('Retrouvez les quatre balises avant de saisir la combinaison.');
    if(action.target!==config.order[state.entered.length])return {accepted:true,state:{...state,entered:[],attempts:state.attempts+1},message:'Le coffre refuse cet ordre. La combinaison est effacée ; les balises restent découvertes.'};
    const entered=[...state.entered,action.target];return {accepted:true,state:{...state,entered},message:entered.length===4?'Le coffre s’ouvre !':'Le mécanisme accepte le symbole.'};
  },
  isSolved:(_config,state)=>state.entered.length===4,
  publicState:(_config,state)=>structuredClone(state),
  hints:config=>config.hints,
  objects:()=>[{id:'chest',view:'symbol-chest',role:'fixed'},{id:'panel',view:'symbol-panel',role:'interactive'},...SYMBOLS.map(id=>({id,view:'symbol-beacon',role:'interactive' as const}))],
  rewards:config=>config.rewards,
};
