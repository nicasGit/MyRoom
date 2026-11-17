import { inside,type Point2,type RoomModel } from './scene-schema.js';
export const SYMBOLS=['sun','tree','moon','star'] as const;
export const CARDS=['four','eight','king'] as const;
export type SymbolId=typeof SYMBOLS[number];
export type CardId=typeof CARDS[number];
export type AdventureCommand={type:'adventure_action';revision:number;libraryRevision:number;action:'discover_symbol'|'press_symbol'|'discover_card'|'choose_card';target:string;position:Point2;simulation:boolean};
export type AdventureState={running:boolean;revision:number;phase:'unconfigured'|'symbols'|'blackjack'|'complete';testMode:boolean;symbols:{found:SymbolId[];entered:SymbolId[];attempts:number};blackjack:{found:CardId[];chosen:CardId|null;total:number;ace:number;attempts:number};message:string};
export function parseAdventureCommand(value:unknown):AdventureCommand{
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Action attendue.');
  const v=value as Record<string,unknown>,p=v.position as Record<string,unknown>|null;
  if(Object.keys(v).sort().join(',')!=='action,libraryRevision,position,revision,simulation,target,type'||v.type!=='adventure_action'||!Number.isSafeInteger(v.revision)||Number(v.revision)<0||!Number.isSafeInteger(v.libraryRevision)||Number(v.libraryRevision)<0||typeof v.simulation!=='boolean'||!p||typeof p!=='object'||Object.keys(p).sort().join(',')!=='x,z'||![p.x,p.z].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=30))throw new Error('Action d’énigme invalide.');
  const symbols=v.action==='discover_symbol'||v.action==='press_symbol',cards=v.action==='discover_card'||v.action==='choose_card';
  if((!symbols&&!cards)||typeof v.target!=='string'||!(symbols?SYMBOLS:CARDS).some(id=>id===v.target))throw new Error('Cible d’énigme invalide.');
  return v as unknown as AdventureCommand;
}
export function blackjackScore(values:number[]){let total=values.reduce((sum,v)=>sum+(v===1?11:v),0),aces=values.filter(v=>v===1).length;while(total>21&&aces>0){total-=10;aces--;}return {total,ace:aces>0?11:1};}
export class Adventure {
  private key='';
  private state:AdventureState={running:false,revision:0,phase:'unconfigured',testMode:false,symbols:{found:[],entered:[],attempts:0},blackjack:{found:[],chosen:null,total:17,ace:11,attempts:0},message:'Configurer les énigmes dans l’administration.'};
  configure(model:RoomModel|null){const key=JSON.stringify(model);if(key!==this.key){this.key=key;this.reset(!!model?.puzzles);}}
  reset(configured=this.state.phase!=='unconfigured'){
    this.state={running:false,revision:this.state.revision+1,phase:configured?'symbols':'unconfigured',testMode:this.state.testMode,symbols:{found:[],entered:[],attempts:0},blackjack:{found:[],chosen:null,total:17,ace:11,attempts:0},message:configured?'Retrouvez les quatre balises, puis entrez les symboles au coffre.':'Configurer les énigmes dans l’administration.'};
  }
  start(){if(this.state.phase==='unconfigured')throw new Error('Configurez les placements avant de commencer.');if(!this.state.running){this.state.running=true;this.state.revision++;}}
  setTestMode(enabled:boolean){if(enabled!==this.state.testMode){this.state.testMode=enabled;this.state.revision++;}}
  snapshot():AdventureState{return structuredClone(this.state);}
  act(command:AdventureCommand,model:RoomModel|null,libraryRevision:number):{changed:boolean;message:string}{
    this.configure(model);
    const reject=(message:string)=>({changed:false,message});
    if(!model?.puzzles)return reject('Les énigmes ne sont pas encore placées.');
    if(!this.state.running)return reject('La partie est en preparation. Attendez le depart.');
    if(command.revision!==this.state.revision||command.libraryRevision!==libraryRevision)return reject('La partie a changé. Réessayez avec le nouvel état.');
    if(command.simulation&&!this.state.testMode)return reject('Le test PC doit être autorisé par l’administrateur.');
    if(!inside(command.position,model.floor))return reject('Position déclarée hors de la pièce. Refaites le calibrage A/B.');
    const points=model.puzzles.points,target=command.action==='press_symbol'?'chest':command.action==='choose_card'?'table':command.target as SymbolId|CardId;
    if(Math.hypot(command.position.x-points[target].x,command.position.z-points[target].z)>1.3)return reject('Approchez-vous à moins de 1,3 m de cet élément.');
    if(command.action==='discover_symbol'){
      const id=command.target as SymbolId;if(this.state.phase!=='symbols')return reject('Le coffre est déjà ouvert.');
      if(this.state.symbols.found.includes(id))return reject('Cette balise est déjà découverte.');
      this.state.symbols.found.push(id);this.state.message='Symbole découvert pour toute l’équipe.';
    }else if(command.action==='press_symbol'){
      if(this.state.phase!=='symbols'||this.state.symbols.found.length!==4)return reject('Retrouvez les quatre balises avant de saisir la combinaison.');
      const id=command.target as SymbolId,entered=this.state.symbols.entered;
      if(id!==SYMBOLS[entered.length]){this.state.symbols.entered=[];this.state.symbols.attempts++;this.state.message='Le coffre refuse cet ordre. La combinaison est effacée ; les balises restent découvertes.';}
      else {entered.push(id);this.state.message='Le mécanisme accepte le symbole.';if(entered.length===4){this.state.phase='blackjack';this.state.message='Le coffre s’ouvre ! La table du dernier As est accessible.';}}
    }else if(command.action==='discover_card'){
      const id=command.target as CardId;if(this.state.phase!=='blackjack')return reject('Ouvrez d’abord le coffre des symboles.');
      if(this.state.blackjack.found.includes(id))return reject('Cette carte est déjà découverte.');
      this.state.blackjack.found.push(id);this.state.message='Indice de carte découvert pour toute l’équipe.';
    }else{
      if(this.state.phase!=='blackjack'||this.state.blackjack.found.length!==3)return reject('Retrouvez les trois cartes avant de choisir à la table.');
      const id=command.target as CardId,value={four:4,eight:8,king:10}[id],score=blackjackScore([1,6,value]);
      this.state.blackjack={...this.state.blackjack,chosen:id,...score,attempts:this.state.blackjack.attempts+1};
      if(score.total===21){this.state.phase='complete';this.state.message='Vingt-et-un ! Vous obtenez la clé virtuelle et le chiffre 7.';}
      else this.state.message=`Total ${score.total}, As compté comme ${score.ace}. Il faut exactement 21 avec une seule carte. Choisissez à nouveau ; la main repart de As + 6.`;
    }
    this.state.revision++;return {changed:true,message:this.state.message};
  }
}
