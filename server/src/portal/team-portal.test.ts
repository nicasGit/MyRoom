import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { TeamPortal } from './team-portal.js';
import { staffLayout } from './staff-layout.js';
import { CrossingDetector } from './crossing-detector.js';
import { DEFAULT_PORTAL,parsePortalCommand,parsePortalConfig,validatePlacement,STAFF_IDS } from './portal-types.js';
import { SeatSessions } from './seat-sessions.js';
import { PortalPlacementStore } from './placement-store.js';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';import { join } from 'node:path';
import { Room } from '../room.js';
import { createRegistry,createCatalog } from '../adventures/catalog.js';
import { suggestPuzzleLayout,type RoomModel } from '../scene-schema.js';
import { suggestPortalPlacement,configurePortalPlacement } from './portal-placement.js';
import { PortalWaiting } from '../../../client/src/portal/portal-waiting.js';
import { vortexView } from '../../../client/src/portal/vortex-view.js';
import { waitingTunnel } from '../../../client/src/portal/waiting-corridor.js';
import { crossesEntry,entryWindow } from '../../../client/src/portal/entry-window.js';
import * as THREE from 'three';
import { hasStaffAccess } from '../../../client/src/portal/portal-access.js';
import { roomCenter } from './portal-placement.js';
const model:RoomModel={id:'portal',name:'Portal',floor:[{x:0,z:0},{x:8,z:0},{x:8,z:8},{x:0,z:8}],height:2.5,obstacles:[],openings:[]};model.puzzles=suggestPuzzleLayout(model,()=>0.4);
const config={...structuredClone(DEFAULT_PORTAL),confirmed:true};

test('renaming the room keeps adventure, portal session, calibration identity and object state',()=>{
  const room=new Room();room.model=structuredClone(model);room.snapshot();room.portal.configure(config);room.startSession(true);
  const before=room.snapshot();room.model={...room.model!,name:'Renamed room'};const after=room.snapshot();
  assert.equal(after.model?.id,before.model?.id);assert.deepEqual(after.model?.puzzles,before.model?.puzzles);
  assert.deepEqual(after.adventure,before.adventure);assert.equal(after.portal.sessionId,before.portal.sessionId);assert.equal(after.portal.revision,before.portal.revision);assert.equal(after.portal.active,true);
});

test('vortex center: geometric centroid, nearby free fallback and explicit reconfirmation',()=>{
  const triangle={...model,floor:[{x:0,z:0},{x:12,z:0},{x:0,z:12}]};
  assert.deepEqual(roomCenter(triangle),{x:4,z:4});
  const centered=suggestPortalPlacement(triangle,config);assert.equal(centered.portal.x,4);assert.equal(centered.portal.z,4);assert.equal(centered.confirmed,false);validatePlacement(centered,triangle);
  const blocked={...model,obstacles:[{name:'Table',x:4,z:4,width:1,depth:1,height:1}]};
  const free=suggestPortalPlacement(blocked,config);assert.ok(Math.hypot(free.portal.x-4,free.portal.z-4)>0);validatePlacement(free,blocked);
  assert.equal(config.confirmed,true);assert.equal(config.portal.z,3);
});

test('portal preparation: count changes do not require a valid old corridor; confirmation still does',()=>{
  const old=structuredClone(DEFAULT_PORTAL),shifted={...model,floor:model.floor.map(p=>({x:p.x+10,z:p.z+10}))};
  const next=configurePortalPlacement(old,{...old,playerCount:1},shifted);
  assert.equal(next.playerCount,1);assert.equal(next.confirmed,false);
  assert.throws(()=>configurePortalPlacement(next,{...next,confirmed:true},shifted));
  const placed=suggestPortalPlacement(shifted,next);validatePlacement(placed,shifted);
  assert.equal(placed.confirmed,false);assert.equal(placed.playerCount,1);assert.ok(placed.portal.x>=10);
  assert.equal(configurePortalPlacement(placed,{...placed,confirmed:true},shifted).confirmed,true);
  assert.deepEqual(old,DEFAULT_PORTAL);
});

