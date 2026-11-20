import '../admin.css';
import './library-page.css';
import { libraryAssets,setImportedCatalog,importedCatalog,OBJECT_CATALOG,type LibraryAsset } from '../../../server/src/object-library.js';
import type { RoomLibrary } from '../../../server/src/scene-schema.js';
import type { ObjectSnapshot } from '../../../server/src/object-manipulation.js';
import { ModelPreview } from './model-preview';
import { catalogPreviews } from './catalog-previews';

type State={objectCatalog:ReturnType<typeof importedCatalog>;library:RoomLibrary;adventure:{running:boolean;objects:ObjectSnapshot};portal:{active:boolean}};
type Pending={file:File;status:string;ready:boolean;selected:boolean};
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
let session=0;
let token='',debug=false,state:State|undefined,busy=false,queue:Pending[]=[],timer:ReturnType<typeof setTimeout>|undefined,catalogueKey='',clearPreviews=()=>{};
let editing:LibraryAsset|undefined,editRevision=0;
const dialog=el<HTMLDialogElement>('model-dialog'),preview=new ModelPreview(el('model-preview'),el('model-status'));
const notice=(message:string)=>{el('notice').textContent=message;};
async function responseJSON(response:Response){let data:any;try{data=await response.json();}catch{throw Error(`HTTP ${response.status} : vérifier les limites du proxy HTTPS.`);}if(!response.ok)throw Error(data.error??`HTTP ${response.status}`);return data;}
const headers=()=>({Authorization:`Bearer ${token}`});
async function api(path:string,body?:unknown){return responseJSON(await fetch('/api/admin/'+path,{method:body===undefined?'GET':'POST',headers:{...headers(),'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)}));}
function disable(){
  for(const id of ['files','source','license','rights','refresh','logout'])el<HTMLInputElement>(id).disabled=busy;
  el<HTMLButtonElement>('import').disabled=busy||!queue.some(item=>item.ready&&item.selected);
  Array.from(el('queue').children).forEach((row,index)=>{for(const node of Array.from(row.querySelectorAll('button,input')))(node as HTMLInputElement).disabled=busy||!queue[index]?.ready;});
}
function drawQueue(){
  el('queue').replaceChildren();queue.forEach((item,index)=>{
    const row=document.createElement('div'),label=document.createElement('label'),check=document.createElement('input'),text=document.createElement('span'),view=document.createElement('button');row.className='import-row';
    check.type='checkbox';check.checked=item.selected;check.disabled=!item.ready||busy;check.setAttribute('aria-label','Importer '+item.file.name);check.onchange=()=>{item.selected=check.checked;disable();};
    text.textContent=`${index+1}. ${item.file.name} · ${(item.file.size/1048576).toFixed(2)} Mio · ${item.status}`;label.append(check,text);
    view.type='button';view.textContent='Prévisualiser';view.disabled=!item.ready||busy;view.onclick=()=>{editing=undefined;el('model-title').textContent=item.file.name;el('model-form').hidden=true;dialog.showModal();void preview.show(item.file);};row.append(label,view);el('queue').append(row);
  });disable();
}
function drawCatalogue(){
  const category=el<HTMLSelectElement>('category').value,search=el<HTMLInputElement>('search').value.trim().toLocaleLowerCase('fr');
  const key=JSON.stringify([state?.objectCatalog.revision,state?.library.activeId,state?.adventure.running,state?.portal.active,category,search]);if(key===catalogueKey)return;catalogueKey=key;
  clearPreviews();const host=el('catalogue');host.replaceChildren();const previews:{asset:string;image:HTMLImageElement;status:HTMLElement}[]=[];
  const assets=libraryAssets().filter(asset=>(!category||asset.category===category)&&asset.name.toLocaleLowerCase('fr').includes(search));
  el('count').textContent=`${assets.length} modèle(s) · ${libraryAssets().filter(asset=>asset.id.startsWith('custom-')).length}/64 importés`;
  for(const asset of assets){
    const card=document.createElement('article'),image=document.createElement('img'),status=document.createElement('p'),title=document.createElement('h3'),info=document.createElement('p');card.className='player';
    image.className='library-thumbnail';image.alt='Aperçu 3D : '+asset.name;image.width=360;image.height=240;image.hidden=true;status.textContent='Chargement de l’aperçu…';previews.push({asset:asset.id,image,status});title.textContent=asset.name;
    info.textContent=`${asset.category} · ${asset.id.startsWith('custom-')?'Importé · v'+asset.version:'Intégré · CC0'} · ${asset.hands} main(s)`;
    const configure=document.createElement('button');configure.textContent=asset.id.startsWith('custom-')?'Voir / modifier':'Voir le modèle';configure.dataset.model=asset.id;configure.onclick=()=>openModel(asset);
    const add=document.createElement('button');add.textContent='Ajouter à la pièce active';add.className='secondary';add.disabled=!state?.library.activeId||state.adventure.running||state.portal.active;add.onclick=()=>void addObject(asset);
    card.append(image,status,title,info,configure,add);host.append(card);
  }
  clearPreviews=catalogPreviews(host,previews);
}
async function refresh(){
  clearTimeout(timer);const current=session;try{const next=await api('state') as State;if(current!==session)return;state=next;setImportedCatalog(state.objectCatalog);el('login-panel').hidden=true;el('workspace').hidden=false;el('connection').textContent=debug?'Mode debug':'Connecté';drawCatalogue();}
  catch(error){notice(String(error));}finally{if(current===session&&(token||debug))timer=setTimeout(()=>{if(!busy)void refresh();else timer=setTimeout(()=>void refresh(),2000);},2000);}
}
async function addObject(asset:LibraryAsset){
  if(busy||!state)return;busy=true;disable();try{const fresh=await api('state') as State;await api('rooms/objects',{action:'add',asset:asset.id,revision:fresh.library.revision,objectRevision:fresh.adventure.objects.revision});await refresh();notice(asset.name+' ajouté à la pièce active.');}catch(error){notice(String(error));}finally{busy=false;disable();}
}
function openModel(asset:LibraryAsset){
  editing=structuredClone(asset);editRevision=state!.objectCatalog.revision;el('model-title').textContent=asset.name;el('model-form').hidden=false;const fields=el('model-fields');fields.replaceChildren();
  const custom=asset.id.startsWith('custom-');
  const input=(name:string,title:string,value:string,type='text',min?:string,max?:string)=>{const label=document.createElement('label'),node=document.createElement('input');label.textContent=title+' ';node.name=name;node.value=value;node.type=type;node.required=true;node.disabled=!custom;if(type==='number'){node.step='any';node.min=min??'';node.max=max??'';}else node.maxLength=name==='source'?512:name==='license'?128:64;label.append(node);fields.append(label);return node;};
  input('name','Nom',asset.name);const category=document.createElement('select');category.name='category';category.disabled=!custom;for(const value of ['mobilier','accessoires','decoration']){const option=document.createElement('option');option.value=option.textContent=value;category.append(option);}category.value=asset.category;const label=document.createElement('label');label.append('Catégorie ',category);fields.append(label);
  for(const [axis,title,max] of [['width','Largeur (m)','20'],['height','Hauteur (m)','6'],['depth','Profondeur (m)','20']] as const)input(axis,title,String(asset.size[axis]),'number','.01',max);
  input('hands','Nombre de mains',String(asset.hands),'number','1','2').step='1';input('yaw','Orientation initiale Y (degrés)',String((asset.defaultYaw??0)*180/Math.PI),'number','-180','180');
  const movable=input('movable','Manipulable par défaut','', 'checkbox');movable.required=false;movable.checked=asset.defaultMovable??true;
  input('source','Source',asset.source??OBJECT_CATALOG.source);input('license','Licence',asset.license??OBJECT_CATALOG.license);
  el('save-model').hidden=!custom;el('model-info').textContent=custom?`Version ${asset.version} · fichier GLB conservé à l’identique.`:'Modèle intégré : fiche en lecture seule. La position et la taille de ses exemplaires restent modifiables dans l’administration.';
  dialog.showModal();void preview.show(asset);
}
dialog.addEventListener('close',()=>{preview.close();editing=undefined;});el('close-dialog').onclick=()=>dialog.close();
el('model-form').onsubmit=event=>{event.preventDefault();void(async()=>{
  if(!editing||busy)return;busy=true;el<HTMLButtonElement>('save-model').disabled=true;
  try{const data=new FormData(el<HTMLFormElement>('model-form')),number=(key:string)=>Number(data.get(key));const asset:LibraryAsset={...editing,name:String(data.get('name')),category:String(data.get('category')) as LibraryAsset['category'],size:{width:number('width'),height:number('height'),depth:number('depth')},hands:number('hands') as 1|2,defaultYaw:number('yaw')*Math.PI/180,defaultMovable:data.has('movable'),source:String(data.get('source')),license:String(data.get('license'))};
    await api('models/update',{revision:editRevision,asset});dialog.close();await refresh();notice('Nouvelle version enregistrée. Les objets déjà placés sont conservés.');
  }catch(error){el('model-info').textContent=String(error);}finally{busy=false;el<HTMLButtonElement>('save-model').disabled=false;disable();}
})();};
el<HTMLInputElement>('files').onchange=()=>{void(async()=>{
  const files=Array.from(el<HTMLInputElement>('files').files??[]);if(files.length>10){notice('Sélectionnez au maximum 10 fichiers par lot.');el<HTMLInputElement>('files').value='';return;}
  busy=true;queue=files.map(file=>({file,status:'En attente de vérification',ready:false,selected:false}));drawQueue();
  try{for(const item of queue){item.status='Vérification serveur…';drawQueue();try{if(item.file.size>8*1048576||!/\.glb$/i.test(item.file.name))throw Error('GLB de 8 Mio maximum requis.');
      const result=await responseJSON(await fetch('/api/admin/models/inspect',{method:'POST',headers:{...headers(),'Content-Type':'application/octet-stream'},body:item.file,signal:AbortSignal.timeout(30000)}));
      item.status=`Prêt · ${result.info.vertices} sommets · ${result.info.size.width.toFixed(2)} × ${result.info.size.height.toFixed(2)} × ${result.info.size.depth.toFixed(2)} unités source`;item.ready=true;item.selected=true;
    }catch(error){item.status='Refusé : '+String(error);}drawQueue();}}
  finally{busy=false;drawQueue();}
})();};
el('import').onclick=()=>{void(async()=>{
  if(busy)return;const source=el<HTMLInputElement>('source').value.trim(),license=el<HTMLInputElement>('license').value.trim();if(!source||!license||!el<HTMLInputElement>('rights').checked){notice('Renseignez la source, la licence et confirmez vos droits pour ce lot.');return;}
  busy=true;drawQueue();let imported=0,failed=0;
  try{for(const item of queue.filter(item=>item.ready&&item.selected)){
    item.status='Enregistrement…';drawQueue();
    try{const current=await api('state') as State;const result=await responseJSON(await fetch('/api/admin/models/import',{method:'POST',headers:{...headers(),'Content-Type':'application/octet-stream','X-File-Name':encodeURIComponent(item.file.name),'X-Model-Source':encodeURIComponent(source),'X-Model-License':encodeURIComponent(license),'X-Model-Rights':'confirmed','X-Catalog-Revision':String(current.objectCatalog.revision)},body:item.file,signal:AbortSignal.timeout(45000)}));item.status=result.duplicate?'Déjà présent dans le catalogue':'Importé — '+result.asset.name;item.ready=false;item.selected=false;imported++;}
    catch(error){item.status='Échec : '+String(error);failed++;}drawQueue();
  }await refresh();notice(`${imported} fichier(s) importé(s) ou déjà présent(s), ${failed} échec(s).`);}
  finally{busy=false;drawQueue();}
})();};
el('search').oninput=drawCatalogue;el('category').onchange=drawCatalogue;el('refresh').onclick=()=>void refresh();
el('login').onsubmit=event=>{event.preventDefault();session++;token=el<HTMLInputElement>('token').value;el<HTMLInputElement>('token').value='';void refresh();};
el('logout').onclick=()=>{session++;token='';debug=false;clearTimeout(timer);state=undefined;queue=[];clearPreviews();dialog.close();el('workspace').hidden=true;el('login-panel').hidden=false;el('connection').textContent='Non connecté';};
window.addEventListener('pagehide',()=>{clearTimeout(timer);clearPreviews();preview.dispose();},{once:true});
void fetch('/api/admin/auth').then(responseJSON).then(access=>{if(access.debug){debug=true;void refresh();}}).catch(()=>{});
