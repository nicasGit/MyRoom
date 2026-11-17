import * as THREE from 'three';
import { toRoom,type makeCalibration } from './calibration';
import type { AdventureCommand,AdventureState,SymbolId,CardId } from '../../server/src/adventure.js';
import { PUZZLE_ITEMS,type Point2,type PuzzleItem,type RoomModel } from '../../server/src/scene-schema.js';
import { drawMap,ITEM_NAMES } from './adventure-map';
import { SYMBOL_NAMES,CARD_NAMES,CARD_CLUES } from './adventure-view';
type Panel={root:HTMLElement;status:HTMLElement;body:HTMLElement};
export class AdventureClient {
  private model:RoomModel|null=null;
  private state:AdventureState|undefined;
  private libraryRevision=0;
  private position:Point2|undefined;
  private virtual:Point2|undefined;
  private simulation=false;
  private xrActive=false;
  private connected=false;
  private pending=false;
  private requestTimer:ReturnType<typeof setTimeout>|undefined;
  private panels:Panel[]=[];
  private buttons:{button:HTMLButtonElement;target:PuzzleItem;action:AdventureCommand['action'];id:string;ready:boolean}[]=[];
  private lastPositionUpdate=-Infinity;
  private key='';
  private audio:AudioContext|undefined;
  constructor(private send:(message:AdventureCommand)=>boolean,private calibration:()=>ReturnType<typeof makeCalibration>|undefined,private changed:()=>void,private notify:(message:string)=>void){
    for(const id of ['adventure-desktop','adventure-ar']){const root=document.getElementById(id)!,status=document.createElement('p'),body=document.createElement('div');status.setAttribute('role','status');root.append(status,body);this.panels.push({root,status,body});}
    const toggle=document.getElementById('adventure-simulation') as HTMLInputElement;
    toggle.onchange=()=>{this.simulation=toggle.checked&&!this.xrActive&&!!this.state?.testMode;this.virtual=undefined;this.render(true);};
  }
  setConnected(value:boolean){this.connected=value;if(!value){this.pending=false;clearTimeout(this.requestTimer);}this.updateButtons();}
  setXRActive(value:boolean){this.xrActive=value;this.position=undefined;this.simulation=false;this.virtual=undefined;(document.getElementById('adventure-simulation') as HTMLInputElement).checked=false;this.render(true);}
  receive(model:RoomModel|null,state:AdventureState,libraryRevision:number){
    const previous=this.state?.phase;
    const changed=JSON.stringify(model)!==JSON.stringify(this.model)||state.revision!==this.state?.revision;
    this.model=model;this.state=state;this.libraryRevision=libraryRevision;
    if(!state.testMode){this.simulation=false;this.virtual=undefined;}
    if(previous&&previous!==state.phase&&(state.phase==='blackjack'||state.phase==='complete'))this.chime();
    if(changed){this.render(true);this.changed();}
  }
  viewState(){return this.model&&this.state?{model:this.model,state:this.state}:undefined;}
  story(){return this.state?.phase==='symbols'?'Le jour nourrit la forêt. Puis vient la nuit, et ses premières lumières. Retrouvez les 4 balises, puis entrez les symboles au coffre avec la gâchette.':this.state?.phase==='blackjack'?'As + 6. Retrouvez les 3 cartes, puis jouez une seule carte à la table pour obtenir exactement 21. Visez le panneau et appuyez sur la gâchette.':this.hint();}
  result(message:string){this.pending=false;clearTimeout(this.requestTimer);for(const panel of this.panels)panel.status.textContent=message;this.notify(message);this.updateButtons();}
  updatePosition(local:THREE.Vector3|undefined){
    const calibration=this.calibration();this.position=local&&calibration?toRoom(local,calibration):undefined;
    if(performance.now()-this.lastPositionUpdate>200){this.lastPositionUpdate=performance.now();this.updateButtons();this.map();}
  }
  private currentPosition(){return this.simulation&&!this.xrActive?this.virtual:this.position;}
  private closeTo(target:PuzzleItem){const p=this.currentPosition(),q=this.model?.puzzles?.points[target];return !!p&&!!q&&Math.hypot(p.x-q.x,p.z-q.z)<=1.3;}
  private perform(action:AdventureCommand['action'],id:string,target:PuzzleItem){
    const position=this.currentPosition();if(!position||!this.state||!this.model?.puzzles||this.pending||!this.connected||!this.closeTo(target))return;
    this.unlockSound();this.pending=true;this.updateButtons();
    const message:AdventureCommand={type:'adventure_action',revision:this.state.revision,libraryRevision:this.libraryRevision,action,target:id,position:{x:position.x,z:position.z},simulation:this.simulation&&!this.xrActive};
    if(!this.send(message)){this.result('Connexion serveur indisponible.');return;}
    this.requestTimer=setTimeout(()=>{if(this.pending)this.result('Pas de réponse. Vérifiez la connexion avant de réessayer.');},5000);
  }
  private unlockSound(){try{this.audio??=new AudioContext();void this.audio.resume().catch(()=>{});}catch{/* Audio is optional. */}}
  private chime(){try{if(!this.audio||this.audio.state!=='running')return;const oscillator=this.audio.createOscillator(),gain=this.audio.createGain();oscillator.connect(gain);gain.connect(this.audio.destination);gain.gain.setValueAtTime(0.06,this.audio.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,this.audio.currentTime+0.6);oscillator.frequency.setValueAtTime(523,this.audio.currentTime);oscillator.frequency.setValueAtTime(784,this.audio.currentTime+0.2);oscillator.start();oscillator.stop(this.audio.currentTime+0.6);}catch{/* No audio must never block the puzzle. */}}
  hint(){return this.state?.phase==='symbols'?'Énigme : trouvez les balises, puis visez les symboles du coffre et utilisez la gâchette.':this.state?.phase==='blackjack'?'Énigme : trouvez les trois cartes, puis choisissez à la table avec la gâchette.':this.state?.phase==='complete'?'Les deux énigmes sont réussies. Clé obtenue : 7.':'';}
  raycast(group:THREE.Group,origin:THREE.Vector3,direction:THREE.Vector3){
    group.updateMatrixWorld(true);const ray=new THREE.Raycaster(origin,direction.normalize(),0,8),hits=ray.intersectObject(group,true);
    const hit=hits.find(item=>item.object.userData.action);if(!hit)return;
    const command=hit.object.userData.action as {action:AdventureCommand['action'];target:string};
    const button=this.buttons.find(item=>item.action===command.action&&item.id===command.target&&item.ready);
    if(button)this.perform(button.action,button.id,button.target);
  }
  private updateButtons(){
    for(const item of this.buttons)item.button.disabled=!this.connected||this.pending||!item.ready||!this.closeTo(item.target);
    const toggle=document.getElementById('adventure-simulation') as HTMLInputElement;toggle.disabled=!this.state?.testMode||this.xrActive;toggle.checked=this.simulation;
  }
  private addAction(panel:Panel,label:string,action:AdventureCommand['action'],id:string,target:PuzzleItem,ready:boolean){
    const row=document.createElement('div');row.className='xr-actions';const button=document.createElement('button');button.textContent=label;button.dataset.gameAction=action;button.dataset.target=id;button.onclick=()=>this.perform(action,id,target);row.append(button);
    this.buttons.push({button,target,action,id,ready});
    if(this.simulation&&!this.xrActive&&panel===this.panels[0]){const move=document.createElement('button');move.textContent='Aller à cet élément (test PC)';move.dataset.move=target;move.onclick=()=>{this.virtual={...this.model!.puzzles!.points[target]};this.updateButtons();this.map();};row.append(move);}
    panel.body.append(row);
  }
  private render(force=false){
    const key=JSON.stringify([this.state,this.model?.id,this.simulation,this.xrActive]);if(!force&&key===this.key)return;this.key=key;this.buttons=[];
    for(const panel of this.panels){
      panel.body.replaceChildren();panel.status.textContent=this.state?.message??'Connexion aux énigmes…';
      const text=(message:string)=>{const p=document.createElement('p');p.textContent=message;panel.body.append(p);};
      if(!this.model?.puzzles||!this.state||this.state.phase==='unconfigured'){text('Activer une pièce et placer les énigmes depuis l’administration.');continue;}
      const state=this.state;
      if(state.phase==='symbols'){
        text('Le coffre des quatre symboles');text('« Le jour nourrit la forêt. Puis vient la nuit, et ses premières lumières. »');
        text(`Balises découvertes : ${state.symbols.found.length}/4 · combinaison : ${state.symbols.entered.map(id=>SYMBOL_NAMES[id]).join(' → ')||'vide'} · erreurs : ${state.symbols.attempts}`);
        for(const [i,id] of (['sun','tree','moon','star'] as SymbolId[]).entries())this.addAction(panel,state.symbols.found.includes(id)?`${SYMBOL_NAMES[id]} découvert`:`Découvrir la balise ${i+1}`,'discover_symbol',id,id,!state.symbols.found.includes(id));
        text('Au coffre, entrer les symboles dans l’ordre :');for(const id of ['sun','tree','moon','star'] as SymbolId[])this.addAction(panel,SYMBOL_NAMES[id],'press_symbol',id,'chest',state.symbols.found.length===4);
      }else if(state.phase==='blackjack'){
        text('La table du dernier As');text('« Mon coffre ne s’ouvre ni à vingt, ni à vingt-deux. Faites vingt-et-un… ensemble. »');text('Main de départ : As + 6. Retrouvez les trois cartes ; ajoutez ensuite une seule carte pour faire exactement 21. L’As vaut 11 ou 1.');
        for(const [i,id] of (['four','eight','king'] as CardId[]).entries()){this.addAction(panel,state.blackjack.found.includes(id)?`Carte ${CARD_NAMES[id]} découverte`:`Découvrir l’indice de la carte ${i+1}`,'discover_card',id,id,!state.blackjack.found.includes(id));if(state.blackjack.found.includes(id))text(`${CARD_NAMES[id]} : ${CARD_CLUES[id]}`);}
        text(`Dernier essai : ${state.blackjack.chosen?CARD_NAMES[state.blackjack.chosen]+' → '+state.blackjack.total:'aucun'} · tentatives : ${state.blackjack.attempts}`);
        for(const id of ['four','eight','king'] as CardId[])this.addAction(panel,`Jouer ${CARD_NAMES[id]} à la table`,'choose_card',id,'table',state.blackjack.found.length===3);
      }else {text('Les deux énigmes sont réussies ! Une clé virtuelle et le chiffre 7 sont révélés. L’administrateur peut recommencer la partie.');}
      text(this.simulation?'Simulation PC active : positions virtuelles, aucun suivi physique.':'Approchez-vous à moins de 1,3 m. En AR : bouton tactile, ou visez l’élément et utilisez la gâchette.');
    }
    this.updateButtons();this.map();
  }
  private map(){
    const canvas=document.getElementById('adventure-map') as HTMLCanvasElement;canvas.hidden=!this.model?.puzzles;
    if(!this.model?.puzzles||!this.state)return;
    const phase=this.state.phase,visible=phase==='symbols'?['chest','sun','tree','moon','star']:PUZZLE_ITEMS;
    drawMap(canvas,this.model,visible.map(id=>{const item=id as PuzzleItem;let label=ITEM_NAMES[item];if((['sun','tree','moon','star'] as string[]).includes(id)&&!this.state!.symbols.found.includes(id as SymbolId))label='Balise ?';if((['four','eight','king'] as string[]).includes(id)&&!this.state!.blackjack.found.includes(id as CardId))label='Carte ?';return {point:this.model!.puzzles!.points[item],label};}),this.currentPosition());
  }
}
