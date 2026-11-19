import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4,Vector3 } from 'three';
import { capturePlanes,captureMeshes,importSurfaces,QuestButtons,type Surface } from '../../client/src/quest-scan.ts';
import { makeCalibration } from '../../client/src/calibration.ts';
import { area } from './scene-schema.js';

const calibration=makeCalibration(new Vector3(),new Vector3(1,0,0));
const floor:Surface={label:'floor',orientation:'horizontal',points:[{x:-1,y:0,z:-1},{x:4,y:0,z:-1},{x:4,y:0,z:3},{x:-1,y:0,z:3}]};
const table:Surface={label:'table',orientation:'horizontal',points:[{x:1,y:0.8,z:1},{x:2,y:0.8,z:1},{x:2,y:0.8,z:2},{x:1,y:0.8,z:2}]};

test('mesh furniture capture is bounded, transformed, deduplicated and tracking-dependent',()=>{
  const mesh={semanticLabel:'TABLE',meshSpace:{},vertices:new Float32Array([0,0,0,1,.8,0,1,.8,1,0,0,1])};
  const frame={detectedMeshes:new Set([mesh,{...mesh,semanticLabel:'wall'}]),getPose:()=>({transform:{matrix:new Matrix4().makeTranslation(1,0,1).elements}})};
  const captured=captureMeshes(frame as unknown as XRFrame,{} as XRReferenceSpace);
  assert.equal(captured.length,1);assert.equal(captured[0].points.length,8);
  const result=importSurfaces([...captured,floor,table],calibration,'mesh');
  assert.equal(result.room.obstacles.length,1);assert.equal(result.room.obstacles[0].width,1);
  assert.deepEqual(captureMeshes({...frame,getPose:()=>null} as unknown as XRFrame,{} as XRReferenceSpace),[]);
  assert.deepEqual(captureMeshes({detectedMeshes:new Set([{...mesh,vertices:new Float32Array([NaN,0,0,1,1,1,2,2,2])}]),getPose:frame.getPose} as unknown as XRFrame,{} as XRReferenceSpace),[]);
});

test('commandes Quest : nouveaux appuis seulement et enregistrement réservé au bouton droit',()=>{
  const input={handedness:'right',gamepad:{mapping:'xr-standard',buttons:Array.from({length:6},()=>({pressed:false}))}};
  const source=input as unknown as XRInputSource,buttons=new QuestButtons();
  input.gamepad.buttons[5].pressed=true;assert.deepEqual(buttons.poll([source]),[]);
  input.gamepad.buttons[5].pressed=false;buttons.poll([source]);
  input.gamepad.buttons[5].pressed=true;assert.deepEqual(buttons.poll([source]),['save']);assert.deepEqual(buttons.poll([source]),[]);
  input.gamepad.buttons[5].pressed=false;buttons.poll([source]);input.handedness='left';input.gamepad.buttons[5].pressed=true;assert.deepEqual(buttons.poll([source]),['cancel']);
  input.gamepad.buttons[4].pressed=true;assert.deepEqual(buttons.poll([source]),['import']);
  input.gamepad.mapping='';assert.deepEqual(buttons.poll([source]),[]);
});

test('import Quest : sol, plafond et table deviennent un modèle validé',()=>{
  const ceiling={...floor,label:'ceiling',points:floor.points.map(p=>({...p,y:2.7}))};
  const result=importSurfaces([floor,ceiling,table],calibration,'scan');
  assert.equal(result.room.height,2.7);assert.equal(area(result.room.floor),20);
  assert.equal(result.room.obstacles[0].height,0.8);assert.equal(result.room.obstacles[0].width,1);
  assert.deepEqual(result.room.openings,[]);assert.ok(result.warnings.length>0);
});

test('import Quest : applique le repère A/B et conserve les décrochements concaves',()=>{
  const points=[[-1,-1],[3,-1],[3,1],[1.5,1],[1.5,3],[-1,3],[-1,-1]].map(([x,z])=>({x,y:0,z}));
  const rotated=points.map(p=>new Vector3(p.x,p.y,p.z).applyAxisAngle(new Vector3(0,1,0),-Math.PI/2).add(new Vector3(10,0,5)));
  const ref=makeCalibration(new Vector3(10,0,5),new Vector3(10,0,6));
  const result=importSurfaces([{...floor,points:rotated}],ref,'scan');
  assert.equal(result.room.floor.length,6);assert.ok(Math.abs(area(result.room.floor)-13)<1e-8);
  assert.ok(Math.abs(result.room.floor[0].x+1)<1e-8);assert.ok(Math.abs(result.room.floor[0].z+1)<1e-8);
});

test('import Quest : refuse les données absentes, non finies, croisées ou étrangères à A/B',()=>{
  for(const surfaces of [[],[table],[{...floor,points:floor.points.map(p=>({...p,y:1}))}],[{...floor,points:floor.points.map(p=>({...p,x:p.x+20}))}],[{...floor,points:[floor.points[0],floor.points[2],floor.points[1],floor.points[3]]}],[{...floor,points:floor.points.map(p=>({...p,x:NaN}))}]])assert.throws(()=>importSurfaces(surfaces,calibration,'scan'));
});

test('import Quest : hauteur de secours explicite et meubles hors contour ignorés',()=>{
  const result=importSurfaces([floor,{...table,points:table.points.map(p=>({...p,x:p.x+10}))}],calibration,'scan');
  assert.equal(result.room.height,2.5);assert.equal(result.room.obstacles.length,0);
  assert.ok(result.warnings.some(w=>w.includes('2,5')));assert.ok(result.warnings.some(w=>w.includes('ignorée')));
});

test('capture Quest : pose du plan appliquée et aucune surface conservée après perte de suivi',()=>{
  const plane={polygon:[{x:0,y:0,z:0},{x:1,y:0,z:0},{x:1,y:0,z:1}],planeSpace:{},orientation:'horizontal',semanticLabel:'FLOOR'};
  const matrix=new Matrix4().makeTranslation(2,0,3).elements;
  const frame={detectedPlanes:new Set([plane]),getPose:()=>({transform:{matrix}})};
  const captured=capturePlanes(frame as unknown as XRFrame,{} as XRReferenceSpace);
  assert.deepEqual(captured[0].points[0],{x:2,y:0,z:3});assert.equal(captured[0].label,'floor');
  assert.deepEqual(capturePlanes({...frame,getPose:()=>null} as unknown as XRFrame,{} as XRReferenceSpace),[]);
  assert.deepEqual(capturePlanes({} as XRFrame,{} as XRReferenceSpace),[]);
});
