import { OBJECT_CATALOG,type RoomObject } from '../../../server/src/object-library.js';
import type { RoomModel } from '../../../server/src/scene-schema.js';
import type { ObjectSnapshot } from '../../../server/src/object-manipulation.js';
import { catalogPreviews } from './catalog-previews';

const button=(title:string,click:()=>void)=>{const node=document.createElement('button');node.type='button';node.textContent=title;node.onclick=click;return node;};
export class LibraryAdmin {
  readonly root=document.createElement('section');
  private summary=document.createElement('p');private catalogue=document.createElement('div');
  private select=document.createElement('select');private form=document.createElement('form');private message=document.createElement('p');
  private model:RoomModel|null=null;private revision=0;private objects?:ObjectSnapshot;private blocked=true;private busy=false;private dirty=false;private key='';
  private buttons:HTMLButtonElement[]=[];
  constructor(parent:HTMLElement,private request:(body:unknown)=>Promise<unknown>,private changed:()=>Promise<void>){
    this.root.className='panel';this.root.id='object-library';const title=document.createElement('h2');title.textContent='Bibliothèque d’objets';
    const help=document.createElement('p');help.textContent='Préparation hors partie. Ajoutez un objet, réglez sa position, sa taille et le mode fixe/manipulable. En jeu, les meubles se prennent à deux mains ; écartez-les pour ajuster la taille. Enregistrez les déplacements avant de quitter.';
    const credit=document.createElement('a');credit.href=OBJECT_CATALOG.source;credit.target='_blank';credit.rel='noopener';credit.textContent='Modèles Kenney — Furniture Kit 2.0 — CC0';
    this.catalogue.className='players';
    const previews:{asset:string;image:HTMLImageElement;status:HTMLElement}[]=[];
    for(const asset of OBJECT_CATALOG.assets){const card=document.createElement('article');card.className='player';const name=document.createElement('h3');name.textContent=asset.name;const info=document.createElement('p');info.textContent=`${asset.category} · ${asset.hands} main(s) · hauteur ${asset.size.height} m`;
      const image=document.createElement('img'),status=document.createElement('p');image.className='library-thumbnail';image.alt=`Aperçu 3D : ${asset.name}`;image.width=360;image.height=240;image.hidden=true;status.textContent='Chargement de l’aperçu…';card.append(image,status);previews.push({asset:asset.id,image,status});
      const add=button('Ajouter',()=>void this.command({action:'add',asset:asset.id}));add.dataset.asset=asset.id;this.buttons.push(add);card.append(name,info,add);this.catalogue.append(card);}
    catalogPreviews(this.catalogue,previews);
    this.select.setAttribute('aria-label','Objet à modifier');this.select.onchange=()=>{this.dirty=false;this.drawForm();};this.form.oninput=()=>{this.dirty=true;};
    const save=button('Enregistrer les objets déplacés',()=>void this.command({action:'save'}));save.id='library-save-placements';this.buttons.push(save);
    const reload=button('Recharger les réglages',()=>{this.dirty=false;this.key='';this.receive(this.model,this.revision,this.objects,this.blocked);});
    this.message.setAttribute('role','status');this.root.append(title,help,credit,this.summary,this.catalogue,this.select,this.form,save,reload,this.message);parent.append(this.root);
    const shortcut=document.createElement('a');shortcut.className='library-shortcut';shortcut.href='#object-library';shortcut.textContent='Voir la bibliothèque d’objets ↓';parent.prepend(shortcut);
  }
  receive(model:RoomModel|null,revision:number,objects:ObjectSnapshot|undefined,blocked:boolean){
    this.model=model;this.revision=revision;this.objects=objects;this.blocked=blocked||!objects||objects.held.length>0||!model;
    this.summary.textContent=!model?'Activez une pièce enregistrée.':`${model.name} · ${model.objects?.items.length??0}/32 objets${this.blocked?' · Arrêtez la session et relâchez les objets pour modifier.':''}`;
    const key=JSON.stringify([model,objects?.poses]);
    if(key!==this.key){this.key=key;if(!this.dirty){const current=this.select.value;this.select.replaceChildren();for(const item of model?.objects?.items??[]){const option=document.createElement('option');option.value=item.id;option.textContent=item.name;this.select.append(option);}if(Array.from(this.select.options).some(option=>option.value===current))this.select.value=current;this.drawForm();}}
    this.disable();
  }
  private disable(){for(const node of [...this.buttons,...Array.from(this.form.querySelectorAll('button'))])node.disabled=this.blocked||this.busy;this.select.disabled=this.busy;}
  private drawForm(){
    this.form.replaceChildren();const item=this.model?.objects?.items.find(item=>item.id===this.select.value);if(!item||!this.objects)return;
    const base=structuredClone(item),live=this.objects.poses[`prop:${item.id}`];if(live)base.pose={...live,scale:live.scale??1};
    const revision=this.revision,objectRevision=this.objects.revision;
    const inputs=new Map<string,HTMLInputElement>();
    const field=(key:string,title:string,value:string,type='number',min?:string,max?:string)=>{
      const label=document.createElement('label'),input=document.createElement('input');label.textContent=title+' ';input.type=type;input.value=value;input.required=true;input.name=key;
      if(type==='number'){input.step='0.01';if(min)input.min=min;if(max)input.max=max;}else input.maxLength=64;
      inputs.set(key,input);label.append(input);this.form.append(label);return input;
    };
    field('name','Nom',base.name,'text');for(const axis of ['x','y','z'] as const)field(axis,axis.toUpperCase()+' (m)',String(base.pose[axis]),'number',axis==='y'?'0':'-30','30');
    field('yaw','Rotation (degrés)',String(Math.round(base.pose.yaw*180/Math.PI)),'number','-180','180');field('scale','Taille (×)',String(base.pose.scale),'number','0.1','3');
    const movableLabel=document.createElement('label'),movable=document.createElement('input');movable.type='checkbox';movable.checked=base.movable;movable.name='movable';movableLabel.append(movable,' Manipulable (décocher pour fixer)');this.form.append(movableLabel);
    const apply=document.createElement('button');apply.type='submit';apply.textContent='Enregistrer cet objet';
    const remove=button('Supprimer cet objet',()=>{if(confirm(`Supprimer ${base.name} de la pièce ?`))void this.command({action:'remove',id:base.id},revision,objectRevision);});
    this.form.append(apply,remove);this.form.onsubmit=event=>{event.preventDefault();const number=(key:string)=>Number(inputs.get(key)!.value);
      const object:RoomObject={...base,name:inputs.get('name')!.value,movable:movable.checked,pose:{x:number('x'),y:number('y'),z:number('z'),yaw:number('yaw')*Math.PI/180,scale:number('scale')}};
      void this.command({action:'update',object},revision,objectRevision);
    };this.disable();
  }
  private async command(body:Record<string,unknown>,revision=this.revision,objectRevision=this.objects?.revision){
    if(this.busy||this.blocked)return;this.busy=true;this.disable();this.message.textContent='Enregistrement…';
    try{await this.request({...body,revision,objectRevision});this.dirty=false;this.key='';await this.changed();this.message.textContent='Bibliothèque enregistrée sur le serveur.';}
    catch(error){this.message.textContent=String(error);}finally{this.busy=false;this.disable();}
  }
}