test('portal preparation: no usable space is rejected without moving or confirming saved configuration',()=>{
  const blocked={...model,obstacles:[{name:'Full',x:4,z:4,width:8,depth:8,height:1}]};
  assert.throws(()=>suggestPortalPlacement(blocked,config),/couloir/);
  assert.equal(config.confirmed,true);
});
test('wall lobby: public catalog metadata and names refresh without private configuration',()=>{
  const room=new Room(),first=room.snapshot();assert.ok(first.lobby.adventures.length>0);
  assert.deepEqual(Object.keys(first.lobby.adventures[0]).sort(),['id','title','version']);
  room.setPlayerNames(['Leon','Reno','Fabien','Nicolas'],room.playerNamesRevision);
  const next=room.snapshot();assert.equal(next.lobby.names[0],'Leon');assert.equal(next.lobby.namesRevision,first.lobby.namesRevision+1);
});
test('portal: one to four selected players, strict count and legacy defaults',()=>{
  assert.equal(parsePortalConfig(config).playerCount??4,4);
  for(const invalid of [0,5,1.5,'2',null])assert.throws(()=>parsePortalConfig({...config,playerCount:invalid}));
  for(let count=1;count<=4;count++){
    const p=new TeamPortal();p.configure({...config,playerCount:count});p.begin('count',['A','B','C','D'],model,1000,true);
    p.presence([],1100);p.tick(1100,()=>{});assert.equal(p.snapshot().players.length,count);
    assert.equal(Object.keys(p.staffPoses()).length,count);
    p.simulate(1,false);p.tick(1200,()=>{});p.tick(6200,()=>{});let starts=0;
    for(let slot=1;slot<=count;slot++)p.simulate(slot,true);
    p.tick(6300,()=>starts++);p.tick(8300,()=>starts++);p.tick(9000,()=>starts++);
    assert.equal(starts,1);assert.equal(p.snapshot().phase,'completed');
  }
  const room=new Room();room.snapshot();room.portal.configure({...config,playerCount:1});
  assert.equal(room.join('first'),true);assert.equal(room.join('extra'),false);assert.equal(room.join('extra',2),false);
});
test('floating staffs: deterministic shared layout avoids obstacles and vortex corridor',()=>{
  const room={...model,obstacles:[{name:'Table',x:6,z:6,width:1,depth:1,height:1}]};
  const layout=staffLayout(config,room),positions=Object.values(layout);
  assert.equal(positions.length,4);assert.deepEqual(staffLayout(config,room),layout);
  for(const [i,p] of positions.entries()){
    assert.ok(p.x>=.3&&p.x<=7.7&&p.z>=.3&&p.z<=7.7);
    assert.ok(Math.abs(p.x-6)>=.85||Math.abs(p.z-6)>=.85);
    assert.ok(Math.abs(p.x-4)>=1.2||p.z-3<=-1.4||p.z-3>=1.4);
    assert.ok(p.y>=.5&&p.y+.6<room.height);
    for(const other of positions.slice(i+1))assert.ok(Math.hypot(p.x-other.x,p.z-other.z)>=1);
  }
  const portal=new TeamPortal();portal.configure(config);portal.begin('layout',[],room,1000);
  const publicPositions=portal.snapshot().staffPositions;
  assert.deepEqual(publicPositions,layout);
  for(const id of STAFF_IDS){const pose=portal.staffPoses()[id];assert.ok(pose);assert.deepEqual({x:pose.x,y:pose.y,z:pose.z},layout[id]);}
});
test('floating staffs: insufficient space refuses start without activating the ritual',()=>{
  const room={...model,height:1};assert.deepEqual(staffLayout(config,room),{});
  const portal=new TeamPortal();portal.configure(config);
  assert.throws(()=>portal.begin('crowded',[],room,1000));assert.equal(portal.active,false);
});
test('accueil global : visible par défaut, placement et rituel indépendants du choix d’aventure',()=>{
  const room=new Room();room.model=structuredClone(model);const initial=room.snapshot();
  assert.equal(initial.portal.config.enabled,true);assert.equal(initial.portal.phase,'waiting');assert.equal(initial.portal.players.length,4);assert.equal(initial.adventure.running,false);
  const key=room.placementKey();room.portal.configure(config);const before=room.portal.snapshot();
  room.adventure.select('menthe27','0.2.0',room.adventure.snapshot().revision);room.snapshot();
  assert.equal(room.placementKey(),key);assert.deepEqual(room.portal.snapshot().config,before.config);
  room.startSession(true);room.maintain();assert.equal(room.portal.active,true);assert.equal(room.adventure.snapshot().running,false);
  room.portal.skip();room.maintain(Date.now()+3000);assert.equal(room.adventure.snapshot().running,true);assert.equal(room.portal.snapshot().phase,'completed');
});
function fixture(){const portal=new TeamPortal();portal.configure(config);portal.begin('session',['Un','Deux','Trois','Quatre'],model,1000);portal.presence([1,2,3,4],1000);return portal;}
function pose(portal:TeamPortal,slot:number,seq:number,at:number,d=0.6){const s=portal.snapshot();portal.act({type:'portal_action',sessionId:s.sessionId,revision:s.revision,commandId:randomUUID(),seq,action:'pose',position:{x:4,y:1.6,z:3+d}},slot,model,at);}
function open(){const portal=fixture();for(let i=1;i<=4;i++)pose(portal,i,1,1100);portal.tick(1100,()=>{});for(let i=1;i<=4;i++)portal.claim(i,STAFF_IDS[i-1]);portal.tick(1200,()=>{});portal.tick(6200,()=>{});return portal;}

