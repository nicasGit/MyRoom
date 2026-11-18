import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRegistry,createCatalog } from '../adventures/catalog.js';
import { legacyAdventure } from '../adventures/legacy.js';
import { menthe27 } from '../adventures/menthe27.js';
import { AdventureCatalog,parseManifest } from './adventure-manifest.js';
import { AdventureEngine } from './adventure-engine.js';
import { symbolChest,SYMBOLS } from '../puzzles/symbol-chest.js';
import { Adventure,parsePuzzleCommand } from '../adventure.js';
import { Room } from '../room.js';
import { parseRoom,suggestPuzzleLayout,type RoomModel } from '../scene-schema.js';
import { RoomStore } from '../room-store.js';
import { mkdtempSync,readFileSync,rmSync,writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function engine(id='myroom-classic',version='1.0.0'){const registry=createRegistry();return new AdventureEngine(registry,createCatalog(registry),id,version);}
function solveChest(game:AdventureEngine){
  const id=game.activeInstance()!.id;
  for(const action of ['discover_symbol','press_symbol'])for(const target of SYMBOLS){if(action==='discover_symbol'&&(game.activeInstance()?.state as {found:string[]}).found.includes(target))continue;const result=game.act(id,game.snapshot().revision,{action,target});assert.equal(result.changed,true,result.message);}
}

test('accès direct : test isolé, révisions, restauration et étapes indisponibles',()=>{
  const game=engine();game.testStep('blackjack',game.snapshot().revision);
  assert.equal(game.snapshot().testStartStepId,'blackjack');assert.deepEqual(game.snapshot().inventory,[]);assert.deepEqual(game.snapshot().completedSteps,[]);
  assert.throws(()=>game.testStep('symbols',game.snapshot().revision-1));
  const restored=engine();restored.restore(game.snapshot());assert.equal(restored.currentStep().id,'blackjack');
  const noMarker=structuredClone(game.snapshot());delete noMarker.testStartStepId;assert.throws(()=>restored.restore(noMarker));
  for(const target of ['four','eight','king'])assert.equal(game.act('blackjack',game.snapshot().revision,{action:'discover_card',target}).changed,true);
  game.act('blackjack',game.snapshot().revision,{action:'choose_card',target:'four'});
  assert.equal(game.snapshot().status,'complete');assert.equal(game.snapshot().inventory.length,1);
  restored.restore(game.snapshot());assert.deepEqual(restored.snapshot().completedSteps,['blackjack']);
  game.reset();assert.equal(game.snapshot().testStartStepId,undefined);
  const menthe=engine('menthe27','0.1.0'),before=menthe.snapshot();assert.throws(()=>menthe.testStep('casino',before.revision));assert.deepEqual(menthe.snapshot(),before);
});

test('façade : sortie de test restaure la partie normale sans récompenses simulées',()=>{
  const model:RoomModel={id:'test',name:'Test',height:2.5,floor:[{x:0,z:0},{x:8,z:0},{x:8,z:6},{x:0,z:6}],obstacles:[],openings:[]};model.puzzles=suggestPuzzleLayout(model);
  const facade=new Adventure();facade.configure(model);facade.start();facade.engine.act('chest',facade.engine.snapshot().revision,{action:'discover_symbol',target:'sun'});
  assert.throws(()=>facade.testStep('blackjack',facade.snapshot().revision));
  facade.setTestMode(true);const saved=facade.engine.snapshot();facade.testStep('blackjack',facade.snapshot().revision);
  assert.equal(facade.snapshot().phase,'blackjack');assert.throws(()=>facade.testStep('symbols',facade.snapshot().revision-1));
  facade.testStep('symbols',facade.snapshot().revision);solveChest(facade.engine);
  assert.equal(facade.engine.snapshot().inventory.length,1);
  facade.setTestMode(false);const after=facade.engine.snapshot();assert.deepEqual(after.instances,saved.instances);assert.deepEqual(after.inventory,saved.inventory);assert.equal(after.stepId,saved.stepId);assert.equal(after.running,saved.running);assert.equal(after.testStartStepId,undefined);
  facade.setTestMode(true);facade.testStep('blackjack',facade.snapshot().revision);facade.reset();facade.setTestMode(false);assert.deepEqual(facade.snapshot().symbols.found,[]);assert.equal(facade.snapshot().running,false);
});
test('module pur : coffre compatible, validation et aucune mutation de l’état source',()=>{
  const config=symbolChest.parseConfig(legacyAdventure.instances[0].config),initial=symbolChest.initialState(config);
  const result=symbolChest.reduce(config,initial,{action:'discover_symbol',target:'sun'});
  assert.deepEqual(initial.found,[]);assert.deepEqual(result.state.found,['sun']);
  assert.equal(symbolChest.reduce(config,result.state,{action:'discover_symbol',target:'sun'}).accepted,false);
  assert.throws(()=>symbolChest.parseAction({action:'press_symbol',target:'moon',cheat:true}));
  assert.throws(()=>symbolChest.parseState({found:[],entered:['sun'],attempts:0},config));
});
test('registre et manifestes : types, versions, références, cycles et configurations stricts',()=>{
  const registry=createRegistry();assert.throws(()=>registry.register(symbolChest));assert.throws(()=>registry.get('symbol-chest',2));assert.equal(registry.get('blackjack-hybrid',1).type,'blackjack-hybrid');
  assert.equal(parseManifest(menthe27,registry).steps[1].kind,'planned');
  const bad=structuredClone(legacyAdventure);bad.instances[0].schemaVersion=9;assert.throws(()=>parseManifest(bad,registry));
  const cycle=structuredClone(legacyAdventure);cycle.steps[1].next='symbols';assert.throws(()=>parseManifest(cycle,registry));
  const extra={...legacyAdventure,secret:true};assert.throws(()=>parseManifest(extra,registry));
  assert.throws(()=>parseManifest({...legacyAdventure,objects:[]},registry));
  registry.register({...symbolChest,type:'private-chest',publicState:(_config,state)=>({foundCount:state.found.length})});
  const masked=structuredClone(legacyAdventure);masked.id='private-demo';masked.instances[0].type='private-chest';
  const catalog=new AdventureCatalog(registry,[masked]),game=new AdventureEngine(registry,catalog,masked.id,masked.version);
  assert.deepEqual(game.publicState().instances[0].state,{foundCount:0});assert.ok(!('config' in game.publicState().instances[0]));
  assert.deepEqual((game.snapshot().instances[0].state as {found:string[]}).found,[]);
});
test('plusieurs instances du même coffre : états isolés, ordre propre et récompenses uniques',()=>{
  const registry=createRegistry(),base=parseManifest(legacyAdventure,registry),first=base.instances[0];
  const second={...structuredClone(first),id:'chest-two'};
  (second.config as {order:string[]}).order=[...SYMBOLS].reverse();
  const bindings=base.objects.filter(o=>o.instanceId==='chest');
  const manifest={...base,id:'two-chests',instances:[first,second],steps:[{...base.steps[0],next:'second'},{...base.steps[0],id:'second',instanceId:'chest-two',next:null}],objects:[...bindings,...bindings.map(o=>({...o,instanceId:'chest-two'}))],victory:{requiredSteps:['symbols','second']}};
  const catalog=new AdventureCatalog(registry,[manifest]);const game=new AdventureEngine(registry,catalog,'two-chests','1.0.0');game.start();solveChest(game);
  assert.equal(game.activeInstance()?.id,'chest-two');assert.deepEqual((game.activeInstance()?.state as {found:string[]}).found,[]);
  const id=game.activeInstance()!.id;
  for(const target of SYMBOLS)game.act(id,game.snapshot().revision,{action:'discover_symbol',target});
  for(const target of [...SYMBOLS].reverse())game.act(id,game.snapshot().revision,{action:'press_symbol',target});
  assert.equal(game.snapshot().status,'complete');assert.equal(game.snapshot().inventory.length,1);
  assert.equal(game.snapshot().instances.filter(i=>i.solved).length,2);
});
test('Menthe 27 : coffre réussi puis attente explicite, sans faux succès ni blackjack hybride',()=>{
  const game=engine('menthe27','0.1.0');game.start();solveChest(game);
  const state=game.snapshot();assert.equal(state.status,'pending');assert.equal(state.running,false);
  assert.deepEqual(state.completedSteps,['symbols']);assert.deepEqual(state.inventory,[{id:'casino-access',label:'Accès au casino'}]);
  assert.equal(game.currentStep().kind,'planned');assert.throws(()=>game.start());
  assert.equal(game.act('menthe-chest',state.revision,{action:'press_symbol',target:'star'}).changed,false);
});
test('actions périmées et mauvaises instances ne modifient ni état ni récompenses',()=>{
  const game=engine();game.start();const snapshot=game.snapshot(),id=game.activeInstance()!.id;
  assert.equal(game.act(id,snapshot.revision-1,{action:'discover_symbol',target:'sun'}).changed,false);
  assert.equal(game.act('blackjack',snapshot.revision,{action:'discover_card',target:'four'}).changed,false);
  assert.equal(game.act(id,snapshot.revision,{action:'reset'}).changed,false);assert.deepEqual(game.snapshot(),snapshot);
  solveChest(game);const after=game.snapshot();assert.equal(game.act(id,after.revision-1,{action:'press_symbol',target:'star'}).changed,false);assert.deepEqual(game.snapshot(),after);
});
test('instantané versionné : aller-retour JSON, révision nouvelle et corruption refusée atomiquement',()=>{
  const game=engine();game.start();game.act('chest',game.snapshot().revision,{action:'discover_symbol',target:'sun'});
  const saved=JSON.parse(JSON.stringify(game.snapshot())),restored=engine();restored.restore(saved);
  assert.deepEqual(restored.snapshot().instances,saved.instances);assert.ok(restored.snapshot().revision>saved.revision);
  const before=restored.snapshot();
  for(const mutate of [(s:any)=>s.schemaVersion=2,(s:any)=>s.adventureVersion='99.0.0',(s:any)=>s.inventory.push({id:'cheat',label:'Cheat'}),(s:any)=>s.instances[1].state.found=['four'],(s:any)=>s.completedSteps=['blackjack'],(s:any)=>s.instances[0].state.entered=['star']]){
    const invalid=structuredClone(saved);mutate(invalid);assert.throws(()=>restored.restore(invalid));assert.deepEqual(restored.snapshot(),before);
  }
  solveChest(game);const next=engine();next.restore(game.snapshot());assert.deepEqual(next.snapshot().inventory,game.snapshot().inventory);assert.equal(next.currentStep().id,'blackjack');
  for(const target of ['four','eight','king'])next.act('blackjack',next.snapshot().revision,{action:'discover_card',target});
  next.act('blackjack',next.snapshot().revision,{action:'choose_card',target:'four'});assert.equal(next.snapshot().status,'complete');
  const completed=engine();completed.restore(next.snapshot());completed.restore(completed.snapshot());assert.equal(completed.snapshot().inventory.length,2);assert.equal(completed.snapshot().status,'complete');
  completed.resetActive(completed.snapshot().revision);assert.equal(completed.snapshot().status,'ready');assert.deepEqual(completed.snapshot().completedSteps,['symbols']);const replay=engine();replay.restore(completed.snapshot());assert.equal(replay.snapshot().inventory.length,1);replay.start();assert.equal(replay.currentStep().id,'blackjack');
  const pending=engine('menthe27','0.1.0');pending.start();solveChest(pending);const pendingCopy=engine('menthe27','0.1.0');pendingCopy.restore(pending.snapshot());assert.equal(pendingCopy.snapshot().status,'pending');
});
test('sélection et noms : sécurité des révisions, indépendance du jeu et réutilisation des places',()=>{
  const room=new Room();room.adventure.configure(null);const revision=room.adventure.snapshot().revision;
  room.adventure.select('menthe27','0.1.0',revision);assert.equal(room.adventure.snapshot().engine.adventureId,'menthe27');
  assert.throws(()=>room.adventure.select('myroom-classic','1.0.0',revision));
  room.setPlayerNames(['Léon','Reno','Fabien','Nicolas'],0);room.join('first');assert.equal(room.snapshot().players[0].name,'Léon');
  room.players.delete('first');room.join('second');assert.equal(room.snapshot().players[0].name,'Léon');
  assert.throws(()=>room.setPlayerNames(['a','b','c','d'],0));assert.throws(()=>room.setPlayerNames(['a','b','c','\n'],1));
  assert.throws(()=>room.setPlayerNames(['a','b','c'],1));assert.equal(room.playerNamesRevision,1);
});
test('ancienne bibliothèque : sélection et modules ne réécrivent jamais les pièces',()=>{
  const directory=mkdtempSync(join(tmpdir(),'myroom-phase1-'));
  try{
    const room:RoomModel={id:'old',name:'Ancienne pièce',height:2.5,floor:[{x:0,z:0},{x:8,z:0},{x:8,z:6},{x:0,z:6}],obstacles:[],openings:[]};room.puzzles=suggestPuzzleLayout(room);delete room.puzzles.panel;
    const file=join(directory,'rooms.json');writeFileSync(file,JSON.stringify({version:1,revision:8,activeId:'old',rooms:[room]}));const bytes=readFileSync(file,'utf8');
    const store=new RoomStore(directory),facade=new Adventure();facade.configure(store.active());facade.select('menthe27','0.1.0',facade.snapshot().revision);facade.start();
    assert.equal(readFileSync(file,'utf8'),bytes);assert.deepEqual(store.active()?.puzzles?.points,parseRoom(room).puzzles?.points);
  }finally{rmSync(directory,{recursive:true,force:true});}
});
test('catalogue externe : nouvelle aventure JSON sans changement du moteur, fichier invalide refusé',()=>{
  const directory=mkdtempSync(join(tmpdir(),'myroom-catalog-'));
  try{writeFileSync(join(directory,'custom.json'),JSON.stringify({...legacyAdventure,id:'custom',title:'Autre aventure'}));assert.equal(createCatalog(createRegistry(),directory).get('custom','1.0.0').title,'Autre aventure');writeFileSync(join(directory,'bad.json'),'{}');assert.throws(()=>createCatalog(createRegistry(),directory));assert.equal(readFileSync(join(directory,'bad.json'),'utf8'),'{}');}
  finally{rmSync(directory,{recursive:true,force:true});}
});
test('nouvelle enveloppe générique : identifiant d’instance et champs stricts',()=>{
  const value={type:'puzzle_action',revision:1,libraryRevision:1,instanceId:'chest',action:{action:'discover_symbol',target:'sun'},position:{x:1,z:1},simulation:false};
  assert.deepEqual(parsePuzzleCommand(value),value);assert.throws(()=>parsePuzzleCommand({...value,instanceId:'../other'}));assert.throws(()=>parsePuzzleCommand({...value,extra:true}));
});
