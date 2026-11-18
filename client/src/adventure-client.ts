import * as THREE from 'three';
import { toRoom,type makeCalibration } from './calibration';
import type { AdventureCommand,PuzzleCommand,AdventureState,SymbolId,CardId } from '../../server/src/adventure.js';
import type { HybridAction } from '../../server/src/puzzles/blackjack-hybrid.js';
import { hybridOptions,hybridSummary } from './puzzles/blackjack-controls';
import { BlackjackPreview,pickHybridAction } from './puzzles/blackjack-view';
import { PUZZLE_ITEMS,parseRoom,parseLibrary,puzzlePanel,findPuzzlePanel,type Point2,type PuzzleItem,type RoomModel } from '../../server/src/scene-schema.js';
import { drawMap,ITEM_NAMES } from './adventure-map';
import { SYMBOL_NAMES,CARD_NAMES,CARD_CLUES,pickAdventureAction } from './adventure-view';
type Panel={root:HTMLElement;status:HTMLElement;body:HTMLElement};
type InteractionTarget=PuzzleItem|'panel';
export class AdventureClient {
  private actorId:string|undefined;
  private hybridButtons:{button:HTMLButtonElement;ready:boolean}[]=[];
  private hybridPreview:BlackjackPreview|undefined;
  private hybridHost:HTMLElement;
  setIdentity(id:string){this.actorId=id;}
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
  private buttons:{button:HTMLButtonElement;target:InteractionTarget;action:AdventureCommand['action'];id:string;ready:boolean}[]=[];
  private lastPositionUpdate=-Infinity;
  private key='';
  private audio:AudioContext|undefined;
  private aim:Point2|undefined;
  private aimAt=0;
  private placementToken='';
  private moving=false;
  constructor(private send:(message:AdventureCommand|PuzzleCommand)=>boolean,private calibration:()=>ReturnType<typeof makeCalibration>|undefined,private changed:()=>void,private notify:(message:string)=>void){
    for(const id of ['adventure-desktop','adventure-ar']){const root=document.getElementById(id)!,status=document.createElement('p'),body=document.createElement('div');status.setAttribute('role','status');root.append(status,body);this.panels.push({root,status,body});}
    this.hybridHost=document.createElement('div');this.hybridHost.id='blackjack-preview';this.hybridHost.setAttribute('aria-label','Table de blackjack 3D');this.panels[0].root.append(this.hybridHost);this.hybridHost.hidden=true;
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
  updateAim(local:THREE.Vector3|undefined){const calibration=this.calibration();this.aim=local&&calibration?toRoom(local,calibration):undefined;this.aimAt=performance.now();}
  private async movePrepared(id:InteractionTarget,input:HTMLInputElement){
    if(!this.model?.puzzles||this.state?.running||!this.xrActive||!this.calibration()||this.moving)return;
    if(!this.aim||performance.now()-this.aimAt>250){this.result('Visez le sol avec un suivi valide, puis réessayez.');return;}
    this.placementToken=input.value.trim()||this.placementToken;input.value='';
    if(!this.placementToken){this.result('Saisissez le jeton administrateur pour déplacer un élément.');return;}
    this.moving=true;
    try{
      const model=structuredClone(this.model);
      if(id==='panel'){const panel=findPuzzlePanel(model,this.aim);if(!panel)throw new Error('Aucun mur libre pour le panneau.');model.puzzles!.panel=panel;}
      else model.puzzles!.points[id]={x:this.aim.x,z:this.aim.z};parseRoom(model);
      const response=await fetch('/api/admin/adventure/place',{method:'POST',headers:{Authorization:`Bearer ${this.placementToken}`,'Content-Type':'application/json'},body:JSON.stringify({revision:this.libraryRevision,gameRevision:this.state!.revision,points:model.puzzles!.points,panel:model.puzzles!.panel}),signal:AbortSignal.timeout(8000)});
      if(response.status===401)this.placementToken='';
      const data=await response.json();if(!response.ok)throw new Error(data.error??`HTTP ${response.status}`);
      parseLibrary(data.library);this.result('Élément déplacé et enregistré. Vérifiez sa position avant le départ.');
    }catch(error){this.result(`Déplacement non enregistré : ${String(error)}`);}finally{this.moving=false;}
  }
  story(){if(this.state?.phase==='pending')return this.state.message;if(this.state?.hybrid)return hybridSummary(this.state.hybrid);return this.state&&!this.state.running?'Préparation : ajustez les placements depuis le plan administrateur ou le panneau tactile AR, puis commencez les énigmes dans l’administration.':this.state?.phase==='symbols'?'Le jour nourrit la forêt. Puis vient la nuit, et ses premières lumières. Retrouvez les 4 balises, puis entrez les symboles au panneau mural avec la gâchette.':this.state?.phase==='blackjack'?'As + 6. Retrouvez les 3 cartes, puis jouez une seule carte à la table pour obtenir exactement 21. Visez le panneau et appuyez sur la gâchette.':this.hint();}
  result(message:string){this.pending=false;clearTimeout(this.requestTimer);for(const panel of this.panels)panel.status.textContent=message;this.notify(message);this.updateButtons();}
  updatePosition(local:THREE.Vector3|undefined){
    const calibration=this.calibration();this.position=local&&calibration?toRoom(local,calibration):undefined;
    if(performance.now()-this.lastPositionUpdate>200){this.lastPositionUpdate=performance.now();this.updateButtons();this.map();}
  }
  private currentPosition(){return this.simulation&&!this.xrActive?this.virtual:this.position;}
  private closeTo(target:InteractionTarget){const p=this.currentPosition(),q=target==='panel'&&this.model?puzzlePanel(this.model)?.position:this.model?.puzzles?.points[target as PuzzleItem];return !!p&&!!q&&Math.hypot(p.x-q.x,p.z-q.z)<=1.3;}
  private perform(action:AdventureCommand['action'],id:string,target:InteractionTarget){
    const position=this.currentPosition();if(!position||!this.state?.running||!this.model?.puzzles||this.pending||!this.connected||!this.closeTo(target))return;
    this.unlockSound();this.pending=true;this.updateButtons();
    const message:AdventureCommand={type:'adventure_action',revision:this.state.revision,libraryRevision:this.libraryRevision,action,target:id,position:{x:position.x,z:position.z},simulation:this.simulation&&!this.xrActive};
    if(!this.send(message)){this.result('Connexion serveur indisponible.');return;}
    this.requestTimer=setTimeout(()=>{if(this.pending)this.result('Pas de réponse. Vérifiez la connexion avant de réessayer.');},5000);
  }
  private performHybrid(action:HybridAction){
    const position=this.currentPosition(),step=this.state?.engine.step;
    if(!position||!this.state?.running||!step||step.kind!=='puzzle'||this.pending||!this.connected||!this.closeTo('table'))return;
    this.unlockSound();this.pending=true;this.updateButtons();
    if(!this.send({type:'puzzle_action',revision:this.state.revision,libraryRevision:this.libraryRevision,instanceId:step.instanceId,action,position:{x:position.x,z:position.z},simulation:this.simulation&&!this.xrActive})){this.result('Connexion serveur indisponible.');return;}
    this.requestTimer=setTimeout(()=>{if(this.pending)this.result('Pas de réponse du serveur.');},5000);
  }
  private unlockSound(){try{this.audio??=new AudioContext();void this.audio.resume().catch(()=>{});}catch{/* Audio is optional. */}}
  private chime(){try{if(!this.audio||this.audio.state!=='running')return;const oscillator=this.audio.createOscillator(),gain=this.audio.createGain();oscillator.connect(gain);gain.connect(this.audio.destination);gain.gain.setValueAtTime(0.06,this.audio.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,this.audio.currentTime+0.6);oscillator.frequency.setValueAtTime(523,this.audio.currentTime);oscillator.frequency.setValueAtTime(784,this.audio.currentTime+0.2);oscillator.start();oscillator.stop(this.audio.currentTime+0.6);}catch{/* No audio must never block the puzzle. */}}
  hint(){return this.state?.phase==='symbols'?'Énigme : trouvez les balises, puis visez les symboles du coffre et utilisez la gâchette.':this.state?.phase==='blackjack'?'Énigme : trouvez les trois cartes, puis choisissez à la table avec la gâchette.':this.state?.phase==='complete'?'Les deux énigmes sont réussies. Clé obtenue : 7.':'';}
  raycast(group:THREE.Group,origin:THREE.Vector3,direction:THREE.Vector3,camera:THREE.Camera){
    if(this.state?.hybrid){const action=pickHybridAction(group,origin,direction,camera);if(action)this.performHybrid(action);return;}
    const command=pickAdventureAction(group,origin,direction,camera);if(!command)return;
    const button=this.buttons.find(item=>item.action===command.action&&item.id===command.target&&item.ready);
    if(button)this.perform(button.action,button.id,button.target);
  }
  private updateButtons(){
    for(const item of this.hybridButtons)item.button.disabled=!this.connected||!this.state?.running||this.pending||!item.ready||!this.closeTo('table');
    for(const item of this.buttons)item.button.disabled=!this.connected||!this.state?.running||this.pending||!item.ready||!this.closeTo(item.target);
    const toggle=document.getElementById('adventure-simulation') as HTMLInputElement;toggle.disabled=!this.state?.testMode||this.xrActive;toggle.checked=this.simulation;
  }
  private addAction(panel:Panel,label:string,action:AdventureCommand['action'],id:string,target:InteractionTarget,ready:boolean){
    const row=document.createElement('div');row.className='xr-actions';const button=document.createElement('button');button.textContent=label;button.dataset.gameAction=action;button.dataset.target=id;button.onclick=()=>this.perform(action,id,target);row.append(button);
    this.buttons.push({button,target,action,id,ready});
    if(this.simulation&&!this.xrActive&&panel===this.panels[0]){const move=document.createElement('button');move.textContent='Aller à cet élément (test PC)';move.dataset.move=target;move.onclick=()=>{const point=target==='panel'?puzzlePanel(this.model!)?.position:this.model!.puzzles!.points[target];this.virtual=point?{...point}:undefined;this.updateButtons();this.map();};row.append(move);}
    panel.body.append(row);
  }
  private render(force=false){
    const key=JSON.stringify([this.state,this.model?.id,this.simulation,this.xrActive]);if(!force&&key===this.key)return;this.key=key;this.buttons=[];this.hybridButtons=[];
    this.hybridHost.hidden=!this.state?.hybrid||this.xrActive;
    if(this.state?.hybrid&&!this.xrActive){try{this.hybridPreview??=new BlackjackPreview(this.hybridHost,action=>this.performHybrid(action));this.hybridPreview.update(this.state.hybrid,this.actorId,this.state.captainId);}catch{/* Text and touch controls remain usable if WebGL is unavailable. */}}
    for(const panel of this.panels){
      panel.body.replaceChildren();panel.status.textContent=this.state?.message??'Connexion aux énigmes…';
      const text=(message:string)=>{const p=document.createElement('p');p.textContent=message;panel.body.append(p);};
      if(!this.model?.puzzles||!this.state||this.state.phase==='unconfigured'){text('Activer une pièce et placer les énigmes depuis l’administration.');continue;}
      const state=this.state;
      const active=state.engine.step.kind==='puzzle'?state.engine.instances.find(i=>state.engine.step.kind==='puzzle'&&i.id===state.engine.step.instanceId):undefined;
      for(const hint of active?.hints??[])text('Indice : '+hint);
      if(!state.running&&state.phase!=='pending'&&state.phase!=='complete'){
        text('Préparation : ajustez les éléments, puis commencez la partie depuis l’administration.');
        if(panel===this.panels[1]&&this.xrActive){
          const select=document.createElement('select');select.setAttribute('aria-label','Élément à déplacer');
          for(const id of PUZZLE_ITEMS){const option=document.createElement('option');option.value=id;option.textContent=ITEM_NAMES[id];select.append(option);}
          const wallOption=document.createElement('option');wallOption.value='panel';wallOption.textContent='Panneau mural des symboles';select.append(wallOption);
          const token=document.createElement('input');token.type='password';token.autocomplete='off';token.placeholder='Jeton administrateur';token.setAttribute('aria-label','Jeton pour le placement');
          const place=document.createElement('button');place.textContent='Placer cet élément au viseur';place.onclick=()=>{void this.movePrepared(select.value as InteractionTarget,token);};
          text('Sélectionnez un élément, visez sa nouvelle position au sol, puis placez-le. Chaque déplacement est enregistré sur le serveur.');panel.body.append(select,token,place);
        }
      }
      if(state.engine.testStartStepId)text('MODE TEST — session temporaire, sans progression pour l’aventure normale.');
      if(state.hybrid){
        if(state.phase==='pending'){text(state.engine.step.title);text(state.message);}
        text(hybridSummary(state.hybrid));text(this.actorId===state.captainId?'Vous êtes le capitaine : Tirer/Rester sont vos décisions.':'Le capitaine décide de Tirer/Rester. Tout le monde peut placer les cartes des manches suivantes.');
        if(this.simulation&&!this.xrActive&&panel===this.panels[0]){const move=document.createElement('button');move.textContent='Aller à la table (test PC)';move.dataset.move='table';move.onclick=()=>{this.virtual={...this.model!.puzzles!.points.table};this.updateButtons();this.map();};panel.body.append(move);}
        if(state.hybrid.round>1)text('Choisissez une carte puis un logement (gâchette ou boutons). Réservation 15 s ; remettre en réserve permet de corriger un choix.');
        for(const option of hybridOptions(state.hybrid,this.actorId,state.captainId)){const button=document.createElement('button');button.textContent=option.label;button.dataset.hybridAction=option.action.action;if('card' in option.action)button.dataset.card=option.action.card;if('slot' in option.action)button.dataset.slot=String(option.action.slot);if('value' in option.action)button.dataset.value=String(option.action.value);button.onclick=()=>this.performHybrid(option.action);panel.body.append(button);this.hybridButtons.push({button,ready:option.enabled});}
      }else if(state.phase==='symbols'){
        text('Le coffre des quatre symboles');text('« Le jour nourrit la forêt. Puis vient la nuit, et ses premières lumières. »');
        text(`Balises découvertes : ${state.symbols.found.length}/4 · combinaison : ${state.symbols.entered.map(id=>SYMBOL_NAMES[id]).join(' → ')||'vide'} · erreurs : ${state.symbols.attempts}`);
        for(const [i,id] of (['sun','tree','moon','star'] as SymbolId[]).entries())this.addAction(panel,state.symbols.found.includes(id)?`${SYMBOL_NAMES[id]} découvert`:`Découvrir la balise ${i+1}`,'discover_symbol',id,id,!state.symbols.found.includes(id));
        text('Au panneau mural, placer les symboles dans les quatre logements, dans l’ordre :');for(const id of ['sun','tree','moon','star'] as SymbolId[])this.addAction(panel,SYMBOL_NAMES[id],'press_symbol',id,'panel',state.symbols.found.length===4);
      }else if(state.phase==='blackjack'){
        text('La table du dernier As');text('« Mon coffre ne s’ouvre ni à vingt, ni à vingt-deux. Faites vingt-et-un… ensemble. »');text('Main de départ : As + 6. Retrouvez les trois cartes ; ajoutez ensuite une seule carte pour faire exactement 21. L’As vaut 11 ou 1.');
        for(const [i,id] of (['four','eight','king'] as CardId[]).entries()){this.addAction(panel,state.blackjack.found.includes(id)?`Carte ${CARD_NAMES[id]} découverte`:`Découvrir l’indice de la carte ${i+1}`,'discover_card',id,id,!state.blackjack.found.includes(id));if(state.blackjack.found.includes(id))text(`${CARD_NAMES[id]} : ${CARD_CLUES[id]}`);}
        text(`Dernier essai : ${state.blackjack.chosen?CARD_NAMES[state.blackjack.chosen]+' → '+state.blackjack.total:'aucun'} · tentatives : ${state.blackjack.attempts}`);
        for(const id of ['four','eight','king'] as CardId[])this.addAction(panel,`Jouer ${CARD_NAMES[id]} à la table`,'choose_card',id,'table',state.blackjack.found.length===3);
      }else if(state.phase==='pending'){text(state.engine.step.title);text('Cette étape est prévue au catalogue mais son module n’est pas encore disponible. La progression acquise est conservée.');}
      else {text('Les énigmes de cette aventure sont réussies. Récompenses : '+state.engine.inventory.map(reward=>reward.label).join(', '));}
      text(this.simulation?'Simulation PC active : positions virtuelles, aucun suivi physique.':'Approchez-vous à moins de 1,3 m. En AR : bouton tactile, ou visez l’élément et utilisez la gâchette.');
    }
    this.updateButtons();this.map();
  }
  private map(){
    const canvas=document.getElementById('adventure-map') as HTMLCanvasElement;canvas.hidden=!this.model?.puzzles;
    if(!this.model?.puzzles||!this.state)return;
    const phase=this.state.phase,visible=this.state.hybrid?['table']:phase==='symbols'?['chest','sun','tree','moon','star']:PUZZLE_ITEMS;
    drawMap(canvas,this.model,visible.map(id=>{const item=id as PuzzleItem;let label=ITEM_NAMES[item];if((['sun','tree','moon','star'] as string[]).includes(id)&&!this.state!.symbols.found.includes(id as SymbolId))label='Balise ?';if((['four','eight','king'] as string[]).includes(id)&&!this.state!.blackjack.found.includes(id as CardId))label='Carte ?';return {point:this.model!.puzzles!.points[item],label};}),this.currentPosition());
  }
}
