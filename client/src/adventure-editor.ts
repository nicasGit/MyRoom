import { PUZZLE_ITEMS,parseRoom,suggestPuzzleLayout,puzzlePanel,findPuzzlePanel,type Point2,type PuzzleItem,type RoomModel,type RoomLibrary,type PuzzleLayout } from '../../server/src/scene-schema.js';
import { drawMap,ITEM_NAMES } from './adventure-map';
export class AdventureEditor {
  private model:RoomModel|null=null;
  private revision=0;
  private layout:PuzzleLayout|undefined;
  private dirty=false;
  private stale=false;
  private busy=false;
  private key='';
  private mapPoint=(x:number,z:number):Point2=>({x,z});
  constructor(private root:HTMLElement,private save:(room:RoomModel,revision:number)=>Promise<{library:RoomLibrary}>,private saved:()=>void){
    root.innerHTML='<p>Placer neuf éléments dans la pièce active, hors des obstacles. Les placements sont sauvegardés avec la pièce ; leur modification recommence la partie.</p><button data-auto>Proposer des positions</button> <button data-reload>Recharger la pièce</button><label>Élément <select data-item></select></label><div class="form-row"><label>X (m) <input data-x type="number" step="0.05"></label><label>Z (m) <input data-z type="number" step="0.05"></label><button data-position>Appliquer la position</button></div><p>Choisir un élément puis cliquer sur le plan pour le déplacer. Ce plan n’est pas une détection des passages physiques.</p><canvas data-map style="width:100%;max-width:800px" aria-label="Plan de placement des énigmes"></canvas><p data-message role="status"></p><button data-save>Enregistrer les placements</button> <button data-remove class="danger">Retirer les énigmes de la pièce</button>';
    const select=this.get<HTMLSelectElement>('[data-item]');for(const id of PUZZLE_ITEMS){const option=document.createElement('option');option.value=id;option.textContent=ITEM_NAMES[id];select.append(option);}
    select.onchange=()=>this.draw();
    const panelOption=document.createElement('option');panelOption.value='panel';panelOption.textContent='Panneau mural des symboles';select.append(panelOption);
    this.get('[data-auto]').onclick=()=>{try{if(!this.model)return;this.layout=suggestPuzzleLayout(this.model);this.dirty=true;this.message('Positions proposées : vérifier et ajuster avant sauvegarde.');this.draw();}catch(error){this.message(String(error));}};
    this.get('[data-reload]').onclick=()=>{if(this.dirty&&!confirm('Abandonner les placements non enregistrés ?'))return;this.dirty=false;this.stale=false;this.layout=this.model?.puzzles?structuredClone(this.model.puzzles):undefined;this.draw();this.message('Placements rechargés.');};
    this.get('[data-position]').onclick=()=>this.move({x:Number(this.get<HTMLInputElement>('[data-x]').value),z:Number(this.get<HTMLInputElement>('[data-z]').value)});
    this.get<HTMLCanvasElement>('[data-map]').onclick=event=>{const canvas=this.get<HTMLCanvasElement>('[data-map]'),rect=canvas.getBoundingClientRect();this.move(this.mapPoint((event.clientX-rect.left)*800/rect.width,(event.clientY-rect.top)*420/rect.height));};
    const canvas=this.get<HTMLCanvasElement>('[data-map]');canvas.style.touchAction='none';
    canvas.onpointerdown=event=>{
      if(!this.layout||this.busy||this.stale)return;
      const rect=canvas.getBoundingClientRect(),point=this.mapPoint((event.clientX-rect.left)*800/rect.width,(event.clientY-rect.top)*420/rect.height);
      const nearest=PUZZLE_ITEMS.find(id=>Math.hypot(this.layout!.points[id].x-point.x,this.layout!.points[id].z-point.z)<0.35);
      const panel=this.model&&puzzlePanel({...this.model,puzzles:this.layout});
      if(panel&&Math.hypot(panel.position.x-point.x,panel.position.z-point.z)<0.35)select.value='panel';else if(nearest)select.value=nearest;
      this.draw();canvas.setPointerCapture(event.pointerId);
    };
    canvas.onpointerup=event=>{
      if(!canvas.hasPointerCapture(event.pointerId))return;canvas.releasePointerCapture(event.pointerId);
      const rect=canvas.getBoundingClientRect();this.move(this.mapPoint((event.clientX-rect.left)*800/rect.width,(event.clientY-rect.top)*420/rect.height));
    };
    this.get('[data-save]').onclick=()=>{void this.commit(false);};
    this.get('[data-remove]').onclick=()=>{if(confirm('Retirer les deux énigmes de cette pièce ?'))void this.commit(true);};
  }
  private get<T extends HTMLElement=HTMLElement>(selector:string){return this.root.querySelector(selector) as T;}
  hasChanges(){return this.dirty||this.stale||this.busy;}
  private message(text:string){this.get('[data-message]').textContent=text;}
  receive(model:RoomModel|null,revision:number){
    const key=JSON.stringify(model);
    if(this.dirty&&this.model?.id===model?.id&&key!==this.key){this.model=model;this.revision=revision;this.stale=true;this.message('La pièce a changé : recharger avant de sauvegarder les placements.');this.draw();return;}
    this.model=model;this.revision=revision;
    if(key!==this.key){this.key=key;this.layout=model?.puzzles?structuredClone(model.puzzles):undefined;this.dirty=false;this.stale=false;this.draw();}
  }
  private move(point:Point2){
    if(!this.model||!this.layout||this.busy||this.stale)return;
    const id=this.get<HTMLSelectElement>('[data-item]').value as PuzzleItem|'panel';
    const next=structuredClone(this.layout);
    if(id==='panel'){const panel=findPuzzlePanel({...this.model,puzzles:next},point);if(!panel){this.message('Aucun mur libre pour ce panneau.');return;}next.panel=panel;}
    else next.points[id]={x:Number(point.x.toFixed(3)),z:Number(point.z.toFixed(3))};
    try{parseRoom({...this.model,puzzles:next});this.layout=next;this.dirty=true;this.message('Position modifiée, non enregistrée.');this.draw();}catch(error){this.message(String(error));}
  }
  private draw(){
    const canvas=this.get<HTMLCanvasElement>('[data-map]');canvas.hidden=!this.model;
    for(const button of Array.from(this.root.querySelectorAll<HTMLButtonElement>('button')))button.disabled=this.busy||!this.model;
    this.get<HTMLButtonElement>('[data-save]').disabled=this.busy||!this.model||!this.layout||this.stale;
    if(!this.model){this.message('Activer une pièce pour placer les énigmes.');return;}
    const id=this.get<HTMLSelectElement>('[data-item]').value as PuzzleItem|'panel',p=id==='panel'?this.layout&&puzzlePanel({...this.model,puzzles:this.layout})?.position:this.layout?.points[id];
    this.get<HTMLInputElement>('[data-x]').value=p?String(p.x):'';this.get<HTMLInputElement>('[data-z]').value=p?String(p.z):'';
    this.mapPoint=drawMap(canvas,{...this.model,puzzles:this.layout},this.layout?PUZZLE_ITEMS.map(key=>({point:this.layout!.points[key],label:ITEM_NAMES[key],color:key===id?'#67e8f9':'#ffe082'})):[]);
  }
  private async commit(remove:boolean){
    if(!this.model||this.busy||this.stale||(!remove&&!this.layout))return;
    this.busy=true;this.draw();
    try{
      const model=parseRoom({...this.model,puzzles:remove?undefined:this.layout});
      const result=await this.save(model,this.revision);
      this.dirty=false;this.stale=false;this.key='';this.receive(result.library.rooms.find(room=>room.id===result.library.activeId)??null,result.library.revision);
      this.message(remove?'Énigmes retirées.':'Placements enregistrés. Partie recommencée.');this.saved();
    }catch(error){this.message(String(error));}finally{this.busy=false;this.draw();}
  }
}
