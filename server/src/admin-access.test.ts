import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync,rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { adminAccess } from './admin-access.js';
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
        assert.equal((await fetch(base+'rooms/save',{method:'POST',headers,body:'{}'})).status,400);
        assert.equal((await fetch(base+'rooms/save',{method:'POST',headers:{...headers,Origin:'https://elsewhere.test'},body:'{}'})).status,403);
        if(expected===503)assert.equal((await fetch(base+'reset',{method:'POST',headers,body:'{}'})).status,503);
      }
      if(expected===200){
        const headers={'Content-Type':'application/json',Origin:'https://myroom.test'};
        assert.equal((await fetch(base+'reset',{method:'POST',headers,body:'{}'})).status,200);
        assert.equal((await fetch(base+'reset',{method:'POST',headers:{...headers,Origin:'https://elsewhere.test'},body:'{}'})).status,403);
        assert.equal((await fetch(base+'display-modes',{method:'POST',headers,body:'{"extra":true}'})).status,400);
      }
    }finally{child.kill();await once(child,'exit');rmSync(directory,{recursive:true,force:true});}
  }
});
