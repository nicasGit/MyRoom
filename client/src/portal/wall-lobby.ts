import { OBJECT_CATALOG } from '../../../server/src/object-library.js';
import type { RoomLibrary } from '../../../server/src/scene-schema.js';
import { TEAM_LEON, randomPlayerNames } from '../../../server/src/player-name-presets.js';
import * as THREE from 'three';
import type { PortalPublic } from '../../../server/src/portal/portal-types.js';
import type { AdventureState } from '../../../server/src/adventure.js';
import type { RoomModel } from '../../../server/src/scene-schema.js';
import { WallMenuView,type MenuButton } from './wall-menu-view';
type Lobby={adventures:{id:string;version:string;title:string}[];names:string[];namesRevision:number};
type AdminState={library:RoomLibrary;portal:PortalPublic;adventure:AdventureState;playerNames:string[];playerNamesRevision:number};
export class WallLobby {
  readonly view=new WallMenuView();roomMode=false;
  placed=false;
  private debug=false;private model:RoomModel|null=null;private objectId='';
  setDebug(value:boolean){if(value===this.debug)return;this.debug=value;if(value){this.auth.hidden=true;this.input.value='';}this.draw(true);}
  interactionNotice(text:string){if(this.notice===text)return;this.notice=text;this.draw(true);}
  private portal?:PortalPublic;private adventure?:AdventureState;private lobby?:Lobby;
  private tab='home';private notice='';private token='';private busy=false;private polling=false;private page=0;
  private editing=0;private name='';private key='';private nextPoll=0;
  private auth=document.createElement('form');private input=document.createElement('input');
  constructor(private notify:(text:string)=>void,private mode:(editing:boolean)=>void,private authorized:(token:string)=>void){
    this.auth.hidden=true;this.auth.dataset.lobbyAuth='';this.input.type='password';this.input.autocomplete='off';this.input.placeholder='Jeton organisateur (admin_token)';
    this.input.setAttribute('aria-label','Jeton organisateur');const submit=document.createElement('button');submit.textContent='Déverrouiller le menu mural';
    const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Fermer';cancel.onclick=()=>{this.auth.hidden=true;this.input.value='';};
    this.auth.append(this.input,submit,cancel);document.getElementById('xr-feedback')!.before(this.auth);
    this.auth.onsubmit=event=>{event.preventDefault();this.token=this.input.value.trim();this.input.value='';void this.authorize();};
    const unlock=document.createElement('button');unlock.type='button';unlock.textContent='Organisateur';unlock.onclick=()=>this.openAuth();
    document.getElementById('xr-exit')!.before(unlock);
    const rooms=document.createElement('button');rooms.textContent='Mode pièces';rooms.onclick=()=>this.setRoomMode(!this.roomMode);document.getElementById('xr-exit')!.before(rooms);
    const desktopUnlock=document.createElement('button');desktopUnlock.textContent='Autoriser organisateur avant AR';desktopUnlock.onclick=()=>this.openAuth();document.getElementById('enter')!.after(desktopUnlock);
    const preview=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Aperçu du menu mural (PC / tactile)';preview.append(summary,this.view.canvas);document.querySelector('main')!.append(preview);
    this.view.canvas.setAttribute('aria-label','Menu mural MyRoom');this.view.canvas.onclick=event=>{const box=this.view.canvas.getBoundingClientRect();const id=this.view.atUV((event.clientX-box.left)/box.width,1-(event.clientY-box.top)/box.height);if(id)void this.act(id);};
  }
  private openAuth(){if(this.debug){this.interactionNotice('Debug actif : aucun jeton requis.');return;}if(document.getElementById('xr-overlay')!.hidden)document.getElementById('enter')!.before(this.auth);else document.getElementById('xr-feedback')!.before(this.auth);this.auth.hidden=false;this.input.focus();}
  private async request(path:string,body?:unknown){
    const response=await fetch('/api/admin/'+path,{method:body===undefined?'GET':'POST',headers:{Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(8000)});
    const data=await response.json();if(!response.ok){if(response.status===401){this.token='';this.authorized('');this.notice='Autorisation expirée : déverrouillez le menu.';}throw Error(data.error??`HTTP ${response.status}`);}return data;
  }
  private async authorize(){try{await this.request('state');this.authorized(this.token);this.auth.hidden=true;this.notice='Organisateur autorisé sur cet appareil.';}catch(error){this.token='';this.authorized('');this.notice=String(error);}this.draw(true);}
  receive(model:RoomModel|null,portal:PortalPublic,adventure:AdventureState,lobby:Lobby){
    this.model=model;this.portal=portal;this.adventure=adventure;this.lobby=lobby;
    this.placed=!!model&&this.view.place(model);this.view.group.visible=this.placed;this.draw();
  }
  setRoomMode(value:boolean){if(value&&(this.portal?.active||this.adventure?.running)){this.notice='Arrêtez la session avant de relever la pièce.';this.draw(true);return;}
    if(!value&&document.getElementById('survey-settings')&&!document.getElementById('survey-settings')!.hidden){this.notice='Enregistrez ou annulez le brouillon avant de revenir au jeu.';this.draw(true);return;}
    this.roomMode=value;this.mode(value);this.draw(true);
  }
  tick(now:number){if((!this.token&&!this.debug)||this.polling||now<this.nextPoll)return;this.nextPoll=now+2000;this.polling=true;
    void this.request('state').then((state:AdminState)=>{this.portal=state.portal;this.adventure=state.adventure;this.model=state.library.rooms.find(room=>room.id===state.library.activeId)??null;if(this.lobby){this.lobby.names=state.playerNames;this.lobby.namesRevision=state.playerNamesRevision;}this.draw();}).catch(error=>{this.notice=String(error);this.draw();}).finally(()=>{this.polling=false;});
  }
  pick(origin:THREE.Vector3,direction:THREE.Vector3){if(!this.view.group.visible)return false;const id=this.view.pick(origin,direction);if(!id)return false;void this.act(id);return true;}
  private draw(force=false){
    const p=this.portal,a=this.adventure,l=this.lobby;if(!p||!a||!l)return;
    const key=JSON.stringify([p.revision,p.players,a.revision,l,this.tab,this.page,this.name,this.notice,this.busy,!!this.token,this.roomMode,this.debug,this.model?.objects,this.objectId]);if(!force&&key===this.key)return;this.key=key;
    const selected=l.adventures.find(item=>item.id===a.engine.adventureId&&item.version===a.engine.adventureVersion);
    const lines=[selected?.title??a.engine.adventureId,`${p.players.filter(x=>x.present).length}/${p.config.playerCount??4} présents · ${p.players.filter(x=>x.crossed).length} passages · ${p.phase}`,this.debug?'DEBUG : droits administrateur pour tous':this.token?'Organisateur connecté':'Lecture seule · déverrouiller pour modifier',this.notice||(!p.active?'Démarrez le rituel avant de prendre votre bâton.':'Approchez votre bâton : poignée, pince ou gâchette.')];
    const buttons:MenuButton[]=[{id:'home',title:'Accueil'},{id:'adventures',title:'Aventures'},{id:'settings',title:'Paramètres'},{id:'rooms',title:this.roomMode?'Mode pièces actif':'Mode création de pièces'}];
    if(this.tab==='home')buttons.push({id:'start',title:'Commencer le rituel'},{id:'stop',title:'Arrêter la session'},{id:'reset-adventure',title:'Réinitialiser l’aventure'},{id:'unlock',title:this.token?'Verrouiller':'Déverrouiller organisateur'},{id:'confirm',title:'Valider mon passage accessible'});
    if(this.tab==='home')buttons.push({id:'library',title:'Biblioth\u00e8que d\u2019objets'});
    if(this.tab==='reset'){lines[0]='Effacer la progression et les récompenses ?';lines[1]='Pièce, repères et placements conservés.';buttons.splice(0,buttons.length,{id:'confirm-reset',title:'Oui, réinitialiser'},{id:'home',title:'Annuler'});}
    if(this.tab==='adventures'){
      l.adventures.slice(this.page*4,this.page*4+4).forEach((item,i)=>buttons.push({id:`adventure:${this.page*4+i}`,title:`${item.title} ${item.version}`}));
      buttons.push({id:'prev',title:'Page précédente'},{id:'next',title:'Page suivante'});
    }
    if(this.tab==='settings'){
      lines[0]=`Groupe : ${p.config.playerCount??4} joueur(s)`;
      buttons.push({id:'less',title:'Moins de joueurs'},{id:'more',title:'Plus de joueurs'});
      buttons.push({id:'team-leon',title:'Team Léon'},{id:'random-names',title:'Noms aléatoires'});
      l.names.forEach((name,i)=>buttons.push({id:`name:${i}`,title:`${i+1}. ${name}`}));
      buttons.push({id:'fit-portal',title:'Centrer le vortex'},{id:'verify-space',title:p.config.confirmed?'Passage vérifié : oui':'Confirmer espace physique'});
    }
    if(this.tab==='library'){
      lines[0]='Bibliothèque CC0 - préparation hors partie';
      for(const asset of OBJECT_CATALOG.assets)buttons.push({id:'library-add:'+asset.id,title:'Ajouter '+asset.name});
      buttons.push({id:'library-placed',title:'Objets de la pièce'},{id:'library-save',title:'Enregistrer les placements'});
    }
    if(this.tab==='library-placed'){
      const items=this.model?.objects?.items??[];lines[0]=items.length+'/32 objets dans la pièce';
      items.slice(this.page*4,this.page*4+4).forEach(item=>buttons.push({id:'library-select:'+item.id,title:item.name}));
      buttons.push({id:'library-prev',title:'Page précédente'},{id:'library-next',title:'Page suivante'},{id:'library',title:'Ajouter un objet'},{id:'library-save',title:'Enregistrer les placements'});
    }
    if(this.tab==='library-delete'){lines[0]='Supprimer cet objet de la pi\u00e8ce ?';buttons.splice(0,buttons.length,{id:'library-confirm-delete',title:'Oui, supprimer'},{id:'library-cancel-delete',title:'Annuler'});}
    if(this.tab==='library-object'){
      const item=this.model?.objects?.items.find(item=>item.id===this.objectId);
      lines[0]=item?item.name+' - '+(item.movable?'manipulable':'fixe'):'Objet supprimé';
      lines[1]='Prendre pour déplacer ; deux mains pour les meubles.';
      lines[2]='Écarter les mains pour changer la taille du meuble.';
      for(const [id,title] of [['smaller','Réduire 10 %'],['bigger','Agrandir 10 %'],['left','Tourner -15 degrés'],['right','Tourner +15 degrés'],['fixed',item?.movable?'Rendre fixe':'Rendre manipulable'],['delete','Supprimer cet objet']])buttons.push({id:'library-'+id,title,disabled:!item});
      buttons.push({id:'library-placed',title:'Liste des objets'},{id:'library-save',title:'Enregistrer les placements'});
    }
    if(this.tab==='rooms')buttons.push({id:'edit-mode',title:this.roomMode?'Revenir au jeu':'Ouvrir les outils de pièce'},{id:'new-room',title:'Nouvelle pièce'},{id:'edit-room',title:'Modifier la pièce active'},{id:'save-room',title:'Enregistrer la pièce'},{id:'cancel-room',title:'Annuler le brouillon'},{id:'import-room',title:'Importer les plans Quest'});
    if(this.tab==='keyboard'){
      lines[0]=`Nom place ${this.editing+1} : ${this.name}`;buttons.length=0;
      for(const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')buttons.push({id:`letter:${letter}`,title:letter});
      buttons.push({id:'space',title:'Espace'},{id:'erase',title:'Effacer'},{id:'save-name',title:'Valider'},{id:'settings',title:'Annuler'});
    }
    this.view.draw('MyRoom · '+(this.roomMode?'Création de pièces':'Team Portal'),lines,buttons);
  }
  private async act(id:string){
    if(this.busy)return;
    if(['home','adventures','settings','rooms','library','library-placed'].includes(id)){this.tab=id;this.draw(true);return;}
    if(id==='unlock'){if(this.debug){this.notice='Debug actif : accès ouvert sans jeton.';}else if(this.token){this.token='';this.authorized('');this.notice='Menu verrouillé.';}else{this.notice='Jeton requis ; autorisation avant AR si clavier indisponible.';this.openAuth();}this.draw(true);return;}
    if(id==='prev'||id==='next'){this.page=Math.max(0,Math.min(Math.ceil((this.lobby?.adventures.length??0)/4)-1,this.page+(id==='next'?1:-1)));this.draw(true);return;}
    if(id==='confirm'){document.dispatchEvent(new Event('myroom-portal-confirm'));return;}
    if(id==='edit-mode'){this.setRoomMode(!this.roomMode);return;}
    if(id.endsWith('-room')){
      if(this.portal?.active||this.adventure?.running){this.notice='Arrêtez la session avant de relever la pièce.';this.draw(true);return;}
      this.setRoomMode(true);const target:Record<string,string>={'new-room':'survey-new','edit-room':'survey-edit','save-room':'survey-save','cancel-room':'survey-cancel','import-room':'quest-import'};
      document.getElementById(target[id])?.click();return;
    }
    if(!this.token&&!this.debug){this.notice='Menu verrouillé : utilisez Déverrouiller organisateur avant AR.';this.draw(true);return;}
    if(id==='library-prev'||id==='library-next'){this.page=Math.max(0,Math.min(Math.max(0,Math.ceil((this.model?.objects?.items.length??0)/4)-1),this.page+(id==='library-next'?1:-1)));this.draw(true);return;}
    if(id.startsWith('library-select:')){this.objectId=id.slice(15);this.tab='library-object';this.draw(true);return;}
    if(id==='library-delete'){this.tab='library-delete';this.draw(true);return;}
    if(id==='library-cancel-delete'){this.tab='library-object';this.draw(true);return;}
    if(id==='reset-adventure'){this.tab='reset';this.draw(true);return;}
    if(id.startsWith('name:')){this.editing=Number(id.slice(5));this.name=this.lobby?.names[this.editing]??'';this.tab='keyboard';this.draw(true);return;}
    if(id.startsWith('letter:')||id==='space'||id==='erase'){this.name=id==='erase'?this.name.slice(0,-1):(this.name+(id==='space'?' ':id.slice(7))).slice(0,40);this.draw(true);return;}
    this.busy=true;this.notice='Commande en cours…';this.draw(true);
    try{
      const state=await this.request('state') as AdminState;
      if(id.startsWith('library-')){
        const model=state.library.rooms.find(room=>room.id===state.library.activeId);if(!model)throw Error('Activez une pièce enregistrée.');
        const objects=state.adventure.objects;if(!objects)throw Error('Objets indisponibles.');
        const base={revision:state.library.revision,objectRevision:objects.revision};
        if(id.startsWith('library-add:'))await this.request('rooms/objects',{...base,action:'add',asset:id.slice(12)});
        else if(id==='library-save')await this.request('rooms/objects',{...base,action:'save'});
        else{
          const item=structuredClone(model.objects?.items.find(item=>item.id===this.objectId));if(!item)throw Error('Objet absent.');
          const live=objects.poses[`prop:${item.id}`];if(live)item.pose={...live,scale:live.scale??1};
          if(id==='library-confirm-delete'){await this.request('rooms/objects',{...base,action:'remove',id:item.id});this.tab='library-placed';}
          else {
          if(id==='library-fixed')item.movable=!item.movable;
          else if(id==='library-smaller'||id==='library-bigger')item.pose.scale=Math.max(.1,Math.min(3,item.pose.scale*(id==='library-bigger'?1.1:1/1.1)));
          else if(id==='library-left'||id==='library-right'){const yaw=item.pose.yaw+(id==='library-right'?1:-1)*Math.PI/12;item.pose.yaw=Math.atan2(Math.sin(yaw),Math.cos(yaw));}
          await this.request('rooms/objects',{...base,action:'update',object:item});}
        }
      }
      else if(id==='start'){if(this.roomMode)throw Error('Quittez le mode pièces avant de démarrer.');await this.request('adventure/start',{});}
      else if(id==='fit-portal')await this.request('portal',{action:'auto-place',revision:state.portal.revision});
      else if(id==='stop')await this.request('adventure/stop',{});
      else if(id==='confirm-reset'){await this.request('adventure/reset',{});this.tab='home';}
      else if(id==='less'||id==='more'||id==='verify-space'){
        const config=structuredClone(state.portal.config);if(id==='verify-space')config.confirmed=!config.confirmed;
        else config.playerCount=Math.max(1,Math.min(4,(config.playerCount??4)+(id==='more'?1:-1)));
        await this.request('portal',{action:'configure',revision:state.portal.revision,config});
      }else if(id.startsWith('adventure:')){const item=this.lobby!.adventures[Number(id.slice(10))];await this.request('adventure/select',{id:item.id,version:item.version,revision:state.adventure.revision});}
      else if(id==='team-leon'||id==='random-names'){await this.request('players/names',{names:id==='team-leon'?[...TEAM_LEON]:randomPlayerNames(),revision:state.playerNamesRevision});}
      else if(id==='save-name'){const names=[...state.playerNames];names[this.editing]=this.name;await this.request('players/names',{names,revision:state.playerNamesRevision});this.tab='settings';}
      this.notice='Réglage appliqué.';this.nextPoll=0;
    }catch(error){this.notice=String(error);this.notify(this.notice);}finally{this.busy=false;this.draw(true);}
  }
}
