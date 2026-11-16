import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync,mkdirSync,writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,dirname,resolve } from 'node:path';
import { RoomStore } from './room-store.js';
import { parseRoom,area } from './scene-schema.js';

const model=(id='salon')=>({id,name:id,floor:[{x:0,z:0},{x:4,z:0},{x:4,z:3},{x:0,z:3}],height:2.5,obstacles:[{name:'Table',x:2,z:1.5,width:1,depth:1,height:0.8}]});
function temporary(run:(directory:string)=>void){
  const directory=mkdtempSync(join(tmpdir(),'myroom-store-'));
  try{run(directory);}finally{
    if(resolve(dirname(directory))!==resolve(tmpdir()))throw new Error('Chemin temporaire inattendu');
    rmSync(directory,{recursive:true,force:true});
  }
}
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
