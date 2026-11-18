// Compatibility module only. The three-round blackjack-hybrid is intentionally absent in Phase 1.
import type { PuzzleModule } from '../engine/puzzle-types.js';
import { record,list,unique,integer } from '../engine/validation.js';
export const CARDS=['four','eight','king'] as const;
export type CardId=typeof CARDS[number];
export type LegacyBlackjackState={found:CardId[];chosen:CardId|null;total:number;ace:number;attempts:number};
type Action={action:'discover_card'|'choose_card';target:CardId};
const card=(v:unknown):CardId=>{if(!CARDS.some(id=>id===v))throw new Error('Carte invalide.');return v as CardId;};
export function blackjackScore(values:number[]){let total=values.reduce((sum,v)=>sum+(v===1?11:v),0),aces=values.filter(v=>v===1).length;while(total>21&&aces>0){total-=10;aces--;}return {total,ace:aces>0?11:1};}
export const blackjackLegacy:PuzzleModule<Record<string,never>,LegacyBlackjackState,Action>={
  type:'blackjack-legacy',schemaVersion:1,allowedActions:['discover_card','choose_card'],
  parseConfig(value){const c=record(value,[]);return c as Record<string,never>;},
  initialState:()=>({found:[],chosen:null,total:17,ace:11,attempts:0}),
  parseState(value){const s=record(value,['found','chosen','total','ace','attempts']),found=unique(list(s.found,3).map(card)),chosen=s.chosen===null?null:card(s.chosen),attempts=integer(s.attempts),total=integer(s.total,0,31),ace=integer(s.ace,1,11);
    const score=chosen?blackjackScore([1,6,{four:4,eight:8,king:10}[chosen]]):{total:17,ace:11};
    if(total!==score.total||ace!==score.ace||(chosen!==null&&(found.length!==3||attempts===0))||(chosen===null&&attempts!==0))throw new Error('État blackjack incohérent.');return {found,chosen,total,ace,attempts};},
  parseAction(value){const a=record(value,['action','target']);if(a.action!=='discover_card'&&a.action!=='choose_card')throw new Error('Action non autorisée.');return {action:a.action,target:card(a.target)};},
  reduce(_config,state,action){
    const reject=(message:string)=>({accepted:false,state,message});if(state.total===21)return reject('Cette énigme est déjà résolue.');
    if(action.action==='discover_card'){if(state.found.includes(action.target))return reject('Cette carte est déjà découverte.');return {accepted:true,state:{...state,found:[...state.found,action.target]},message:'Indice de carte découvert pour toute l’équipe.'};}
    if(state.found.length!==3)return reject('Retrouvez les trois cartes avant de choisir à la table.');
    const score=blackjackScore([1,6,{four:4,eight:8,king:10}[action.target]]);
    return {accepted:true,state:{...state,chosen:action.target,...score,attempts:state.attempts+1},message:score.total===21?'Vingt-et-un ! Vous obtenez la clé virtuelle et le chiffre 7.':`Total ${score.total}, As compté comme ${score.ace}. Il faut exactement 21 avec une seule carte. Choisissez à nouveau ; la main repart de As + 6.`};
  },
  isSolved:(_config,state)=>state.total===21,
  publicState:(_config,state)=>structuredClone(state),
  hints:()=>['L’As vaut 1 ou 11.','Complétez As + 6 avec une seule carte.'],
  objects:()=>[{id:'table',view:'blackjack-table',role:'fixed'},...CARDS.map(id=>({id,view:'legacy-card',role:'interactive' as const}))],
  rewards:()=>[{id:'virtual-key-7',label:'Clé virtuelle — 7'}],
};
