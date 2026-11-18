import * as THREE from 'three';
import { toRoom, type makeCalibration } from './calibration';
import { parseFloor,parseRoom,parseLibrary,area,type RoomModel,type RoomLibrary,type Point2 } from '../../server/src/scene-schema.js';
import { createPreview } from './model-view';
type Calibration=ReturnType<typeof makeCalibration>;
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
export class Survey {
  authorize(token:string){this.token=token;}
  private model:RoomModel|null=null;
  private draft:RoomModel|null=null;
  private revision=0;
  private baseRevision=0;
  private token='';
  private firstCorner:Point2|undefined;
  private saving=false;
  private saveMessage='';
  private stage:'none'|'floor'|'ready'|'obstacle'|'opening'='none';
  private wallKey='';
  private edits:('opening'|'obstacle')[]=[];
  private preview=createPreview(el('room-preview'));
  private previewKey='';
  constructor(private getCalibration:()=>Calibration|undefined,private feedback:(message:string)=>void,private changed:()=>void,private activeChanged:()=>void,private report:(event:string,reason:string)=>void=()=>{}) {
    el('survey-new').onclick=()=>this.begin(false);
    el('survey-edit').onclick=()=>this.begin(true);
    el('opening-kind').onchange=()=>{
      const window=el<HTMLSelectElement>('opening-kind').value==='window';
      el<HTMLInputElement>('opening-sill').disabled=!window;
      el<HTMLInputElement>('opening-sill').value=window?'0.9':'0';
      el<HTMLInputElement>('opening-height').value=window?'1.2':'2.1';
    };
    el('survey-opening').onclick=()=>this.addOpening();
    el('survey-opening-aim').onclick=()=>{if(this.stage==='ready'&&!this.saving){this.stage='opening';this.feedback('Visez le sol au pied du centre de l’ouverture, sur le mur choisi.');this.refresh();}};
    el('survey-close').onclick=()=> {
      if(!this.draft||this.saving) return;
      try { this.draft.floor=parseFloor(this.draft.floor);this.stage='ready';this.saveMessage='';this.feedback('Contour fermé. Réglez la hauteur, puis ajoutez les obstacles.');this.refresh(); }
      catch(error){this.saveMessage=String(error);this.feedback(this.saveMessage);this.refresh();}
    };
    el('survey-obstacle').onclick=()=> {
      if(this.stage!=='ready'||this.saving) return;
      this.stage='obstacle';this.firstCorner=undefined;this.feedback('Visez le premier coin de l’empreinte de l’obstacle au sol.');this.refresh();
    };
    el('survey-undo').onclick=()=> {
      if(!this.draft||this.saving) return;
      if(this.stage==='obstacle'||this.stage==='opening') {this.firstCorner=undefined;this.stage='ready';}
      else if(this.stage==='floor') this.draft.floor.pop();
      else if(this.edits.pop()==='opening')this.draft.openings.pop();
      else this.draft.obstacles.pop();
      this.feedback('Dernier élément retiré.');this.refresh();
    };
    el('survey-cancel').onclick=()=>this.cancel();
    el('survey-save').onclick=()=>{void this.save();};
    for(const id of ['survey-name','survey-height']) el(id).onchange=()=> {
      if(!this.draft||this.saving)return;
      this.draft.name=el<HTMLInputElement>('survey-name').value;
      const height=Number(el<HTMLInputElement>('survey-height').value);
      if(height>=0.5&&height<=6)this.draft.height=height;
      else this.feedback('Hauteur des murs : 0,5 à 6 mètres.');
      this.changed();
    };
  }
  get collecting(){return !this.saving&&(this.stage==='floor'||this.stage==='obstacle'||this.stage==='opening');}
  get label(){return this.stage==='opening'?'Placer le centre de l’ouverture':this.stage==='floor'?`Placer le coin ${(this.draft?.floor.length??0)+1}`:this.firstCorner?'Placer le 2e coin de l’obstacle':'Placer le 1er coin de l’obstacle';}
  get instruction(){return this.stage==='opening'?'Ouverture : visez le sol au pied de son centre sur le mur choisi, puis placez le point.':this.stage==='floor'?'Contour : placez les coins dans l’ordre en visant le sol, puis fermez le contour.':this.stage==='obstacle'?'Obstacle : placez deux coins opposés de son empreinte au sol. Le volume est aligné sur les axes A/B.':'Calibrage prêt. Relevez une nouvelle pièce ou modifiez la pièce active.';}
  current(){return this.draft??this.model;}
  closed(){return this.stage!=='floor';}
  pendingCorner(){return this.firstCorner;}
  hasDraft(){return this.draft!==null;}
  importRoom(room:RoomModel){
    if(!this.getCalibration()||this.saving)throw new Error('Terminez le calibrage A/B avant l’import.');
    if(this.draft)throw new Error('Enregistrez ou annulez le brouillon avant un nouvel import.');
    this.draft=parseRoom(room);this.baseRevision=this.revision;this.stage='ready';this.edits=[];this.firstCorner=undefined;this.saveMessage='';
    el<HTMLInputElement>('survey-name').value=room.name;el<HTMLInputElement>('survey-height').value=String(room.height);
    this.refresh();
  }
  saveDraft(){if(this.stage==='ready')void this.save();}
  receive(model:RoomModel|null,revision:number){
    if(revision<this.revision)return;
    const changedId=this.model?.id!==model?.id;
    const ownSave=this.saving&&this.draft?.id===model?.id;
    this.model=model;this.revision=revision;
    if(changedId&&!ownSave)this.activeChanged();
    this.refresh();
  }
  cancel(){
    if(this.saving)return;
    this.draft=null;this.stage='none';this.firstCorner=undefined;this.saveMessage='';
    this.feedback('Relevé annulé. Les pièces déjà enregistrées sont conservées.');this.refresh();
  }
  private begin(edit:boolean){
    if(!this.getCalibration()||this.saving)return;
    this.baseRevision=this.revision;this.saveMessage='';
    this.draft=edit&&this.model?structuredClone(this.model):{id:crypto.randomUUID(),name:'Nouvelle pièce',height:2.5,floor:[],obstacles:[],openings:[]};
    this.draft.openings??=[];this.edits=[];
    this.stage=edit&&this.model?'ready':'floor';this.firstCorner=undefined;
    el<HTMLInputElement>('survey-name').value=this.draft.name;
    el<HTMLInputElement>('survey-height').value=String(this.draft.height);
    this.feedback(edit?'Modification de la pièce active. Retirez ou ajoutez des obstacles, puis enregistrez.':'Placez au moins trois coins au sol, dans l’ordre. La hauteur des murs est à saisir.');
    this.refresh();
  }
  add(local:THREE.Vector3){
    const calibration=this.getCalibration();
    if(!calibration||!this.draft||!this.collecting)return;
    const position=toRoom(local,calibration),p={x:position.x,z:position.z};
    try {
      if(this.stage==='floor') {
        if(this.draft.floor.length>=32)throw new Error('Maximum 32 coins.');
        const last=this.draft.floor.at(-1);
        if(last&&Math.hypot(last.x-p.x,last.z-p.z)<0.15)throw new Error('Coin trop proche du précédent (15 cm minimum).');
        this.draft.floor.push(p);this.feedback(`Coin ${this.draft.floor.length} placé. Continuez dans l’ordre autour de la pièce.`);
      } else if(this.stage==='opening'){
        const wall=Number(el<HTMLSelectElement>('opening-wall').value),a=this.draft.floor[wall],b=this.draft.floor[(wall+1)%this.draft.floor.length];
        const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
        if(Math.abs((p.x-a.x)*dz-(p.z-a.z)*dx)/length>0.5)throw new Error('Visez le sol au pied du mur choisi (50 cm maximum).');
        this.addOpening(((p.x-a.x)*dx+(p.z-a.z)*dz)/length-Number(el<HTMLInputElement>('opening-width').value)/2);
      } else if(!this.firstCorner){this.firstCorner=p;this.feedback('Premier coin placé. Visez le coin opposé au sol.');}
      else {
        const a=this.firstCorner;
        const obstacle={name:el<HTMLInputElement>('obstacle-name').value||`Obstacle ${this.draft.obstacles.length+1}`,x:(a.x+p.x)/2,z:(a.z+p.z)/2,width:Math.abs(p.x-a.x),depth:Math.abs(p.z-a.z),height:Number(el<HTMLInputElement>('obstacle-height').value)};
        parseRoom({...this.draft,obstacles:[...this.draft.obstacles,obstacle]});
        this.draft.obstacles.push(obstacle);this.edits.push('obstacle');this.firstCorner=undefined;this.stage='ready';this.feedback(`${obstacle.name} ajouté. Vous pouvez en ajouter un autre ou enregistrer.`);
      }
      this.refresh();
    }catch(error){this.feedback(String(error));}
  }
  private addOpening(offset?:number){
    if(!this.draft||this.saving||(this.stage!=='ready'&&this.stage!=='opening'))return;
    try{
      const kind=el<HTMLSelectElement>('opening-kind').value;
      const opening={name:el<HTMLInputElement>('opening-name').value||(kind==='door'?'Porte':'Fenêtre'),kind,wall:Number(el<HTMLSelectElement>('opening-wall').value),offset:offset??Number(el<HTMLInputElement>('opening-offset').value),width:Number(el<HTMLInputElement>('opening-width').value),height:Number(el<HTMLInputElement>('opening-height').value),sill:kind==='door'?0:Number(el<HTMLInputElement>('opening-sill').value)};
      const validated=parseRoom({...this.draft,openings:[...this.draft.openings,opening]});
      this.draft.openings=validated.openings;this.edits.push('opening');this.stage='ready';
      el<HTMLInputElement>('opening-offset').value=String(opening.offset);
      this.feedback(`${opening.name} ajoutée. Enregistrez pour conserver la découpe du mur.`);this.refresh();
    }catch(error){this.feedback(String(error));}
  }
  refresh(){
    el('survey-panel').hidden=!this.getCalibration();
    el('survey-settings').hidden=!this.draft;
    el<HTMLButtonElement>('survey-edit').disabled=!this.model||this.saving;
    for(const id of ['survey-new','survey-cancel','survey-undo'])el<HTMLButtonElement>(id).disabled=this.saving;
    el<HTMLButtonElement>('survey-close').disabled=this.stage!=='floor'||(this.draft?.floor.length??0)<3||this.saving;
    el<HTMLButtonElement>('survey-obstacle').disabled=this.stage!=='ready'||this.saving;
    el<HTMLButtonElement>('survey-save').disabled=this.stage!=='ready'||this.saving;
    const saveReason=this.saving?'Enregistrement sur le serveur…':this.stage==='floor'?'Fermez le contour (au moins trois coins) avant d’enregistrer.':this.stage==='obstacle'?'Terminez les deux coins de l’obstacle, ou annulez cet ajout.':this.stage==='opening'?'Placez le centre de l’ouverture, ou annulez cet ajout.':this.draft?'Prêt à enregistrer. Un jeton administrateur valide est requis.':'';
    el('survey-save-status').textContent=this.saveMessage||saveReason;
    for(const id of ['survey-opening','survey-opening-aim'])el<HTMLButtonElement>(id).disabled=this.stage!=='ready'||this.saving;
    const wallKey=JSON.stringify(this.draft?.floor);
    if(wallKey!==this.wallKey){
      this.wallKey=wallKey;const select=el<HTMLSelectElement>('opening-wall');select.replaceChildren();
      this.draft?.floor.forEach((a,i,points)=>{const b=points[(i+1)%points.length],option=document.createElement('option');option.value=String(i);option.textContent=`Mur ${i+1} · coin ${i+1} → ${(i+1)%points.length+1} · ${Math.hypot(b.x-a.x,b.z-a.z).toFixed(2)} m`;select.append(option);});
    }
    const list=el('opening-list');list.replaceChildren();
    this.draft?.openings.forEach((opening,i)=>{
      const item=document.createElement('li'),remove=document.createElement('button');
      item.textContent=`${opening.name} · mur ${opening.wall+1} · ${opening.width} × ${opening.height} m · bas ${opening.sill} m `;
      remove.textContent='Retirer';remove.disabled=this.stage!=='ready'||this.saving;
      remove.onclick=()=>{if(!this.draft||this.stage!=='ready'||this.saving)return;this.draft.openings.splice(i,1);this.edits=this.edits.filter(kind=>kind!=='opening');this.refresh();};
      item.append(remove);list.append(item);
    });
    const current=this.current();
    const summary=current?`${current.name} · ${current.floor.length} coins · ${current.obstacles.length} obstacles · ${(current.openings??[]).length} ouvertures · murs ${current.height} m${this.closed()&&current.floor.length>=3?` · ${area(current.floor).toFixed(1)} m²`:''}`:'Aucune pièce active. Calibrez A/B, puis relevez une pièce en AR.';
    el('survey-summary').textContent=summary;
    el('room-summary').textContent=summary+(this.draft?' · brouillon non enregistré':'');
    const key=JSON.stringify(this.model);
    if(key!==this.previewKey){this.previewKey=key;this.preview(this.model);}
    this.changed();
  }
  private async save(){
    if(!this.draft||this.saving)return;
    this.report('survey_save_requested',`Étape : ${this.stage}`);
    this.saveMessage='';
    try{
      if(this.stage!=='ready')throw new Error('Terminez le contour ou l’élément en cours avant d’enregistrer.');
      const room=parseRoom({...this.draft,name:el<HTMLInputElement>('survey-name').value,height:Number(el<HTMLInputElement>('survey-height').value)});
      const field=el<HTMLInputElement>('room-admin-token'),arField=el<HTMLInputElement>('survey-admin-token');
      if(arField.value||field.value){this.token=arField.value||field.value;field.value='';arField.value='';}
      if(this.token.length<16){el<HTMLDetailsElement>('survey-auth').open=true;throw new Error('Jeton administrateur manquant ou trop court : saisissez admin_token dans « Autorisation d’enregistrement », puis réessayez. Le brouillon est conservé.');}
      this.saving=true;this.feedback('Enregistrement sur le serveur…');this.refresh();
      const response=await fetch('/api/admin/rooms/save',{method:'POST',headers:{Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'},body:JSON.stringify({revision:this.baseRevision,room}),signal:AbortSignal.timeout(10000)});
      const result=await response.json().catch(()=>({error:`Réponse non JSON du serveur (HTTP ${response.status}). Vérifiez le proxy HTTPS.`})) as {library?:RoomLibrary;error?:string};
      if(!response.ok||!result?.library){if(response.status===401){this.token='';el<HTMLDetailsElement>('survey-auth').open=true;}throw new Error(result?.error??'Enregistrement impossible : réponse serveur invalide.');}
      const library=parseLibrary(result.library);
      if(!library.rooms.some(item=>item.id===room.id))throw new Error('La réponse du serveur ne confirme pas cette pièce. Vérifiez la bibliothèque admin avant de réessayer.');
      this.draft=null;this.stage='none';
      if(library.revision>=this.revision){this.model=library.rooms.find(r=>r.id===library.activeId)??null;this.revision=library.revision;}
      this.feedback(this.model?.id===room.id?'Pièce enregistrée sur disque et activée. Elle sera conservée après redémarrage du serveur.':'Pièce enregistrée sur disque. Une autre pièce a été activée entre-temps ; refaites le calibrage pour celle-ci.');
      this.saveMessage='Pièce enregistrée sur le serveur.';this.report('survey_save_succeeded','Écriture confirmée par le serveur.');
    }catch(error){
      this.saveMessage=error instanceof Error?error.message:String(error);
      if(error instanceof Error&&(error.name==='TimeoutError'||error.name==='AbortError'))this.saveMessage='Délai dépassé. Vérifiez la bibliothèque admin avant de réessayer : la sauvegarde peut avoir été reçue. Brouillon conservé.';
      else if(error instanceof TypeError)this.saveMessage='Serveur injoignable. Vérifiez le réseau et le proxy HTTPS. Brouillon conservé.';
      this.feedback(this.saveMessage);this.report('survey_save_failed',this.saveMessage);el('survey-save-status').textContent=this.saveMessage;
    }
    finally{this.saving=false;this.refresh();}
  }
}
