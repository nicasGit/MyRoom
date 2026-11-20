import { DisplayModes } from './display-modes.js';
import { adminAccess } from './admin-access.js';
import type { RoomModel } from './scene-schema.js';
import { Adventure } from './adventure.js';
import { text,integer,list } from './engine/validation.js';
import { TeamPortal } from './portal/team-portal.js';
import { SeatSessions } from './portal/seat-sessions.js';
import { DEFAULT_PORTAL } from './portal/portal-types.js';
import type { PortalPlacementStore } from './portal/placement-store.js';
import { randomUUID } from 'node:crypto';
import { ObjectManipulation } from './object-manipulation.js';
import { suggestPortalPlacement } from './portal/portal-placement.js';
export class Room {
  display=new DisplayModes();
  portal=new TeamPortal();seats=new SeatSessions();portalStore?:PortalPlacementStore;private portalKey='';
  syncPortal(){const key=JSON.stringify(this.model?{...this.model,name:undefined,objects:undefined}:null);
    if(key!==this.portalKey){this.portal.cancel();this.portalKey=key;let config=this.portalStore?.get(this.placementKey())??this.portalStore?.legacyForRoom(this.model?.id??'no-room');if(!config){try{config=suggestPortalPlacement(this.model);}catch{config=structuredClone(DEFAULT_PORTAL);}}this.portal.configure(config);}
    this.portal.setRoom(this.model);this.portal.prepare(this.playerNames,[...this.players.values()]);}
  placementKey(){return (this.model?.id??'no-room')+'@team-portal@1';}
  startSession(simulation=false){this.adventure.configure(this.model);this.syncPortal();if(!this.model?.puzzles)throw Error('Configurez les placements avant le rituel.');if(this.portal.snapshot().config.enabled){if(this.adventure.snapshot().running||this.adventure.engine.snapshot().completedSteps.length||this.adventure.engine.snapshot().status!=='ready')throw Error('Arretez et reinitialisez la partie avant un nouveau rituel.');this.portal.begin(randomUUID(),this.playerNames,this.model,Date.now(),simulation);}else this.adventure.start();}
  stopSession(){this.portal.cancel();this.adventure.stop();}
  objects=new ObjectManipulation();
  captainId:string|undefined;
  maintain(now=Date.now()){this.syncPortal();const presence=this.portal.active&&this.portal.presence([...this.players.values()],now);const transition=this.portal.tick(now,()=>this.adventure.start());this.objects.configure(this.model,this.adventure.sceneEpoch,this.portal.staffPoses());const moved=this.objects.maintain([...this.players.keys()],now);if(!this.captainId||!this.players.has(this.captainId))this.captainId=[...this.players].sort((a,b)=>a[1]-b[1])[0]?.[0];return this.adventure.maintain({captainId:this.captainId,players:[...this.players.keys()],now})||moved||presence||transition;}
  leave(id:string){this.display.remove(id);this.players.delete(id);this.maintain();}
  constructor(public adventure=new Adventure()){}
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
    return { type: 'state',adminAccess:adminAccess(),display:{policy:this.display.snapshot(),clients:this.display.clients().map(({id,mode})=>({id,mode}))},lobby:{adventures:this.adventure.listAdventures().map(({id,version,title})=>({id,version,title})),names:[...this.playerNames],namesRevision:this.playerNamesRevision},portal:this.portal.snapshot(), players: [...this.players].map(([id, slot]) => ({ id, slot,name:this.playerNames[slot-1] })), puzzle: { id: 'demo', solved: this.solved, revision: this.revision }, model:this.model, libraryRevision:this.libraryRevision,adventure:{...this.adventure.snapshot(),objects:this.objects.snapshot()} };
  }
  reset() { this.solved = false; this.revision++; }
}