test('personal vortex: another player opening does not unlock your view or passage; own claim survives reconnect',()=>{
  const p=fixture();for(let i=1;i<=4;i++)pose(p,i,1,1100);p.tick(1100,()=>{});p.claim(1,'staff1');p.tick(1200,()=>{});p.tick(6200,()=>{});
  assert.equal(hasStaffAccess(p.snapshot(),1),true);assert.equal(hasStaffAccess(p.snapshot(),2),false);assert.equal(hasStaffAccess(p.snapshot(),0),false);
  for(const [index,d] of [.6,.2,-.1,-.4].entries())pose(p,2,index+2,6500+index*300,d);
  let s=p.snapshot();assert.equal(s.players[1].crossed,false);
  assert.throws(()=>p.act({type:'portal_action',sessionId:s.sessionId,revision:s.revision,commandId:randomUUID(),seq:6,action:'confirm'},2,model,7500),/bâton/);
  const waiting=new PortalWaiting();assert.equal(waiting.update(s,2,{x:4,y:1.6,z:2.9},8000),false);
  p.claim(2,'staff2');assert.equal(hasStaffAccess(p.snapshot(),2),true);
  p.presence([1,3,4],8100);p.presence([1,2,3,4],8200);assert.equal(hasStaffAccess(p.snapshot(),2),true);
  s=p.snapshot();assert.equal(s.players[1].claimed,true);
  p.cancel();assert.equal(hasStaffAccess(p.snapshot(),2),false);
  p.begin('new',['A','B','C','D'],model,9000);assert.equal(hasStaffAccess(p.snapshot(),2),false);
});

test('ghost positions: only fresh validated XR poses, copies, expiry, loss, camera/virtual exclusion and cancellation',()=>{
  const p=fixture();
  for(let slot=1;slot<=3;slot++){
    const s=p.snapshot();p.act({type:'portal_action',sessionId:s.sessionId,revision:s.revision,commandId:randomUUID(),seq:1,action:'pose',position:{x:slot+1,y:1.6,z:3}},slot,model,1100,slot===1?'quest-webxr':slot===2?'camera-ar':'virtual-3d');
  }
  let ghosts=p.snapshot(1200).ghosts!;assert.equal(ghosts.length,1);assert.equal(ghosts[0].slot,1);assert.equal(ghosts[0].ageMs,100);
  ghosts[0].head.x=25;assert.equal(p.snapshot(1200).ghosts![0].head.x,2);
  assert.deepEqual(p.snapshot(2100).ghosts,[]);
  p.clearTracking(1);assert.deepEqual(p.snapshot(1200).ghosts,[]);
  pose(p,1,2,1400);assert.equal(p.snapshot(1500).ghosts!.length,1);
  p.presence([2,3,4],1500);assert.deepEqual(p.snapshot(1500).ghosts,[]);
  p.cancel();assert.deepEqual(p.snapshot(1500).ghosts,[]);
});

