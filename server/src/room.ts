export class Room {
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
    return { type: 'state', players: [...this.players].map(([id, slot]) => ({ id, slot })), puzzle: { id: 'demo', solved: this.solved, revision: this.revision } };
  }
  reset() { this.solved = false; this.revision++; }
}
