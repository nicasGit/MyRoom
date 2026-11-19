import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync,rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { adminAccess } from './admin-access.js';
import { suggestPuzzleLayout,type RoomModel } from './scene-schema.js';
test('admin debug requires explicit opt-in and an empty token; short tokens do not open access',()=>{
  assert.deepEqual(adminAccess('',false),{debug:false,configured:false,roomSaveWithoutToken:true});
  assert.deepEqual(adminAccess('',true),{debug:true,configured:false,roomSaveWithoutToken:true});
  assert.equal(adminAccess('short',true).debug,false);assert.equal(adminAccess('long-test-only-token',true).debug,false);
});
test('admin HTTP: debug access keeps origin and data validation; configured tokens remain required',{timeout:20000},async()=>{
  for(const [debug,token,expected] of [['true','',200],['false','',503],['true','test-only-debug-token',401]] as const){
    const directory=mkdtempSync(join(tmpdir(),'myroom-debug-'));
    const child=spawn(process.execPath,['--import','tsx','src/index.ts'],{env:{...process.env,PORT:'13031',DATA_DIR:directory,PUBLIC_ORIGIN:'https://myroom.test',DEBUG_WITHOUT_ADMIN_TOKEN:debug,ADMIN_TOKEN:token},stdio:['ignore','pipe','pipe']});
    try{
      await Promise.race([once(child.stdout!,'data'),once(child,'exit').then(()=>{throw Error('Startup failed');})]);
      const base='http://localhost:13031/api/admin/';const auth=await(await fetch(base+'auth')).json();assert.equal(auth.debug,expected===200);assert.ok(!JSON.stringify(auth).includes('test-only'));
      assert.equal((await fetch(base+'state')).status,expected);
      if(!token){
        const headers={'Content-Type':'application/json',Origin:'https://myroom.test'};
        const room={id:'tokenless-room',name:'Room',floor:[{x:0,z:0},{x:4,z:0},{x:4,z:4},{x:0,z:4}],height:2.5,obstacles:[],openings:[]};
        const save=await fetch(base+'rooms/save',{method:'POST',headers,body:JSON.stringify({revision:0,room})});
        assert.equal(save.status,200);assert.equal((await save.json()).library.rooms[0].id,room.id);
        const rename=await fetch(base+'rooms/rename',{method:'POST',headers,body:JSON.stringify({id:room.id,name:'Renamed',revision:1})});
        assert.equal(rename.status,expected===200?200:503);
        if(rename.ok)assert.equal((await rename.json()).library.rooms[0].name,'Renamed');
        assert.equal((await fetch(base+'rooms/save',{method:'POST',headers,body:'{}'})).status,400);
        assert.equal((await fetch(base+'rooms/save',{method:'POST',headers:{...headers,Origin:'https://elsewhere.test'},body:'{}'})).status,403);
        if(expected===503)assert.equal((await fetch(base+'reset',{method:'POST',headers,body:'{}'})).status,503);
      }
      if(expected===200){
        const headers={'Content-Type':'application/json',Origin:'https://myroom.test'};
        assert.equal((await fetch(base+'reset',{method:'POST',headers,body:'{}'})).status,200);
        assert.equal((await fetch(base+'reset',{method:'POST',headers:{...headers,Origin:'https://elsewhere.test'},body:'{}'})).status,403);
        assert.equal((await fetch(base+'display-modes',{method:'POST',headers,body:'{"extra":true}'})).status,400);
        const post=(path:string,body:unknown)=>fetch(base+path,{method:'POST',headers,body:JSON.stringify(body)});
        const missing=await post('adventure/start',{});assert.equal(missing.status,400);assert.match((await missing.json()).error,/confirmer/);
        const prepared=await(await fetch(base+'state')).json();assert.ok(prepared.library.rooms[0].puzzles);assert.equal(prepared.portal.active,false);
        const room:RoomModel={id:'ritual',name:'Ritual',floor:[{x:0,z:0},{x:8,z:0},{x:8,z:8},{x:0,z:8}],height:2.5,obstacles:[],openings:[]};room.puzzles=suggestPuzzleLayout(room,()=>.4);
        const saved=await post('rooms/save',{revision:prepared.library.revision,room});assert.equal(saved.status,200);const savedLibrary=(await saved.json()).library;
        const unconfirmed=await post('adventure/start',{});assert.equal(unconfirmed.status,400);assert.match((await unconfirmed.json()).error,/confirmer/);
        let state=await(await fetch(base+'state')).json();assert.equal(state.library.revision,savedLibrary.revision);assert.deepEqual(state.library.rooms.find((r:RoomModel)=>r.id===room.id),room);
        assert.equal((await post('portal',{action:'configure',revision:state.portal.revision,config:{...state.portal.config,playerCount:1}})).status,200);
        state=await(await fetch(base+'state')).json();assert.equal(state.portal.config.playerCount,1);
        assert.equal((await post('portal',{action:'auto-place',revision:state.portal.revision})).status,200);
        state=await(await fetch(base+'state')).json();assert.equal(state.portal.config.confirmed,false);
        assert.equal((await post('portal',{action:'configure',revision:state.portal.revision,config:{...state.portal.config,confirmed:true}})).status,200);
        assert.equal((await post('adventure/start',{})).status,200);assert.equal((await(await fetch(base+'state')).json()).portal.active,true);
        const malformed=await fetch(base+'adventure/start',{method:'POST',headers,body:'{'});assert.equal(malformed.status,400);assert.match((await malformed.json()).error,/JSON/);
        assert.equal((await post('adventure/stop',{})).status,200);state=await(await fetch(base+'state')).json();
        const raw={...room,id:'raw-scan',puzzles:undefined};
        assert.equal((await post('rooms/save',{revision:state.library.revision,room:raw})).status,200);state=await(await fetch(base+'state')).json();
        assert.equal((await post('portal',{action:'configure',revision:state.portal.revision,config:{...state.portal.config,confirmed:true}})).status,200);
        const rawRevision=state.library.revision;
        assert.equal((await post('adventure/start',{})).status,200);state=await(await fetch(base+'state')).json();
        assert.equal(state.portal.active,true);assert.equal(state.portal.config.confirmed,true);assert.equal(state.library.revision,rawRevision+1);assert.ok(state.library.rooms.find((r:RoomModel)=>r.id==='raw-scan').puzzles);
        const beforeRename=state;
        assert.equal((await post('rooms/rename',{id:'raw-scan',name:'Mon salon',revision:state.library.revision})).status,200);
        state=await(await fetch(base+'state')).json();assert.equal(state.portal.sessionId,beforeRename.portal.sessionId);assert.equal(state.portal.active,true);assert.deepEqual(state.adventure,beforeRename.adventure);
        assert.equal((await post('rooms/rename',{id:'raw-scan',name:'Stale',revision:beforeRename.library.revision})).status,400);
        assert.equal((await post('adventure/reset',{})).status,200);state=await(await fetch(base+'state')).json();assert.equal(state.portal.active,false);assert.equal(state.adventure.running,false);assert.equal(state.library.rooms.find((r:RoomModel)=>r.id==='raw-scan').name,'Mon salon');
      }
    }finally{child.kill();await once(child,'exit');rmSync(directory,{recursive:true,force:true});}
  }
});
