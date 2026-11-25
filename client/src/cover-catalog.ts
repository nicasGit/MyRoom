export type PublicCover={id:string;tapeId:string;title:string;year:number;image:string};
const selected=new Map<string,PublicCover>();
export function coverFor(tapeId:string){return selected.get(tapeId);}
export async function loadCoverCatalog(){try{const response=await fetch('/api/covers',{cache:'no-store'});if(!response.ok)return;const data=await response.json() as {selected:Record<string,PublicCover|undefined>};for(const [id,cover] of Object.entries(data.selected))if(cover)selected.set(id,cover);window.dispatchEvent(new Event('myroom-covers-updated'));}catch{/* Offline/local builds keep the built-in artwork. */}}
void loadCoverCatalog();
