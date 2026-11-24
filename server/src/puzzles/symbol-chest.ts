import type { PuzzleModule,Reward } from '../engine/puzzle-types.js';
import { record,list,unique,integer,text,identifier } from '../engine/validation.js';
export const SYMBOLS=['sun','tree','moon','star'] as const;
export const CLUES=['clue-sun','clue-tree','clue-moon','clue-star','clue-false'] as const;
export type SymbolId=typeof SYMBOLS[number];
export type ClueId=typeof CLUES[number];
export type SymbolState={found:SymbolId[];entered:SymbolId[];cluesFound:ClueId[];attempts:number};
type Config={order:SymbolId[];hints:string[];clues:{id:ClueId;text:string;truth:boolean}[];rewards:Reward[]};
type Action={action:'discover_symbol'|'press_symbol'|'discover_clue';target:SymbolId|ClueId};
const symbol=(value:unknown):SymbolId=>{if(!SYMBOLS.some(id=>id===value))throw new Error('Symbole invalide.');return value as SymbolId;};
const clue=(value:unknown):ClueId=>{if(!CLUES.some(id=>id===value))throw new Error('Indice invalide.');return value as ClueId;};
export const symbolChest:PuzzleModule<Config,SymbolState,Action>={
  type:'symbol-chest',schemaVersion:1,allowedActions:['discover_symbol','press_symbol','discover_clue'],
  parseConfig(value){const c=record(value,['order','hints','clues','rewards']);const order=unique(list(c.order,4).map(symbol));if(order.length!==4)throw new Error('Quatre symboles attendus.');
    const rewards=list(c.rewards,8).map(value=>{const r=record(value,['id','label']);return {id:identifier(r.id),label:text(r.label,64)};});unique(rewards.map(r=>r.id));
    const clues=list(c.clues===undefined?[]:c.clues,8).map(value=>{const item=record(value,['id','text','truth']);return {id:clue(item.id),text:text(item.text,500),truth:item.truth===true};});unique(clues.map(item=>item.id));
    return {order,hints:list(c.hints,8).map(h=>text(h,500)),clues,rewards};},
  initialState:()=>({found:[],entered:[],cluesFound:[],attempts:0}),
  parseState(value,config){const s=record(value,['found','entered','cluesFound','attempts']),found=unique(list(s.found,4).map(symbol)),entered=list(s.entered,4).map(symbol),cluesFound=unique(list(s.cluesFound??[],8).map(clue)),attempts=integer(s.attempts);
    if((entered.length&&found.length!==4)||entered.some((id,index)=>id!==config.order[index])||cluesFound.some(id=>!config.clues.some(item=>item.id===id)))throw new Error('Combinaison incohérente.');return {found,entered,cluesFound,attempts};},
  parseAction(value){const a=record(value,['action','target']);if(a.action==='discover_clue')return {action:a.action,target:clue(a.target)};if(a.action!=='discover_symbol'&&a.action!=='press_symbol')throw new Error('Action non autorisée.');return {action:a.action,target:symbol(a.target)};},
  reduce(config,state,action){
    const reject=(message:string)=>({accepted:false,state,message});
    if(state.entered.length===4)return reject('Le coffre est déjà ouvert.');
    if(action.action==='discover_symbol'){
      const id=action.target as SymbolId; if(state.found.includes(id))return reject('Cette balise est deja decouverte.');
      return {accepted:true,state:{...state,found:[...state.found,id]},message:'Symbole decouvert pour toute l equipe.'};
    }
    if(action.action==='discover_clue'){
      const id=action.target as ClueId,item=config.clues.find(clue=>clue.id===id);if(!item)return reject('Cet indice n est pas prevu dans cette aventure.');
      if(state.cluesFound.includes(id))return reject('Cet indice est deja decouvert.');
      const required=id==='clue-false'?undefined:id.replace('clue-','') as SymbolId;
      if(required&&!state.found.includes(required))return reject('Examinez d abord la balise correspondante.');
      return {accepted:true,state:{...state,cluesFound:[...state.cluesFound,id]},message:item.text};
    }
    if(config.clues.length&&!config.clues.filter(item=>item.truth).every(item=>state.cluesFound.includes(item.id)))return reject('Les fragments de l indice sont encore incomplets.');
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
