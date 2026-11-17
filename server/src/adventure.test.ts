import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Adventure,parseAdventureCommand,blackjackScore,type AdventureCommand,SYMBOLS,CARDS } from './adventure.js';
import { parseRoom,suggestPuzzleLayout,type RoomModel } from './scene-schema.js';
import { RoomStore } from './room-store.js';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function fixture(){const room:RoomModel={id:'puzzles',name:'Salon',floor:[{x:0,z:0},{x:8,z:0},{x:8,z:6},{x:0,z:6}],height:2.5,obstacles:[],openings:[]};room.puzzles=suggestPuzzleLayout(room);return room;}
function game(){const room=fixture(),adventure=new Adventure();adventure.configure(room);return {room,adventure,act(action:AdventureCommand['action'],target:string,extra:Partial<AdventureCommand>={}){const point=action==='press_symbol'?'chest':action==='choose_card'?'table':target as keyof typeof room.puzzles.points;return adventure.act(parseAdventureCommand({type:'adventure_action',revision:adventure.snapshot().revision,libraryRevision:1,action,target,position:room.puzzles!.points[point],simulation:false,...extra}),room,1);}};}
test('actions réseau : schéma strict, valeurs et cibles bornées',()=>{
  const command={type:'adventure_action',revision:1,libraryRevision:1,action:'discover_symbol',target:'sun',position:{x:1,z:1},simulation:false};
  assert.deepEqual(parseAdventureCommand(command),command);
  for(const extra of [{revision:-1},{revision:1.5},{libraryRevision:Infinity},{simulation:'false'},{target:'king'},{position:{x:NaN,z:1}},{position:{x:31,z:1}},{position:{x:1,z:1,y:0}},{unexpected:true},{action:'reset'}])assert.throws(()=>parseAdventureCommand({...command,...extra}));
});
test('blackjack : As souple, une carte donne respectivement 21, 15 ou 17',()=>{
  assert.deepEqual(blackjackScore([1,6,4]),{total:21,ace:11});
  assert.deepEqual(blackjackScore([1,6,8]),{total:15,ace:1});
  assert.deepEqual(blackjackScore([1,6,10]),{total:17,ace:1});
});
test('parcours partagé complet, erreurs récupérables et récompense',()=>{
  const g=game();assert.equal(g.act('press_symbol','sun').changed,false);
  assert.equal(g.act('choose_card','four').changed,false);
  for(const id of SYMBOLS)assert.equal(g.act('discover_symbol',id).changed,true);
  assert.equal(g.act('discover_symbol','sun').changed,false);
  g.act('press_symbol','moon');assert.equal(g.adventure.snapshot().symbols.attempts,1);
  assert.equal(g.adventure.snapshot().symbols.found.length,4);
  for(const id of SYMBOLS)g.act('press_symbol',id);
  assert.equal(g.adventure.snapshot().phase,'blackjack');
  assert.equal(g.act('choose_card','four').changed,false);
  for(const id of CARDS)g.act('discover_card',id);
  g.act('choose_card','eight');assert.equal(g.adventure.snapshot().blackjack.total,15);
  g.act('choose_card','king');assert.equal(g.adventure.snapshot().blackjack.total,17);
  g.act('choose_card','four');assert.equal(g.adventure.snapshot().phase,'complete');
  assert.equal(g.adventure.snapshot().blackjack.attempts,3);
  assert.equal(g.act('choose_card','four').changed,false);
});
test('proximité, révisions et simulation sont contrôlées par le serveur',()=>{
  const g=game(),initial=g.adventure.snapshot();
  for(const extra of [{revision:0},{libraryRevision:0},{position:{x:29,z:29}},{simulation:true}])assert.equal(g.act('discover_symbol','sun',extra).changed,false);
  assert.deepEqual(g.adventure.snapshot(),initial);
  const point=g.room.puzzles!.points.sun,far=g.room.puzzles!.points.tree;
  assert.ok(Math.hypot(point.x-far.x,point.z-far.z)>1.3);
  assert.equal(g.act('discover_symbol','sun',{position:far}).changed,false);
  g.adventure.setTestMode(true);assert.equal(g.act('discover_symbol','sun',{simulation:true}).changed,true);
  const snapshot=g.adventure.snapshot();snapshot.symbols.found.length=0;assert.equal(g.adventure.snapshot().symbols.found.length,1);
  g.adventure.configure({...g.room,name:'Autre pièce'});assert.equal(g.adventure.snapshot().symbols.found.length,0);
  assert.ok(g.adventure.snapshot().revision>snapshot.revision);
  g.adventure.configure(null);assert.equal(g.adventure.snapshot().phase,'unconfigured');
});
test('placements validés : neuf éléments distincts, hors murs et obstacles',()=>{
  const room=fixture();assert.deepEqual(parseRoom(room),room);
  const invalid=structuredClone(room);invalid.puzzles!.points.sun={...invalid.puzzles!.points.chest};assert.throws(()=>parseRoom(invalid));
  invalid.puzzles!.points.sun={x:-1,z:0};assert.throws(()=>parseRoom(invalid));
  const p=room.puzzles!.points.sun;assert.throws(()=>parseRoom({...room,obstacles:[{name:'Table',x:p.x,z:p.z,width:0.4,depth:0.4,height:0.7}]}));
  assert.throws(()=>parseRoom({...room,puzzles:{points:{sun:p}}}));
  const {puzzles,...old}=room;assert.equal(parseRoom(old).puzzles,undefined);
});
test('les placements survivent au rechargement du stockage des pièces',()=>{
  const directory=mkdtempSync(join(tmpdir(),'myroom-adventure-'));
  try{const room=fixture(),store=new RoomStore(directory);store.change('save',0,room);assert.deepEqual(new RoomStore(directory).active(),room);}
  finally{rmSync(directory,{recursive:true,force:true});}
});
