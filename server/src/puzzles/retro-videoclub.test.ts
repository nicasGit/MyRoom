import test from 'node:test';
import assert from 'node:assert/strict';
import { retroVideoclub } from './retro-videoclub.js';

const config=retroVideoclub.parseConfig({order:['tape-backfuture','tape-goonies','tape-gremlins','tape-indiana'],hints:['h'],rewards:[{id:'access',label:'Acces'}]});
const context={now:0,players:['p1'],actorId:'p1'};

test('videoclub : decouverte, mauvais montage puis ordre gagnant',()=>{
  let state=retroVideoclub.initialState(config);
  for(const tape of config.order){const result=retroVideoclub.reduce(config,state,{action:'discover_tape',tape},context);assert.equal(result.accepted,true);state=result.state;}
  let result=retroVideoclub.reduce(config,state,{action:'place_tape',tape:'tape-goonies',slot:0},context);state=result.state;
  result=retroVideoclub.reduce(config,state,{action:'place_tape',tape:'tape-backfuture',slot:1},context);state=result.state;
  result=retroVideoclub.reduce(config,state,{action:'place_tape',tape:'tape-gremlins',slot:2},context);state=result.state;
  result=retroVideoclub.reduce(config,state,{action:'place_tape',tape:'tape-indiana',slot:3},context);assert.equal(result.accepted,true);state=result.state;assert.equal(state.attempts,1);
  for(const [tape,slot] of config.order.map((tape,slot)=>[tape,slot] as const)){state=retroVideoclub.reduce(config,state,{action:'place_tape',tape,slot},context).state;}
  assert.equal(retroVideoclub.isSolved(config,state),true);
});

test('videoclub : les anciennes configurations a trois cassettes restent lisibles',()=>{
  const legacy=retroVideoclub.parseConfig({order:['tape-red','tape-blue','tape-gold'],hints:[],rewards:[]});
  assert.equal(retroVideoclub.initialState(legacy).slots.length,3);
});
