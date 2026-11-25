import { existsSync,readdirSync,readFileSync,statSync } from 'node:fs';
import { join } from 'node:path';
import { PuzzleRegistry } from '../engine/puzzle-registry.js';
import { AdventureCatalog } from '../engine/adventure-manifest.js';
import { symbolChest } from '../puzzles/symbol-chest.js';
import { blackjackLegacy } from '../puzzles/blackjack-legacy.js';
import { legacyAdventure } from './legacy.js';
import { menthe27,menthe27Hybrid,menthe27Portal,menthe27Videoclub,menthe27Videoclub80s } from './menthe27.js';
import { randomInt } from 'node:crypto';
import { createBlackjackHybrid } from '../puzzles/blackjack-hybrid.js';
import { retroVideoclub } from '../puzzles/retro-videoclub.js';
export const createRegistry=()=>new PuzzleRegistry().register(symbolChest).register(blackjackLegacy).register(createBlackjackHybrid(()=>randomInt(0,0x100000000)/0x100000000)).register(retroVideoclub);
export function createCatalog(registry:PuzzleRegistry,directory?:string){
  const catalog=new AdventureCatalog(registry,[legacyAdventure,menthe27Portal,menthe27Videoclub80s,menthe27Videoclub,menthe27Hybrid,menthe27]);
  if(directory&&existsSync(directory)){
    const files=readdirSync(directory).filter(file=>file.endsWith('.json')).sort();
    if(files.length>32)throw new Error('Trop de manifestes externes.');
    for(const file of files){const path=join(directory,file);if(statSync(path).size>128*1024)throw new Error('Manifeste trop volumineux.');catalog.add(JSON.parse(readFileSync(path,'utf8')));}
  }
  return catalog;
}
