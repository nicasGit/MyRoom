import type { RoomModel } from './scene-schema.js';
import { Adventure } from './adventure.js';
export class Room {
  adventure=new Adventure();
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
    return { type: 'state', players: [...this.players].map(([id, slot]) => ({ id, slot })), puzzle: { id: 'demo', solved: this.solved, revision: this.revision }, model:this.model, libraryRevision:this.libraryRevision,adventure:this.adventure.snapshot() };
  }
  reset() { this.solved = false; this.revision++; }
}