test('head passage: physical XR validates at four centimetres; other players and adventure still wait',()=>{
  const p=open();
  for(const [index,d] of [.5,.15,-.02,-.05].entries()){
    for(let slot=1;slot<=2;slot++){
      const s=p.snapshot();p.act({type:'portal_action',sessionId:s.sessionId,revision:s.revision,commandId:randomUUID(),seq:index+2,action:'pose',position:{x:4,y:1.6,z:3+d}},slot,model,6500+index*300,slot===1?'quest-webxr':'virtual-3d');
    }
    if(index===2)assert.equal(p.snapshot().players[0].crossed,false);
  }
  const s=p.snapshot();assert.equal(s.players[0].validationMethod,'physical-xr');
  assert.equal(s.players.slice(1).some(p=>p.crossed),false);
  let starts=0;p.tick(7500,()=>starts++);assert.equal(starts,0);assert.equal(p.snapshot().phase,'portal-open');
  p.clearTracking(1);assert.equal(p.snapshot().players[0].crossed,true);
});

test('portal aperture stays planar from either side throughout animation; waiting cover is opaque',()=>{
  const vortex=vortexView(1.4,2.2);
  for(const seconds of [0,1,15,100]){
    vortex.animate(seconds);vortex.group.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(vortex.group);assert.equal(bounds.min.z,0);assert.equal(bounds.max.z,0);
  }
  const {shell}=waitingTunnel();assert.equal(shell.material.transparent,false);assert.equal(shell.material.opacity,1);
  assert.equal(shell.material.side,THREE.BackSide);assert.equal(shell.material.depthTest,false);assert.equal(shell.material.depthWrite,false);assert.ok(shell.renderOrder<0);assert.equal(shell.frustumCulled,false);
});

test('head peek triggers at the plane with no full-body approach and returns after server confirmation',()=>{
  const s=open().snapshot(),waiting=new PortalWaiting();let now=1000;
  const sample=(d:number)=>waiting.update(s,1,{x:4,y:1.6,z:3+d},now+=16);
  assert.equal(sample(.01),false);assert.equal(sample(.002),false);assert.equal(sample(-.001),true);assert.equal(sample(-.006),true);
  s.players[0].crossed=true;assert.equal(sample(.006),false);assert.equal(sample(-.001),true);
  assert.equal(s.players[0].crossed,true); // Rendering never rolls back progression.
});

test('head visual transition: local peek, acknowledgement, loss of tracking and session reset',()=>{
  const s=open().snapshot(),waiting=new PortalWaiting();let now=1000;
  const sample=(d:number,state=s,head=true)=>waiting.update(state,1,head?{x:4,y:1.6,z:3+d}:undefined,now+=300);
  assert.equal(sample(-.1),false); // Starting behind is not a crossing.
  assert.equal(sample(.5),false);assert.equal(sample(.1),false);assert.equal(sample(-.02),true);
  assert.equal(sample(.07),false); // Unacknowledged peek is reversible.
  assert.equal(sample(.4),false); // A second entry must approach again.
  assert.equal(sample(-.02),true);
  s.players[0].crossed=true;assert.equal(sample(-.1),true);
  assert.equal(sample(.01),false); // Back to MR even after acknowledgement.
  assert.equal(sample(-.01),true); // Immediate reversible re-entry.
  assert.equal(sample(-.1,s,false),true); // Brief tracking loss preserves the universe and audio.
  assert.equal(sample(-.1),true); // Recovered confirmed seat.
  assert.equal(sample(-.1,{...s,sessionId:'new',players:s.players.map(p=>({...p,crossed:false}))}),false);
  assert.equal(sample(-.1,{...s,active:false}),false);
  assert.equal(sample(-.1,{...s,phase:'completed'}),false);
});

