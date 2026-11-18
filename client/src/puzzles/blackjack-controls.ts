import type { HybridAction,HybridPublicState } from '../../../server/src/puzzles/blackjack-hybrid.js';
export const cardLabel=(card:string|null)=>card===null?'Dos de carte':card.slice(0,-1)+({C:'♣',D:'♦',H:'♥',S:'♠'}[card.slice(-1)]??'');
export function hybridOptions(state:HybridPublicState,actor:string|undefined,captain:string|undefined){
  const options:{label:string;action:HybridAction;enabled:boolean}[]=[];
  const add=(label:string,action:HybridAction,enabled=true)=>options.push({label,action,enabled});
  const leader=!!actor&&actor===captain;
  if(state.round===1){
    if(state.status==='idle')add('Distribuer',{action:'deal'},leader);
    if(state.status==='playing'){add('Tirer',{action:'hit'},leader);add('Rester',{action:'stand'},leader);}
    if(state.status==='lost'||state.status==='tie')add(state.failures>=3?'Main de rattrapage':'Nouvelle tentative',{action:'retry'},leader);
  }else if(state.status==='playing'){
    const held=state.locks.find(l=>l.owner===actor);
    for(const card of state.cards)add('Choisir '+cardLabel(card),{action:'pick_card',card},!held&&!state.locks.some(l=>l.card===card));
    for(let slot=0;slot<3;slot++)add(`Déposer ${slot+1} : ${state.slots[slot]?cardLabel(state.slots[slot]):'vide'}`,{action:'drop_card',slot},!!held&&(state.slots[slot]===null||state.slots[slot]===held.card));
    if(state.round===2)for(const card of ['AD','AH'] as const)for(const value of [1,11] as const)add(`${cardLabel(card)} = ${value}`,{action:'assign_ace',card,value},state.slots.includes(card)&&!state.locks.some(l=>l.card===card)&&state.aceValues[card]!==value);
    add('Remettre la carte en réserve',{action:'return_card'},!!held);add('Libérer la sélection',{action:'cancel_card'},!!held);
    add('Valider les trois cartes',{action:'submit'},state.slots.every(c=>c!==null)&&state.locks.length===0);
  }
  if(state.status==='won')add('Manche suivante',{action:'next_round'});
  return options;
}
export function hybridSummary(state:HybridPublicState){
  if(state.round===1)return `Manche 1 — Casino · Équipe : ${state.team.map(cardLabel).join(' + ')||'à distribuer'} (${state.teamTotal}) · Croupier : ${state.dealer.map(cardLabel).join(' + ')||'à distribuer'}${state.dealerTotal===null?'':` (${state.dealerTotal})`} · Échecs : ${state.failures}${state.rescue?' · Rattrapage':''}`;
  return `Manche ${state.round} — ${state.round===2?'Double as':'Croupier impossible (20)'} · Logements : ${state.slots.map(card=>card===null?'vide':cardLabel(card)).join(' / ')}${state.round===2?` · A♦=${state.aceValues.AD}, A♥=${state.aceValues.AH}`:''}`;
}
