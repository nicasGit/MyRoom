import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBlackjackHybrid,DECK,score,shuffle,type HybridState,type HybridAction } from './blackjack-hybrid.js';
import { menthe27Hybrid } from '../adventures/menthe27.js';
import { createRegistry,createCatalog } from '../adventures/catalog.js';
import { AdventureEngine } from '../engine/adventure-engine.js';
import { Room } from '../room.js';
const module=createBlackjackHybrid(()=>0.37),config=module.parseConfig(menthe27Hybrid.instances[1].config);
const context={actorId:'one',captainId:'one',players:['one','two','three','four'],now:1000};
function hand(team:string[],dealer:string[],failures=0):HybridState{return {...module.initialState(config),status:'playing',team,dealer,failures,shoe:DECK.filter(c=>!team.includes(c)&&!dealer.includes(c))};}
function apply(state:HybridState,action:HybridAction,who=context){const result=module.reduce(config,module.parseState(state,config),module.parseAction(action),who);if(result.accepted)module.parseState(result.state,config);return result;}
function next(state:HybridState,action:HybridAction,who=context){const result=apply(state,action,who);assert.equal(result.accepted,true,result.message);return result.state;}
function second(){return next(next(hand(['10C','9D'],['10H','7S']),{action:'stand'}),{action:'next_round'});}
function place(state:HybridState,cards:string[]){for(const [slot,card] of cards.entries()){state=next(state,{action:'pick_card',card});state=next(state,{action:'drop_card',slot});}return state;}
test('hybride : 52 cartes, mélange injecté et As souples',()=>{
  assert.equal(DECK.length,52);assert.equal(new Set(DECK).size,52);assert.deepEqual([...shuffle(()=>0.37)].sort(),[...DECK].sort());assert.notDeepEqual(shuffle(()=>0.37),DECK);
  assert.equal(score(['AD','9S','AH']),21);assert.equal(score(['AC','6D']),17);assert.equal(score(['KC','QD','AH']),21);
  assert.throws(()=>shuffle(()=>1));assert.throws(()=>module.parseAction({action:'stand',captain:true}));assert.throws(()=>module.parseAction({action:'assign_ace',card:'AD',value:10}));
});
test('casino : capitaine seul, victoire/défaite/égalité, croupier reste à 17 souple',()=>{
  const state=hand(['10C','9D'],['AH','6S']),denied=apply(state,{action:'stand'},{...context,actorId:'two'});assert.equal(denied.accepted,false);assert.deepEqual(denied.state,state);
  const win=next(state,{action:'stand'});assert.equal(win.status,'won');assert.equal(win.dealer.length,2);assert.equal(win.completedRounds,1);
  assert.equal(next(hand(['10C','7D'],['10H','7S']),{action:'stand'}).status,'tie');assert.equal(next(hand(['10C','6D'],['10H','7S']),{action:'stand'}).status,'lost');
  const lose=next(hand(['10C','QD'],['10H','7S']),{action:'hit'});assert.equal(lose.status,'lost');assert.equal(lose.failures,1);
  const draws=next(hand(['10C','9D'],['10H','6S']),{action:'stand'});assert.ok(score(draws.dealer)>=17);
});
test('casino : distribution et blackjack naturel cohérents',()=>{
  for(const random of [()=>0,()=>0.999,()=>0.37]){const game=createBlackjackHybrid(random),initial=game.initialState(config),r=game.reduce(config,initial,{action:'deal'},context);assert.equal(r.accepted,true);game.parseState(r.state,config);assert.deepEqual(initial.team,[]);assert.equal([...r.state.team,...r.state.dealer,...r.state.shoe].length,52);}
  const natural=hand(['AC','KH'],['9D','10S','2C']);natural.status='won';natural.completedRounds=1;module.parseState(natural,config);assert.throws(()=>module.parseState({...natural,status:'tie'},config));
});
test('casino : trois échecs puis rattrapage 19 contre 17 gagné en restant',()=>{
  let state=hand(['10C','6D'],['10H','7S']);for(let fail=1;fail<=3;fail++){state=next(hand(['10C','6D'],['10H','7S'],fail-1),{action:'stand'});assert.equal(state.failures,fail);}
  state=next(state,{action:'retry'});assert.equal(state.rescue,true);assert.equal(score(state.team),19);assert.equal(score(state.dealer),17);state=next(state,{action:'stand'});assert.equal(state.status,'won');assert.deepEqual(module.earnedRewards!(config,state),[config.rewards[0]]);
});
test('confidentialité : aucun paquet ni total caché dans la projection publique',()=>{
  const state=hand(['10C','9D'],['10H','7S']),visible=module.publicState(config,state) as any;assert.equal(visible.shoe,undefined);assert.deepEqual(visible.dealer,['10H',null]);assert.equal(visible.dealerTotal,null);
  const revealed=module.publicState(config,next(state,{action:'stand'})) as any;assert.deepEqual(revealed.dealer,['10H','7S']);assert.equal(revealed.dealerTotal,17);
});
test('double as : dépôt, deux solutions équivalentes et refus du total 11',()=>{
  for(const high of ['AD','AH'] as const){let state=place(second(),['AD','9S','AH']);assert.equal(apply(state,{action:'submit'}).accepted,false);state=next(state,{action:'assign_ace',card:high,value:11});state=next(state,{action:'submit'});assert.equal(state.status,'won');assert.equal(state.completedRounds,2);assert.equal(module.earnedRewards!(config,state).length,2);}
});
test('croupier impossible : exactement trois cartes, correction et récompense finale',()=>{
  let state=place(second(),['AD','9S','AH']);state=next(state,{action:'assign_ace',card:'AD',value:11});state=next(state,{action:'submit'});state=next(state,{action:'next_round'});assert.equal(apply(state,{action:'submit'}).accepted,false);
  state=place(state,['10H','8C','5D']);assert.equal(apply(state,{action:'submit'}).accepted,false);state=next(state,{action:'pick_card',card:'5D'});state=next(state,{action:'return_card'});state=next(state,{action:'pick_card',card:'3S'});state=next(state,{action:'drop_card',slot:2});state=next(state,{action:'submit'});
  assert.equal(state.status,'complete');assert.equal(module.isSolved(config,state),true);assert.equal(module.earnedRewards!(config,state).length,3);assert.equal(apply(state,{action:'submit'}).accepted,false);
});
test('cartes partagées : verrou, propriétaire, expiration et déconnexion',()=>{
  const state=next(second(),{action:'pick_card',card:'AD'});assert.equal(apply(state,{action:'pick_card',card:'AD'},{...context,actorId:'two'}).accepted,false);assert.equal(apply(state,{action:'drop_card',slot:0},{...context,actorId:'two'}).accepted,false);
  assert.equal(apply(state,{action:'drop_card',slot:0},{...context,now:16000}).accepted,false);assert.equal(module.maintain!(config,state,{...context,players:['two']}).locks.length,0);assert.equal(module.maintain!(config,state,{...context,now:16000}).locks.length,0);assert.equal(next(state,{action:'pick_card',card:'AD'},{...context,actorId:'two',now:16000}).locks[0].owner,'two');
});
test('moteur : récompenses partielles, restauration, indices et reset préservant le coffre',()=>{
  const registry=createRegistry(),catalog=createCatalog(registry),game=new AdventureEngine(registry,catalog,'menthe27','0.2.0');game.start();for(const action of ['discover_symbol','press_symbol'])for(const target of ['sun','tree','moon','star'])assert.equal(game.act('menthe-chest',game.snapshot().revision,{action,target}).changed,true);
  const saved=game.snapshot();saved.instances[1].state=next(hand(['10C','9D'],['10H','7S']),{action:'stand'});saved.inventory.push(config.rewards[0]);game.restore(saved);assert.equal(game.snapshot().inventory.length,2);game.hint(game.snapshot().revision);assert.equal(game.publicState().instances[1].hints.length,1);assert.throws(()=>game.hint(game.snapshot().revision-1));game.resetActive(game.snapshot().revision);assert.deepEqual(game.snapshot().inventory,[saved.inventory[0]]);assert.equal(game.currentStep().id,'casino');
  const copy=new AdventureEngine(registry,catalog,'menthe27','0.2.0');copy.restore(game.snapshot());assert.equal(copy.snapshot().inventory.length,1);
});
test('capitaine : réattribution après départ sans vol par une nouvelle connexion',()=>{const room=new Room();for(const id of ['one','two','three','four'])room.join(id);room.snapshot();assert.equal(room.captainId,'one');room.leave('one');assert.equal(room.captainId,'two');room.join('new');room.snapshot();assert.equal(room.captainId,'two');});
test('aventure normale : coffre puis trois manches, inventaire conservé et suite en attente',()=>{
  const registry=createRegistry(),catalog=createCatalog(registry),game=new AdventureEngine(registry,catalog,'menthe27','0.2.0');game.start();
  for(const action of ['discover_symbol','press_symbol'])for(const target of ['sun','tree','moon','star'])assert.equal(game.act('menthe-chest',game.snapshot().revision,{action,target}).changed,true);
  const act=(action:HybridAction)=>{const result=game.act('menthe-blackjack',game.snapshot().revision,action,context);assert.equal(result.changed,true,result.message);};
  act({action:'deal'});for(let tries=0;(game.activeInstance()!.state as HybridState).status!=='won'&&tries<10;tries++){const state=game.activeInstance()!.state as HybridState;act({action:state.status==='playing'?'stand':'retry'});}
  assert.equal((game.activeInstance()!.state as HybridState).status,'won');act({action:'next_round'});
  for(const [slot,card] of ['AD','9S','AH'].entries()){act({action:'pick_card',card});act({action:'drop_card',slot});}act({action:'assign_ace',card:'AH',value:11});act({action:'submit'});
  const intermediate=game.snapshot(),restored=new AdventureEngine(registry,catalog,'menthe27','0.2.0');restored.restore(intermediate);assert.equal(restored.snapshot().inventory.length,3);
  const invalid=structuredClone(intermediate);invalid.inventory.pop();assert.throws(()=>restored.restore(invalid));
  act({action:'next_round'});for(const [slot,card] of ['10H','8C','3S'].entries()){act({action:'pick_card',card});act({action:'drop_card',slot});}act({action:'submit'});
  assert.equal(game.snapshot().testStartStepId,undefined);assert.equal(game.snapshot().status,'pending');assert.equal(game.currentStep().id,'videoclub');assert.deepEqual(game.snapshot().inventory.map(r=>r.label),['Accès au casino','♣','♥','♠']);restored.restore(game.snapshot());assert.equal(restored.snapshot().status,'pending');
});