test('head visual transition: rotated reverse portal, aperture, readiness and discontinuities',()=>{
  const s=open().snapshot(),waiting=new PortalWaiting();s.config.portal.yaw=Math.PI/2;s.config.portal.direction=-1;
  let now=1000;const sample=(d:number,z=3)=>waiting.update(s,1,{x:4-d,y:1.6,z},now+=300);
  assert.equal(sample(.5),false);assert.equal(sample(.1),false);assert.equal(sample(-.02),true);
  waiting.reset();for(const d of [.5,.1,-.02])assert.equal(sample(d,4),false);
  waiting.reset();sample(.5);now+=1500;assert.equal(sample(-.02),false);
  waiting.reset();sample(.5);assert.equal(sample(-1),false);
  waiting.reset();s.players[3].ready=false;assert.equal(sample(.1),false);assert.equal(sample(-.02),true); // Local view does not wait for other clients.
});

test('entry window: alpha punch is planar and crossing uses its ellipse, not the entire plane',()=>{
  const p=config.portal;
  assert.equal(crossesEntry({x:4,y:1.6,z:3.1},{x:4,y:1.6,z:2.9},p),true);
  assert.equal(crossesEntry({x:4.6,y:2.1,z:3.1},{x:4.6,y:2.1,z:2.9},p),false);
  assert.equal(crossesEntry({x:5,y:1.6,z:3.1},{x:5,y:1.6,z:2.9},p),false);
  const window=entryWindow();assert.equal(window.material.blending,THREE.NoBlending);assert.equal(window.material.opacity,0);assert.equal(window.material.depthWrite,false);assert.equal(window.material.depthTest,false);assert.equal(window.material.side,THREE.DoubleSide);assert.ok(window.renderOrder>1800);
});

test('waiting universe: walking around the entry stays virtual; only exiting the hole returns MR',()=>{
  const s=open().snapshot(),waiting=new PortalWaiting();let now=1000;
  const sample=(x:number,z:number,head=true)=>waiting.update(s,1,head?{x,y:1.6,z}:undefined,now+=300);
  assert.equal(sample(4,3.2),false);assert.equal(sample(4,2.8),true);
  s.players[0].crossed=true;
  for(const [x,z] of [[4.5,2.8],[5,2.8],[5,3.3],[4.5,3.3],[4,3.3]])assert.equal(sample(x,z),true);
  assert.equal(sample(4,3.3,false),true);s.players[0].ready=false;assert.equal(sample(4,3.3),true);
  assert.equal(sample(4,2.8),true);assert.equal(sample(4,3.2),false);assert.equal(s.players[0].crossed,true);
});

test('ritual restart resets claims, passages, session and leases while preserving room and puzzle progression',()=>{
  const room=new Room();room.model=structuredClone(model);room.snapshot();room.portal.configure(config);room.startSession(true);
  room.players.set('unit',1);room.maintain();room.portal.simulate(1,false);room.snapshot();
  const before=room.snapshot(),pose=before.adventure.objects.poses.staff1!;
  assert.equal(room.objects.act({type:'object_action',action:'grab',target:'staff1',revision:before.adventure.objects.revision,lease:'request',seq:1,hands:[{x:pose.x,y:pose.y+.2,z:pose.z}],pose},'unit',room.model,Date.now(),'lease').changed,true);
  room.restartRitual();const after=room.snapshot();
  assert.notEqual(after.portal.sessionId,before.portal.sessionId);assert.equal(after.portal.active,true);
  assert.ok(after.portal.players.every(p=>!p.claimed&&!p.crossed));assert.equal(after.adventure.objects.held.length,0);
  assert.deepEqual(after.adventure.objects.poses.staff1,{...after.portal.staffPositions!.staff1,yaw:0});
  assert.deepEqual(after.model,before.model);assert.deepEqual(after.adventure.engine.instances,before.adventure.engine.instances);
  room.portal.cancel();room.adventure.start();room.restartRitual();assert.equal(room.snapshot().adventure.running,false);
});

