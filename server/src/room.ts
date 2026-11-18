import type { RoomModel } from './scene-schema.js';
import { Adventure } from './adventure.js';
import { text,integer,list } from './engine/validation.js';
import { ObjectManipulation } from './object-manipulation.js';
export class Room {
  objects=new ObjectManipulation();
  captainId:string|undefined;
  maintain(now=Date.now()){this.objects.configure(this.model,this.adventure.sceneEpoch);const moved=this.objects.maintain([...this.players.keys()],now);if(!this.captainId||!this.players.has(this.captainId))this.captainId=[...this.players].sort((a,b)=>a[1]-b[1])[0]?.[0];return this.adventure.maintain({captainId:this.captainId,players:[...this.players.keys()],now})||moved;}
  leave(id:string){this.players.delete(id);this.maintain();}
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
  join(id: string) {
    const slot = [1, 2, 3, 4].find(n => ![...this.players.values()].includes(n));
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
    return { type: 'state', players: [...this.players].map(([id, slot]) => ({ id, slot,name:this.playerNames[slot-1] })), puzzle: { id: 'demo', solved: this.solved, revision: this.revision }, model:this.model, libraryRevision:this.libraryRevision,adventure:{...this.adventure.snapshot(),objects:this.objects.snapshot()} };
  }
  reset() { this.solved = false; this.revision++; }
}
