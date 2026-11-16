import * as THREE from 'three';
import { toRoom, type makeCalibration } from './calibration';
import { parseFloor,parseRoom,area,type RoomModel,type RoomLibrary,type Point2 } from '../../server/src/scene-schema.js';
import { createPreview } from './model-view';
type Calibration=ReturnType<typeof makeCalibration>;
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
export class Survey {
  private model:RoomModel|null=null;
  private draft:RoomModel|null=null;
  private revision=0;
  private baseRevision=0;
  private token='';
  private firstCorner:Point2|undefined;
  private saving=false;
  private stage:'none'|'floor'|'ready'|'obstacle'='none';
  private preview=createPreview(el('room-preview'));
  private previewKey='';
  constructor(private getCalibration:()=>Calibration|undefined,private feedback:(message:string)=>void,private changed:()=>void,private activeChanged:()=>void) {
    el('survey-new').onclick=()=>this.begin(false);
    el('survey-edit').onclick=()=>this.begin(true);
    el('survey-close').onclick=()=> {
      if(!this.draft||this.saving) return;
      try { this.draft.floor=parseFloor(this.draft.floor);this.stage='ready';this.feedback('Contour fermé. Réglez la hauteur, puis ajoutez les obstacles.');this.refresh(); }
      catch(error){this.feedback(String(error));}
    };
    el('survey-obstacle').onclick=()=> {
      if(this.stage!=='ready'||this.saving) return;
      this.stage='obstacle';this.firstCorner=undefined;this.feedback('Visez le premier coin de l’empreinte de l’obstacle au sol.');this.refresh();
    };
    el('survey-undo').onclick=()=> {
      if(!this.draft||this.saving) return;
      if(this.stage==='obstacle') {this.firstCorner=undefined;this.stage='ready';}
      else if(this.stage==='floor') this.draft.floor.pop();
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
  get collecting(){return !this.saving&&(this.stage==='floor'||this.stage==='obstacle');}
  get label(){return this.stage==='floor'?`Placer le coin ${(this.draft?.floor.length??0)+1}`:this.firstCorner?'Placer le 2e coin de l’obstacle':'Placer le 1er coin de l’obstacle';}
  get instruction(){return this.stage==='floor'?'Contour : placez les coins dans l’ordre en visant le sol, puis fermez le contour.':this.stage==='obstacle'?'Obstacle : placez deux coins opposés de son empreinte au sol. Le volume est aligné sur les axes A/B.':'Calibrage prêt. Relevez une nouvelle pièce ou modifiez la pièce active.';}
  current(){return this.draft??this.model;}
  closed(){return this.stage!=='floor';}
  pendingCorner(){return this.firstCorner;}
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
    this.draft=null;this.stage='none';this.firstCorner=undefined;
    this.feedback('Relevé annulé. Les pièces déjà enregistrées sont conservées.');this.refresh();
  }
  private begin(edit:boolean){
    if(!this.getCalibration()||this.saving)return;
    this.baseRevision=this.revision;
    this.draft=edit&&this.model?structuredClone(this.model):{id:crypto.randomUUID(),name:'Nouvelle pièce',height:2.5,floor:[],obstacles:[]};
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
      } else if(!this.firstCorner){this.firstCorner=p;this.feedback('Premier coin placé. Visez le coin opposé au sol.');}
      else {
        const a=this.firstCorner;
        const obstacle={name:el<HTMLInputElement>('obstacle-name').value||`Obstacle ${this.draft.obstacles.length+1}`,x:(a.x+p.x)/2,z:(a.z+p.z)/2,width:Math.abs(p.x-a.x),depth:Math.abs(p.z-a.z),height:Number(el<HTMLInputElement>('obstacle-height').value)};
        parseRoom({...this.draft,obstacles:[...this.draft.obstacles,obstacle]});
        this.draft.obstacles.push(obstacle);this.firstCorner=undefined;this.stage='ready';this.feedback(`${obstacle.name} ajouté. Vous pouvez en ajouter un autre ou enregistrer.`);
      }
      this.refresh();
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
    const current=this.current();
    const summary=current?`${current.name} · ${current.floor.length} coins · ${current.obstacles.length} obstacles · murs ${current.height} m${this.closed()&&current.floor.length>=3?` · ${area(current.floor).toFixed(1)} m²`:''}`:'Aucune pièce active. Calibrez A/B, puis relevez une pièce en AR.';
    el('survey-summary').textContent=summary;
    el('room-summary').textContent=summary+(this.draft?' · brouillon non enregistré':'');
    const key=JSON.stringify(this.model);
    if(key!==this.previewKey){this.previewKey=key;this.preview(this.model);}
    this.changed();
  }
  private async save(){
    if(!this.draft||this.saving)return;
    try{
      const room=parseRoom({...this.draft,name:el<HTMLInputElement>('survey-name').value,height:Number(el<HTMLInputElement>('survey-height').value)});
      const field=el<HTMLInputElement>('room-admin-token');
      if(field.value){this.token=field.value;field.value='';}
      if(this.token.length<16)throw new Error('Renseignez le jeton administrateur sur la page avant de démarrer l’AR. Le brouillon reste disponible pendant cette session.');
      this.saving=true;this.feedback('Enregistrement sur le serveur…');this.refresh();
      const response=await fetch('/api/admin/rooms/save',{method:'POST',headers:{Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'},body:JSON.stringify({revision:this.baseRevision,room}),signal:AbortSignal.timeout(10000)});
      const result=await response.json() as {library?:RoomLibrary;error?:string};
      if(!response.ok||!result.library){if(response.status===401)this.token='';throw new Error(result.error??'Enregistrement impossible.');}
      this.draft=null;this.stage='none';
      if(result.library.revision>=this.revision){this.model=result.library.rooms.find(r=>r.id===result.library!.activeId)??null;this.revision=result.library.revision;}
      this.feedback(this.model?.id===room.id?'Pièce enregistrée sur disque et activée. Elle sera conservée après redémarrage du serveur.':'Pièce enregistrée sur disque. Une autre pièce a été activée entre-temps ; refaites le calibrage pour celle-ci.');
    }catch(error){this.feedback(String(error));}
    finally{this.saving=false;this.refresh();}
  }
}
