import type { PuzzleModule,PuzzleContext,Reward } from '../engine/puzzle-types.js';
import { record,list,integer,bool,text,identifier,unique } from '../engine/validation.js';

export type Card=string;
export const DECK=Object.freeze(['C','D','H','S'].flatMap(suit=>['A','2','3','4','5','6','7','8','9','10','J','Q','K'].map(rank=>rank+suit)));
export const DOUBLE_ACES=['AD','9S','AH'];
export const IMPOSSIBLE=['8C','5D','3S','10H','AC'];
export type HybridAction={action:'deal'|'hit'|'stand'|'retry'|'next_round'|'submit'|'cancel_card'|'return_card'}|{action:'pick_card';card:Card}|{action:'drop_card';slot:number}|{action:'assign_ace';card:'AD'|'AH';value:1|11};
type Config={hints:string[];rewards:Reward[]};
export type CardLock={card:Card;owner:string;expiresAt:number};
export type HybridState={round:1|2|3;status:'idle'|'playing'|'lost'|'tie'|'won'|'complete';failures:number;completedRounds:number;rescue:boolean;team:Card[];dealer:Card[];shoe:Card[];slots:(Card|null)[];aceValues:{AD:1|11;AH:1|11};locks:CardLock[]};
export type HybridPublicState=Omit<HybridState,'shoe'|'dealer'> & {dealer:(Card|null)[];teamTotal:number;dealerTotal:number|null;cards:Card[]};
const card=(value:unknown):Card=>{if(typeof value!=='string'||!DECK.includes(value))throw new Error('Carte invalide.');return value;};
const cards=(value:unknown,max=52)=>unique(list(value,max).map(card));
const aceValue=(value:unknown):1|11=>{if(value!==1&&value!==11)throw new Error('As : 1 ou 11 attendu.');return value;};
export function score(hand:readonly Card[]){let total=0,aces=0;for(const c of hand){const rank=c.slice(0,-1);total+=rank==='A'?11:['J','Q','K'].includes(rank)?10:Number(rank);if(rank==='A')aces++;}while(total>21&&aces){total-=10;aces--;}return total;}
export function shuffle(random:()=>number){const deck=[...DECK];for(let i=deck.length-1;i>0;i--){const value=random();if(!Number.isFinite(value)||value<0||value>=1)throw new Error('Source aléatoire invalide.');const j=Math.floor(value*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}
const initial=():HybridState=>({round:1,status:'idle',failures:0,completedRounds:0,rescue:false,team:[],dealer:[],shoe:[],slots:[null,null,null],aceValues:{AD:1,AH:1},locks:[]});
function outcome(team:Card[],dealer:Card[]){const a=score(team),b=score(dealer),naturalA=team.length===2&&a===21,naturalB=dealer.length===2&&b===21;if(a>21)return 'lost';if(b>21)return 'won';if(naturalA!==naturalB)return naturalA?'won':'lost';return a>b?'won':a===b?'tie':'lost';}
function finish(state:HybridState){state.status=outcome(state.team,state.dealer);if(state.status==='won')state.completedRounds=1;else state.failures++;return state.status==='won'?'Victoire au casino : ♣ obtenu.':state.status==='tie'?'Égalité : recommencez.':'Défaite : recommencez.';}
function maintain(state:HybridState,context:PuzzleContext){return {...state,locks:state.locks.filter(lock=>lock.expiresAt>context.now&&context.players.includes(lock.owner))};}
function solvedSlots(state:HybridState){const selected=state.slots.filter((c):c is Card=>c!==null);return selected.length===3&&(state.round===2?selected.every(c=>DOUBLE_ACES.includes(c))&&state.aceValues.AD+9+state.aceValues.AH===21:selected.every(c=>IMPOSSIBLE.includes(c))&&score(selected)===21);}

// The random source is injected by server composition; no transport, rendering or Node dependency.
export function createBlackjackHybrid(random:()=>number):PuzzleModule<Config,HybridState,HybridAction>{return {
  type:'blackjack-hybrid',schemaVersion:1,
  allowedActions:['deal','hit','stand','retry','next_round','pick_card','drop_card','cancel_card','return_card','assign_ace','submit'],
  parseConfig(value){const c=record(value,['hints','rewards']);const hints=list(c.hints,8).map(h=>text(h,500)),rewards=list(c.rewards,3).map(value=>{const r=record(value,['id','label']);return {id:identifier(r.id),label:text(r.label,64)};});if(rewards.length!==3)throw new Error('Trois récompenses attendues.');unique(rewards.map(r=>r.id));return {hints,rewards};},
  initialState:initial,
  parseState(value){
    const s=record(value,['round','status','failures','completedRounds','rescue','team','dealer','shoe','slots','aceValues','locks']);
    const round=integer(s.round,1,3) as 1|2|3,status=s.status as HybridState['status'];if(!['idle','playing','lost','tie','won','complete'].includes(status))throw new Error('Statut invalide.');
    const failures=integer(s.failures),completedRounds=integer(s.completedRounds,0,3),rescue=bool(s.rescue),team=cards(s.team),dealer=cards(s.dealer),shoe=cards(s.shoe);
    const slots=list(s.slots,3).map(c=>c===null?null:card(c));if(slots.length!==3)throw new Error('Trois logements attendus.');unique(slots.filter(c=>c!==null));
    const values=record(s.aceValues,['AD','AH']),aceValues={AD:aceValue(values.AD),AH:aceValue(values.AH)};
    const locks=list(s.locks,5).map(value=>{const l=record(value,['card','owner','expiresAt']);return {card:card(l.card),owner:text(l.owner,64),expiresAt:integer(l.expiresAt)};});unique(locks.map(l=>l.card));unique(locks.map(l=>l.owner));
    const state:HybridState={round,status,failures,completedRounds,rescue,team,dealer,shoe,slots,aceValues,locks};
    if(completedRounds!==(round-1+(status==='won'||status==='complete'?1:0)))throw new Error('Récompenses de manche incohérentes.');
    if(round===1){
      if(status==='complete'||locks.length||slots.some(c=>c!==null)||aceValues.AD!==1||aceValues.AH!==1)throw new Error('Casino incohérent.');
      if(status==='idle'){if(team.length||dealer.length||shoe.length||rescue||failures)throw new Error('Départ incohérent.');}
      else {if(team.length<2||dealer.length<2||unique([...team,...dealer,...shoe]).length!==52)throw new Error('Paquet incohérent.');
        if(rescue&&(failures<3||team[0]!=='10C'||team[1]!=='9D'||dealer[0]!=='10H'||dealer[1]!=='7S'))throw new Error('Rattrapage incohérent.');
        if(status==='playing'&&(score(team)>=21||dealer.length!==2||score(dealer)===21))throw new Error('Main active incohérente.');
        if(status!=='playing'&&(status!==outcome(team,dealer)||status!=='won'&&failures===0||score(team)<=21&&!(team.length===2&&score(team)===21)&&!(dealer.length===2&&score(dealer)===21)&&score(dealer)<17))throw new Error('Résultat incohérent.');}
    }else{
      const available=round===2?DOUBLE_ACES:IMPOSSIBLE;
      if(team.length||dealer.length||shoe.length||rescue||slots.some(c=>c!==null&&!available.includes(c))||locks.some(l=>!available.includes(l.card)))throw new Error('Cartes de manche incohérentes.');
      if(!['playing',round===2?'won':'complete'].includes(status)||round===3&&(aceValues.AD!==1||aceValues.AH!==1))throw new Error('Statut de manche incohérent.');
      if(status!=='playing'&&(!solvedSlots(state)||locks.length))throw new Error('Solution incohérente.');
    }
    return state;
  },
  parseAction(value){
    const a=record(value,['action','card','slot','value']);
    if(['deal','hit','stand','retry','next_round','submit','cancel_card','return_card'].includes(String(a.action))){if(Object.keys(a).length!==1)throw new Error('Champs superflus.');return {action:a.action} as HybridAction;}
    if(a.action==='pick_card'&&Object.keys(a).sort().join(',')==='action,card')return {action:'pick_card',card:card(a.card)};
    if(a.action==='drop_card'&&Object.keys(a).sort().join(',')==='action,slot')return {action:'drop_card',slot:integer(a.slot,0,2)};
    if(a.action==='assign_ace'&&Object.keys(a).sort().join(',')==='action,card,value'&&(a.card==='AD'||a.card==='AH'))return {action:'assign_ace',card:a.card,value:aceValue(a.value)};
    throw new Error('Action blackjack invalide.');
  },
  maintain:(_config,state,context)=>maintain(state,context),
  reduce(_config,source,action,context){
    const reject=(message:string)=>({accepted:false,state:source,message});
    if(!context?.actorId||!context.players.includes(context.actorId))return reject('Joueur connecté requis.');
    const state=maintain(structuredClone(source),context),actor=context.actorId;
    if(['deal','hit','stand','retry'].includes(action.action)&&context.captainId!==actor)return reject('Seul le capitaine peut distribuer, tirer ou rester.');
    if(state.status==='complete')return reject('Les trois manches sont déjà réussies.');
    if(action.action==='next_round'){
      if(state.status!=='won'||state.round===3)return reject('Remportez cette manche avant de continuer.');
      return {accepted:true,state:{...state,round:(state.round+1) as 2|3,status:'playing',team:[],dealer:[],shoe:[],rescue:false,slots:[null,null,null],locks:[],aceValues:{AD:1,AH:1}},message:'Manche suivante : placez trois cartes dans les logements.'};
    }
    if(state.round===1){
      if(action.action==='deal'||action.action==='retry'){
        if(action.action==='deal'&&state.status!=='idle'||action.action==='retry'&&!['lost','tie'].includes(state.status))return reject('Cette distribution n’est pas disponible.');
        state.shoe=shuffle(random);state.rescue=state.failures>=3;state.team=[];state.dealer=[];
        if(state.rescue){state.team=['10C','9D'];state.dealer=['10H','7S'];state.shoe=state.shoe.filter(c=>![...state.team,...state.dealer].includes(c));}
        else {state.team.push(state.shoe.pop()!);state.dealer.push(state.shoe.pop()!);state.team.push(state.shoe.pop()!);state.dealer.push(state.shoe.pop()!);}
        state.status='playing';if(score(state.team)===21||score(state.dealer)===21)return {accepted:true,state,message:finish(state)};
        return {accepted:true,state,message:state.rescue?'Main de rattrapage : 19 contre 17. Choisissez Rester.':'Main collective distribuée. Le capitaine choisit Tirer ou Rester.'};
      }
      if(state.status!=='playing'||action.action!=='hit'&&action.action!=='stand')return reject('Action indisponible pour cette main.');
      if(action.action==='hit'){state.team.push(state.shoe.pop()!);if(score(state.team)>21)return {accepted:true,state,message:finish(state)};if(score(state.team)<21)return {accepted:true,state,message:'Carte ajoutée à la main collective.'};}
      while(score(state.dealer)<17)state.dealer.push(state.shoe.pop()!);
      return {accepted:true,state,message:finish(state)};
    }
    if(state.status!=='playing')return reject('Passez à la manche suivante.');
    if(action.action==='pick_card'){
      if(!(state.round===2?DOUBLE_ACES:IMPOSSIBLE).includes(action.card))return reject('Cette carte ne fait pas partie de la manche.');
      if(state.locks.some(l=>l.card===action.card||l.owner===actor))return reject('Carte déjà réservée ou vous tenez déjà une carte.');
      state.locks.push({card:action.card,owner:actor,expiresAt:context.now+15000});return {accepted:true,state,message:'Carte réservée 15 secondes. Choisissez un logement.'};
    }
    if(action.action==='drop_card'){
      const lock=state.locks.find(l=>l.owner===actor);if(!lock)return reject('Sélectionnez une carte ; votre réservation a peut-être expiré.');
      if(state.slots[action.slot]!==null&&state.slots[action.slot]!==lock.card)return reject('Ce logement est occupé.');
      state.slots=state.slots.map(c=>c===lock.card?null:c);state.slots[action.slot]=lock.card;state.locks=state.locks.filter(l=>l!==lock);return {accepted:true,state,message:'Carte déposée dans le logement partagé.'};
    }
    if(action.action==='cancel_card'||action.action==='return_card'){
      const lock=state.locks.find(l=>l.owner===actor);if(!lock)return reject('Aucune carte réservée.');if(action.action==='return_card')state.slots=state.slots.map(c=>c===lock.card?null:c);state.locks=state.locks.filter(l=>l.owner!==actor);return {accepted:true,state,message:'Carte libérée.'};
    }
    if(action.action==='assign_ace'){
      if(state.round!==2||!state.slots.includes(action.card)||state.locks.some(l=>l.card===action.card)||state.aceValues[action.card]===action.value)return reject('Posez cet As et choisissez une valeur différente.');
      state.aceValues[action.card]=action.value;return {accepted:true,state,message:'Valeur de l’As mise à jour.'};
    }
    if(action.action==='submit'){
      if(state.locks.length)return reject('Déposez ou libérez les cartes réservées avant de valider.');
      if(!solvedSlots(state))return reject('Il faut exactement trois cartes pour 21. Vérifiez aussi la valeur des As.');
      state.completedRounds=state.round;state.status=state.round===2?'won':'complete';return {accepted:true,state,message:state.round===2?'Double as réussi : ♥ obtenu.':'Le croupier impossible est battu : ♠ obtenu.'};
    }
    return reject('Action indisponible dans cette manche.');
  },
  isSolved:(_config,state)=>state.completedRounds===3,
  publicState(_config,state):HybridPublicState{
    const {shoe:_shoe,dealer,...visible}=structuredClone(state),hidden=state.round===1&&state.status==='playing';
    return {...visible,dealer:hidden?[dealer[0],null]:dealer,teamTotal:score(state.team),dealerTotal:hidden?null:state.round===3?20:score(dealer),cards:state.round===2?[...DOUBLE_ACES]:state.round===3?[...IMPOSSIBLE]:[]};
  },
  hints:config=>config.hints,
  objects:()=>[{id:'table',view:'blackjack-hybrid-table',role:'interactive'}],
  rewards:config=>config.rewards,
  earnedRewards:(config,state)=>config.rewards.slice(0,state.completedRounds),
};}
