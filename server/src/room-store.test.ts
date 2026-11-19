import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,mkdirSync,writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,dirname,resolve } from 'node:path';
import { RoomStore } from './room-store.js';
import { parseRoom,area,wallPanels,type Opening } from './scene-schema.js';

const door:Opening={name:'Entrée',kind:'door',wall:0,offset:0.5,width:0.9,height:2.1,sill:0};
const window:Opening={name:'Fenêtre',kind:'window',wall:0,offset:2,width:1.2,height:1.2,sill:0.9};

test('ouvertures : dimensions, murs, chevauchements et ancien format',()=>{
  assert.deepEqual(parseRoom(model()).openings,[]);
  assert.equal(parseRoom({...model(),openings:[door,window]}).openings.length,2);
  for(const invalid of [{...door,wall:-1},{...door,wall:4},{...door,wall:0.5},{...door,width:NaN},{...door,offset:3.5},{...door,sill:0.1},{...window,height:2},{...window,kind:'other'}])assert.throws(()=>parseRoom({...model(),openings:[invalid]}));
  assert.throws(()=>parseRoom({...model(),openings:[door,{...window,offset:1}]}));
  assert.throws(()=>parseRoom({...model(),openings:null}));
  assert.throws(()=>parseRoom({...model(),openings:Array(33).fill(door)}));
  assert.equal(parseRoom({...model(),openings:[{...door,wall:3}]}).openings[0].wall,3);
  assert.equal(parseRoom({...model(),openings:[{...window,sill:0,height:0.8},{...window,sill:0.8,height:0.8}]}).openings.length,2);
});

test('les découpes retirent la surface des portes et fenêtres sans remplir leurs trous',()=>{
  for(const holes of [[],[door,window],[{...window,sill:0,height:0.8},{...window,sill:0.8,height:0.8}],[{...door,offset:0,width:4,height:2.5}]]){
    const panels=wallPanels(4,2.5,holes);
    const expected=10-holes.reduce((sum,o)=>sum+o.width*o.height,0);
    assert.ok(Math.abs(panels.reduce((sum,p)=>sum+p.width*p.height,0)-expected)<1e-8);
    for(const o of holes)for(const p of panels){
      assert.ok(Math.min(p.offset+p.width,o.offset+o.width)-Math.max(p.offset,o.offset)<=1e-8||Math.min(p.bottom+p.height,o.sill+o.height)-Math.max(p.bottom,o.sill)<=1e-8);
    }
  }
  const panels=wallPanels(4,2.5,[window]);
  assert.ok(panels.some(p=>p.offset===2&&p.bottom===0&&p.height===0.9));
});

test('portes et fenêtres sont conservées après redémarrage du serveur',()=>temporary(directory=>{
  const store=new RoomStore(directory);store.change('save',0,{...model(),openings:[door,window]});
  assert.deepEqual(new RoomStore(directory).active()?.openings,[door,window]);
}));

const model=(id='salon')=>({id,name:id,floor:[{x:0,z:0},{x:4,z:0},{x:4,z:3},{x:0,z:3}],height:2.5,obstacles:[{name:'Table',x:2,z:1.5,width:1,depth:1,height:0.8}]});
function temporary(run:(directory:string)=>void){
  const directory=mkdtempSync(join(tmpdir(),'myroom-store-'));
  try{run(directory);}finally{
    if(resolve(dirname(directory))!==resolve(tmpdir()))throw new Error('Chemin temporaire inattendu');
    rmSync(directory,{recursive:true,force:true});
  }
}

test('room rename preserves geometry, identity and active selection, validates revision and persists',()=>temporary(directory=>{
  const store=new RoomStore(directory);store.change('save',0,model('salon'));store.change('save',1,model('bureau'));
  const before=store.snapshot().rooms[0];
  const renamed=store.change('rename',2,{id:'salon',name:'Grand salon'});
  assert.equal(renamed.activeId,'bureau');assert.deepEqual(renamed.rooms[0],{...before,name:'Grand salon'});
  for(const input of [{id:'salon',name:''},{id:'salon',name:'x'.repeat(65)},{id:'absent',name:'Name'},{id:'salon',name:'New',extra:true}])assert.throws(()=>store.change('rename',3,input));
  assert.throws(()=>store.change('rename',2,{id:'salon',name:'Old'}));
  assert.equal(new RoomStore(directory).snapshot().rooms[0].name,'Grand salon');
}));
test('modèle 3D : contour, murs et obstacles sont validés',()=>{
  assert.equal(area(parseRoom(model()).floor),12);
  for(const invalid of [
    {...model(),floor:[{x:0,z:0},{x:4,z:3},{x:4,z:0},{x:0,z:3}]},
    {...model(),height:NaN},
    {...model(),obstacles:[{...model().obstacles[0],height:3}]},
    {...model(),obstacles:[{...model().obstacles[0],x:4}]},
    {...model(),floor:[{x:0,z:0},{x:2,z:0},{x:4,z:0},{x:4,z:3},{x:0,z:3}]},
  ])assert.throws(()=>parseRoom(invalid));
});
test('une bibliothèque de plusieurs pièces et sa pièce active survivent au redémarrage',()=>temporary(directory=>{
  const store=new RoomStore(directory);
  store.change('save',0,model('salon'));store.change('save',1,model('bureau'));
  store.change('activate',2,'salon');
  const restarted=new RoomStore(directory);
  assert.equal(restarted.snapshot().rooms.length,2);assert.equal(restarted.active()?.id,'salon');
  assert.equal(restarted.snapshot().revision,3);
  restarted.change('delete',3,'salon');
  const next=new RoomStore(directory);
  assert.equal(next.active(),null);assert.equal(next.snapshot().rooms[0].id,'bureau');
}));
test('une modification périmée, invalide ou non écrite ne change pas la bibliothèque',()=>temporary(directory=>{
  const store=new RoomStore(directory);store.change('save',0,model());
  assert.throws(()=>store.change('save',0,model('bureau')));
  assert.throws(()=>store.change('save',1,{...model(),floor:[]}));
  const snapshot=store.snapshot();snapshot.rooms[0].name='muté';assert.equal(store.active()?.name,'salon');
  mkdirSync(join(directory,'rooms.json.tmp'));
  assert.throws(()=>store.change('save',1,model('bureau')));
  assert.equal(store.snapshot().revision,1);assert.equal(new RoomStore(directory).snapshot().rooms.length,1);
}));
test('un fichier corrompu est refusé sans être remplacé',()=>temporary(directory=>{
  writeFileSync(join(directory,'rooms.json'),'invalide');assert.throws(()=>new RoomStore(directory));
}));
test('la bibliothèque limite le nombre de pièces sans bloquer la mise à jour d’une fiche existante',()=>temporary(directory=>{
  const store=new RoomStore(directory);
  for(let i=0;i<20;i++)store.change('save',i,model(`room-${i}`));
  assert.throws(()=>store.change('save',20,model('room-21')));
  store.change('save',20,{...model('room-0'),name:'Pièce modifiée'});
  assert.equal(store.snapshot().rooms.length,20);assert.equal(store.active()?.name,'Pièce modifiée');
}));
