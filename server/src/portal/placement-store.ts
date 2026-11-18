import { existsSync,readFileSync,writeFileSync,renameSync,mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parsePortalConfig,type PortalConfig } from './portal-types.js';
import { record } from '../engine/validation.js';
export class PortalPlacementStore {
  private entries:Record<string,PortalConfig>={};private file:string;
  constructor(directory:string){mkdirSync(directory,{recursive:true});this.file=join(directory,'portal-placements.json');if(existsSync(this.file)){const raw=readFileSync(this.file,'utf8');if(raw.length>256*1024)throw Error('Placements portail trop volumineux.');const s=record(JSON.parse(raw),['version','entries']);if(s.version!==1)throw Error('Version de placements inconnue.');const entries=record(s.entries,Object.keys(s.entries as object));for(const [key,value] of Object.entries(entries))this.entries[key]=parsePortalConfig(value);}}
  get(key:string){return this.entries[key]?structuredClone(this.entries[key]):undefined;}
  legacyForRoom(roomId:string){const entry=Object.entries(this.entries).find(([key])=>key.startsWith(roomId+'@'));return entry?structuredClone(entry[1]):undefined;}
  save(key:string,config:PortalConfig){if(key.length>160||!this.entries[key]&&Object.keys(this.entries).length>=128)throw Error('Limite des placements atteinte.');const next={...this.entries,[key]:parsePortalConfig(config)};writeFileSync(this.file+'.tmp',JSON.stringify({version:1,entries:next}),{mode:0o600});renameSync(this.file+'.tmp',this.file);this.entries=next;}
}
