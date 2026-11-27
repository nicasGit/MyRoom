import { importedCatalog } from './object-library.js';
import { DisplayModes } from './display-modes.js';
import { adminAccess } from './admin-access.js';
import type { RoomModel } from './scene-schema.js';
import { Adventure } from './adventure.js';
import { text,integer,list } from './engine/validation.js';
import { TeamPortal } from './portal/team-portal.js';
import { SeatSessions } from './portal/seat-sessions.js';
import { DEFAULT_PORTAL,validatePlacement } from './portal/portal-types.js';
import type { PortalPlacementStore } from './portal/placement-store.js';
import { randomUUID } from 'node:crypto';
import { ObjectManipulation } from './object-manipulation.js';
import { suggestPortalPlacement } from './portal/portal-placement.js';
import { MYROOM_VERSION } from './version.js';
export type SharedCalibration={roomId:string;revision:number;distance:number;createdAt:string;sourceSlot:number};
export class Room {
  display=new DisplayModes();
  portal=new TeamPortal();seats=new SeatSessions();portalStore?:PortalPlacementStore;private portalKey='';
  syncPortal(){const key=JSON.stringify(this.model?{...this.model,name:undefined,objects:undefined}:null);
    if(key!==this.portalKey){this.portal.cancel();this.sharedCalibration=undefined;this.portalKey=key;let config=this.portalStore?.get(this.placementKey())??this.portalStore?.legacyForRoom(this.model?.id??'no-room');if(!config){try{config=suggestPortalPlacement(this.model);}catch{config=structuredClone(DEFAULT_PORTAL);}}this.portal.configure(config);}
    this.portal.setRoom(this.model);this.portal.prepare(this.playerNames,[...this.players.values()]);}
  placementKey(){return (this.model?.id??'no-room')+'@team-portal@1';}
  startSession(simulation=false){this.adventure.configure(this.model);this.syncPortal();if(!this.model?.puzzles)throw Error('Configurez les placements avant le rituel.');if(this.portal.snapshot().config.enabled){if(this.adventure.snapshot().running||this.adventure.engine.snapshot().completedSteps.length||this.adventure.engine.snapshot().status!=='ready')throw Error('Arretez et reinitialisez la partie avant un nouveau rituel.');this.portal.begin(randomUUID(),this.playerNames,this.model,Date.now(),simulation);}else this.adventure.start();}
  stopSession(){this.portal.cancel();this.adventure.stop();}
  restartRitual(){
    this.adventure.configure(this.model);this.syncPortal();
    const state=this.portal.snapshot();
    if(!this.model?.puzzles||!state.config.enabled||!state.config.confirmed)throw Error('Configurez et confirmez le rituel avant de le recommencer.');
    validatePlacement(state.config,this.model);
    if(Object.keys(state.staffPositions??{}).length!==(state.config.playerCount??4))throw Error('Pas assez de place pour les bâtons.');
    this.portal.cancel();this.adventure.stop();
    this.portal.begin(randomUUID(),this.playerNames,this.model,Date.now());
    this.objects.resetPortal(this.portal.staffPoses());
  }
  objects=new ObjectManipulation();
  captainId:string|undefined;
  maintain(now=Date.now()){this.syncPortal();const presence=this.portal.active&&this.portal.presence([...this.players.values()],now);const transition=this.portal.tick(now,()=>{const status=this.adventure.engine.snapshot().status;if(status!=='pending'&&status!=='complete')this.adventure.start();});this.objects.configure(this.model,this.adventure.sceneEpoch,this.portal.staffPoses());const moved=this.objects.maintain([...this.players.keys()],now);if(!this.captainId||!this.players.has(this.captainId))this.captainId=[...this.players].sort((a,b)=>a[1]-b[1])[0]?.[0];return this.adventure.maintain({captainId:this.captainId,players:[...this.players.keys()],now})||moved||presence||transition;}
  leave(id:string){this.display.remove(id);this.players.delete(id);this.maintain();}
  constructor(public adventure=new Adventure()){}
  sharedCalibration:SharedCalibration|undefined;
  publishCalibration(slot:number,distance:number){if(!Number.isFinite(distance)||distance<.5||distance>10)throw Error('Calibrage partag� invalide.');if(!this.sharedCalibration)this.sharedCalibration={roomId:this.model?.id??'no-room',revision:1,distance,createdAt:new Date().toISOString(),sourceSlot:slot};return this.sharedCalibration;}
  playerNames=['Joueur 1','Joueur 2','Joueur 3','Joueur 4'];
  playerNamesRevision=0;
  setPlayerNames(names:unknown,revision:unknown){
    if(integer(revision)!==this.playerNamesRevision)throw new Error('Les noms ont changé. Actualisez avant de recommencer.');
    const parsed=list(names,4).map(name=>text(name,40));if(parsed.length!==4)throw new Error('Quatre noms attendus.');
    this.playerNames=parsed;this.playerNamesRevision++;
  }
  model: RoomModel | null = null;
  libraryRevision = 0;
  players = new Map<string, number>();
  revision = 0;
  solved = false;
  join(id: string,requestedSlot?:number) {
    const slot = (requestedSlot?[requestedSlot]:[1, 2, 3, 4]).find(n => n>=1&&n<=(this.portal.snapshot().config.playerCount??4)&&![...this.players.values()].includes(n));
    if (slot === undefined) return false;
    this.players.set(id, slot); return true;
  }
  solve(revision: number) {
    if (revision !== this.revision || this.solved) return false;
    this.solved = true; this.revision++; return true;
  }
  snapshot() {
    this.adventure.configure(this.model);
    this.maintain();
    return { type: 'state',version:MYROOM_VERSION,objectCatalog:importedCatalog(),adminAccess:adminAccess(),display:{policy:this.display.snapshot(),clients:this.display.clients().map(({id,mode})=>({id,mode}))},sharedCalibration:this.sharedCalibration,lobby:{adventures:this.adventure.listAdventures().map(({id,version,title})=>({id,version,title})),names:[...this.playerNames],namesRevision:this.playerNamesRevision},portal:this.portal.snapshot(), players: [...this.players].map(([id, slot]) => ({ id, slot,name:this.playerNames[slot-1] })), puzzle: { id: 'demo', solved: this.solved, revision: this.revision }, model:this.model, libraryRevision:this.libraryRevision,adventure:{...this.adventure.snapshot(),objects:this.objects.snapshot()} };
  }
  reset() { this.solved = false; this.revision++; }
}
