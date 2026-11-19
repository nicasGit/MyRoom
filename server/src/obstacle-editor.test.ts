import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { ObstacleEditor } from '../../client/src/obstacle-editor.ts';
import { parseRoom } from './scene-schema.js';

const room=()=>parseRoom({id:'edit',name:'Room',floor:[{x:-4,z:-4},{x:4,z:-4},{x:4,z:4},{x:-4,z:4}],height:2.5,obstacles:[{name:'Table',x:0,z:0,width:1,depth:1,height:1}],openings:[]});
const hand=(side:string,x:number,y:number,z:number,pressed=true)=>({side,position:new Vector3(x,y,z),pressed});
test('obstacle: one hand moves a floor-anchored draft, commits only on release',()=>{
  const source=room(),commits:unknown[]=[];const editor=new ObstacleEditor((i,o)=>commits.push([i,o]));
  editor.update(source,[hand('left',0,.5,0)]);editor.update(source,[hand('left',1,1.5,.5)]);
  assert.equal(source.obstacles[0].x,0);assert.equal(commits.length,0);assert.equal(editor.group.children[0].position.y,.5);
  editor.update(source,[hand('left',1,1.5,.5,false)]);
  assert.deepEqual(commits,[[0,{name:'Table',x:1,z:.5,width:1,depth:1,height:1}]]);assert.equal(editor.holding,false);editor.dispose();
});
test('obstacle: two hands resize three axes and do not jump when one releases',()=>{
  const source=room();let saved=source.obstacles[0];const editor=new ObstacleEditor((_,o)=>saved=o);
  editor.update(source,[hand('left',-.4,.2,-.4),hand('right',.4,.8,.4)]);
  editor.update(source,[hand('left',-.6,.1,-.7),hand('right',.6,1.1,.7)]);
  assert.ok(Math.abs(editor.group.children[0].scale.x-1.4)<1e-8);
  assert.ok(Math.abs(editor.group.children[0].scale.y-1.4)<1e-8);
  assert.ok(Math.abs(editor.group.children[0].scale.z-1.6)<1e-8);
  editor.update(source,[hand('left',-.6,.1,-.7,false),hand('right',.6,1.1,.7)]);
  editor.update(source,[hand('left',-.6,.1,-.7,false),hand('right',.6,1.1,.7,false)]);
  assert.ok(Math.abs(saved.width-1.4)<1e-8);editor.dispose();
});
test('obstacle: rejects invalid positions, cancels on lost tracking or disabled editor',()=>{
  const source=room();let commits=0;const editor=new ObstacleEditor(()=>commits++);
  editor.update(source,[hand('left',0,.5,0)]);editor.update(source,[hand('left',20,.5,0)]);
  assert.equal(editor.group.children[0].position.x,0);
  editor.update(source,[]);assert.equal(commits,0);assert.equal(editor.holding,false);
  editor.update(source,[hand('left',0,.5,0)]);editor.update(undefined,[]);assert.equal(commits,0);editor.dispose();
});
