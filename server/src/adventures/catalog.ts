import { existsSync,readdirSync,readFileSync,statSync } from 'node:fs';
import { join } from 'node:path';
import { PuzzleRegistry } from '../engine/puzzle-registry.js';
import { AdventureCatalog } from '../engine/adventure-manifest.js';
import { symbolChest } from '../puzzles/symbol-chest.js';
import { blackjackLegacy } from '../puzzles/blackjack-legacy.js';
import { legacyAdventure } from './legacy.js';
import { menthe27 } from './menthe27.js';
export const createRegistry=()=>new PuzzleRegistry().register(symbolChest).register(blackjackLegacy);
export function createCatalog(registry:PuzzleRegistry,directory?:string){
  const catalog=new AdventureCatalog(registry,[legacyAdventure,menthe27]);
  if(directory&&existsSync(directory)){
    const files=readdirSync(directory).filter(file=>file.endsWith('.json')).sort();
    if(files.length>32)throw new Error('Trop de manifestes externes.');
    for(const file of files){const path=join(directory,file);if(statSync(path).size>128*1024)throw new Error('Manifeste trop volumineux.');catalog.add(JSON.parse(readFileSync(path,'utf8')));}
  }
  return catalog;
}
