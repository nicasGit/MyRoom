import test from 'node:test';
import assert from 'node:assert/strict';
import { retroVideoclub } from './retro-videoclub.js';

const config=retroVideoclub.parseConfig({order:['tape-red','tape-blue','tape-gold'],hints:['h'],rewards:[{id:'access',label:'Accès'}]});
const context={now:0,players:['p1'],actorId:'p1'};

test('vidéoclub : découverte, mauvais montage puis ordre gagnant',()=>{
  let state=retroVideoclub.initialState();
  for(const tape of ['tape-red','tape-blue','tape-gold'] as const){const result=retroVideoclub.reduce(config,state,{action:'discover_tape',tape},context);assert.equal(result.accepted,true);state=result.state;}
  let result=retroVideoclub.reduce(config,state,{action:'place_tape',tape:'tape-blue',slot:0},context);state=result.state;
  result=retroVideoclub.reduce(config,state,{action:'place_tape',tape:'tape-red',slot:1},context);state=result.state;
  result=retroVideoclub.reduce(config,state,{action:'place_tape',tape:'tape-gold',slot:2},context);assert.equal(result.accepted,true);state=result.state;assert.equal(state.attempts,1);
  for(const [tape,slot] of [['tape-red',0],['tape-blue',1],['tape-gold',2]] as const){state=retroVideoclub.reduce(config,state,{action:'place_tape',tape,slot},context).state;}
  assert.equal(retroVideoclub.isSolved(config,state),true);
});