test('portal modes: camera never auto-crosses; virtual and physical crossings remain distinct',()=>{
  const p=open();
  for(const [index,d] of [.6,.2,-.1,-.4].entries())for(let slot=1;slot<=3;slot++){
    const s=p.snapshot();p.act({type:'portal_action',sessionId:s.sessionId,revision:s.revision,commandId:randomUUID(),seq:index+2,action:'pose',position:{x:4,y:1.6,z:3+d}},slot,model,6500+index*300,slot===1?'camera-ar':slot===2?'virtual-3d':'quest-webxr');
  }
  let s=p.snapshot();assert.equal(s.players[0].crossed,false);assert.equal(s.players[1].validationMethod,'virtual-crossing');assert.equal(s.players[2].validationMethod,'physical-xr');
  p.act({type:'portal_action',sessionId:s.sessionId,revision:s.revision,commandId:randomUUID(),seq:6,action:'confirm'},1,model,7600,'camera-ar');
  assert.equal(p.snapshot().players[0].validationMethod,'camera-confirmation');
  p.clearTracking(4);assert.equal(p.snapshot().players[3].ready,false);
  assert.throws(()=>p.adminCross(4));
});

test('portail : schémas stricts, placements et ancienne aventure sans introduction',()=>{
  assert.throws(()=>parsePortalConfig({...config,extra:true}));assert.throws(()=>parsePortalConfig({...config,portal:{...config.portal,width:Infinity}}));
  assert.throws(()=>parsePortalCommand({type:'portal_action',sessionId:'s',revision:0,commandId:'x',seq:1,action:'pose',position:{x:NaN,y:1,z:2}}));
  validatePlacement(config,model);assert.throws(()=>validatePlacement({...config,portal:{...config.portal,x:0}},model));assert.throws(()=>validatePlacement(config,{...model,obstacles:[{name:'Table',x:4,z:3,width:1,depth:1,height:1}]}));
  const registry=createRegistry(),catalog=createCatalog(registry);assert.equal(catalog.get('myroom-classic','1.0.0').introduction,undefined);assert.equal(catalog.get('menthe27','0.2.0').introduction,undefined);assert.equal(catalog.get('menthe27','0.3.0').introduction?.type,'team-portal');
  assert.deepEqual(catalog.get('menthe27','0.3.0').steps,catalog.get('menthe27','0.2.0').steps);
});
test('portail : bâtons nominatifs, doublons et ouverture dès une première prise',()=>{
  const p=fixture();for(let i=1;i<=3;i++)pose(p,i,1,1100);p.tick(1100,()=>{});
  assert.throws(()=>p.claim(1,'staff2'));for(let i=1;i<=3;i++)p.claim(i,STAFF_IDS[i-1]);assert.throws(()=>p.claim(1,'staff1'));
  p.tick(1200,()=>{});assert.equal(p.snapshot().phase,'opening');pose(p,4,1,1300);p.claim(4,'staff4');p.presence([1,2,3],1300);p.tick(1400,()=>{});assert.equal(p.snapshot().phase,'opening');
  p.presence([1,2,3,4],1500);pose(p,4,2,1600);p.tick(1600,()=>{});assert.equal(p.snapshot().phase,'opening');assert.equal(p.snapshot().players[3].claimed,true);
});
test('portal: first staff opens alone, adventure still waits for the team',()=>{
  const p=fixture();p.presence([1],1050);pose(p,1,1,1100);p.tick(1100,()=>{});
  assert.equal(p.snapshot().phase,'collecting');p.claim(1,'staff1');p.tick(1200,()=>{});
  assert.equal(p.snapshot().phase,'opening');let starts=0;p.tick(6200,()=>starts++);
  assert.equal(p.snapshot().phase,'portal-open');assert.equal(starts,0);
  assert.throws(()=>p.adminCross(1));p.tick(9000,()=>starts++);assert.equal(starts,0);
});
test('traversée : sens, fenêtre utile, hystérésis, sauts et lacunes de suivi',()=>{
  const c=config.portal,detector=new CrossingDetector();let at=1000;const sample=(d:number,x=4)=>detector.sample({x,y:1.6,z:3+d},at+=300,c);
  assert.equal(sample(.5),false);assert.equal(sample(.15),false);assert.equal(sample(-.1),false);assert.equal(sample(-.4),true);
  detector.reset();assert.equal(sample(-.5),false);assert.equal(sample(-.1),false);assert.equal(sample(.3),false);
  detector.reset();for(const d of [.4,.05,-.03,.04,-.02,.06])assert.equal(sample(d),false);
  detector.reset();for(const d of [.5,.1,-.1,-.4])assert.equal(sample(d,5),false);
  detector.reset();sample(.5);assert.equal(sample(-1),false);
  detector.reset();sample(.5);at+=1500;assert.equal(sample(-.4),false);
});
test('portail : une traversée immédiate utilise la pose récente précédant l’ouverture',()=>{
  const p=fixture();for(let i=1;i<=4;i++)pose(p,i,1,1100);p.tick(1100,()=>{});for(let i=1;i<=4;i++)p.claim(i,STAFF_IDS[i-1]);p.tick(1200,()=>{});
  for(let i=1;i<=4;i++)pose(p,i,2,6100);p.tick(6200,()=>{});
  pose(p,1,3,6400,.2);pose(p,1,4,6700,-.1);pose(p,1,5,7000,-.4);
  assert.equal(p.snapshot().players[0].crossed,true);
});
test('portail : commandes répétées/périmées, passage unique et lancement unique',()=>{
  const p=open();assert.equal(p.snapshot().phase,'portal-open');
  const s=p.snapshot(),c={type:'portal_action' as const,sessionId:s.sessionId,revision:s.revision,commandId:'unique',seq:2,action:'confirm' as const};p.act(c,1,model,6300);assert.throws(()=>p.act(c,1,model,6400));assert.throws(()=>p.act({...c,commandId:'stale'},2,model,6400));
  for(let slot=2;slot<=4;slot++)for(const [index,d] of [.6,.2,-.1,-.4].entries())pose(p,slot,index+2,6500+index*300,d);
  assert.equal(p.snapshot().players.every(player=>player.crossed),true);let starts=0;p.tick(7500,()=>starts++);assert.equal(p.snapshot().phase,'transitioning');p.tick(9500,()=>starts++);p.tick(10000,()=>starts++);assert.equal(starts,1);assert.equal(p.snapshot().phase,'completed');
});
test('portail : reprise privée de place, absence, commandes admin et simulation explicite',()=>{
  const seats=new SeatSessions(),first=seats.acquire('one',undefined,false);seats.disconnect('one',true);assert.throws(()=>seats.acquire('attacker','wrong',true));assert.equal(seats.acquire('other',undefined,true).slot,2);assert.equal(seats.acquire('reconnected',first.token,true).slot,1);assert.throws(()=>seats.acquire('duplicate',first.token,true));
  const p=open();p.presence([1,2,3],6300);assert.equal(p.snapshot().players[3].claimed,true);assert.equal(p.snapshot().players[3].ready,false);assert.throws(()=>p.adminCross(1));p.skip();let starts=0;p.tick(10000,()=>starts++);assert.equal(starts,1);
  p.begin('simulation',['A','B','C','D'],model,11000,true);p.presence([],11000);p.tick(11000,()=>{});for(let i=1;i<=4;i++)p.simulate(i,false);p.tick(11001,()=>{});p.tick(16001,()=>{});for(let i=1;i<=4;i++)p.simulate(i,true);p.tick(16002,()=>{});p.tick(18002,()=>starts++);assert.equal(starts,2);
});
test('portail : placements séparés atomiques et lancement Room conservant les énigmes',()=>{
  const directory=mkdtempSync(join(tmpdir(),'myroom-portal-'));try{const store=new PortalPlacementStore(directory);store.save('room@adventure',config);assert.deepEqual(new PortalPlacementStore(directory).get('room@adventure'),config);}finally{rmSync(directory,{recursive:true,force:true});}
  const room=new Room();room.model=structuredClone(model);room.snapshot();const revision=room.adventure.snapshot().revision;room.adventure.select('menthe27','0.3.0',revision);room.snapshot();room.portal.configure(config);room.startSession(true);room.maintain();room.portal.skip();room.maintain(Date.now()+3000);assert.equal(room.adventure.snapshot().running,true);assert.equal(room.adventure.snapshot().engine.stepId,'symbols');assert.deepEqual(room.model,model);
});
