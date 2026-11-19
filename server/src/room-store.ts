import { mkdirSync, readFileSync, renameSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseLibrary, parseRoom, type RoomLibrary } from './scene-schema.js';

export class RoomStore {
  private library: RoomLibrary={version:1,revision:0,activeId:null,rooms:[]};
  private file: string;
  constructor(directory: string) {
    mkdirSync(directory,{recursive:true}); this.file=join(directory,'rooms.json');
    if(existsSync(this.file)) {
      if(statSync(this.file).size>512*1024) throw new Error('Bibliothèque trop volumineuse.');
      this.library=parseLibrary(JSON.parse(readFileSync(this.file,'utf8')));
    }
  }
  snapshot() { return structuredClone(this.library); }
  active() { return this.snapshot().rooms.find(room=>room.id===this.library.activeId) ?? null; }
  change(action: 'save'|'activate'|'delete'|'rename', revision: unknown, input: unknown) {
    if(revision!==this.library.revision) throw new Error('Bibliothèque modifiée ailleurs. Actualiser avant de recommencer.');
    const next=this.snapshot();
    if(action==='save') {
      const room=parseRoom(input);
      const index=next.rooms.findIndex(item=>item.id===room.id);
      if(index<0) { if(next.rooms.length>=20) throw new Error('Maximum 20 pièces enregistrées.'); next.rooms.push(room); }
      else next.rooms[index]=room;
      next.activeId=room.id;
    } else if(action==='rename'){
      if(!input||typeof input!=='object'||Object.keys(input).sort().join(',')!=='id,name')throw Error('Identifiant et nom attendus.');
      const command=input as {id:unknown;name:unknown},index=next.rooms.findIndex(room=>room.id===command.id);
      if(index<0)throw Error('Pièce introuvable.');
      next.rooms[index]=parseRoom({...next.rooms[index],name:command.name});
    } else {
      if(typeof input!=='string'||!next.rooms.some(room=>room.id===input)) throw new Error('Pièce introuvable.');
      if(action==='activate') next.activeId=input;
      else { next.rooms=next.rooms.filter(room=>room.id!==input); if(next.activeId===input) next.activeId=null; }
    }
    next.revision++;
    // Commit in memory only after a successful atomic filesystem replacement.
    writeFileSync(`${this.file}.tmp`,JSON.stringify(next,null,2),{mode:0o600});
    renameSync(`${this.file}.tmp`,this.file);
    this.library=next;
    return this.snapshot();
  }
}
