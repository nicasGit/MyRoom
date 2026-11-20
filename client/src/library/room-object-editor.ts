import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import type { RoomModel } from '../../../server/src/scene-schema.js';
import { validateObjectPlacement } from '../../../server/src/scene-schema.js';
import type { ObjectSnapshot } from '../../../server/src/object-manipulation.js';
import { libraryAsset,type RoomObject } from '../../../server/src/object-library.js';
import { modelGroup,disposeGroup } from '../model-view';
import { addLibraryObjects } from './object-view';

/** PC room authoring only; no game state or physics lives in this editor. */
export function roomObjectEditor(container:HTMLElement,request:(body:unknown)=>Promise<unknown>,changed:()=>Promise<void>){
  let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{container.textContent='Éditeur 3D indisponible : WebGL requis.';return {receive:(_model:RoomModel|null,_revision=0,_objects?:ObjectSnapshot,_blocked=true)=>{}};}
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  const toolbar=document.createElement('div'),select=document.createElement('select'),message=document.createElement('p');
  select.setAttribute('aria-label','Objet à déplacer dans la vue 3D');message.setAttribute('role','status');
  const button=(title:string,click:()=>void)=>{const b=document.createElement('button');b.type='button';b.textContent=title;b.onclick=click;toolbar.append(b);return b;};
  toolbar.append(select);container.append(toolbar,renderer.domElement,message);
  renderer.domElement.setAttribute('aria-label','Éditeur de pièce 3D : sélectionner un objet puis tirer les flèches pour déplacer.');
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(50,1,.01,200),orbit=new OrbitControls(camera,renderer.domElement);
  const transform=new TransformControls(camera,renderer.domElement);scene.add(transform.getHelper());
  let group:THREE.Group|undefined,model:RoomModel|null=null,objects:ObjectSnapshot|undefined,revision=0,key='',roomId='';
  let blocked=true,busy=false,dirty=false,dragging=false,selected='',editRevision=0,editObjects=0;
  let pointerStart={x:0,y:0},gizmoPress=false;
  const roots=()=>group?.userData.grabbables as Record<string,THREE.Object3D>|undefined;
  const item=()=>model?.objects?.items.find(o=>o.id===selected);
  const draft=():RoomObject|undefined=>{
    const base=item(),node=roots()?.['prop:'+selected];if(!base||!node)return;
    return {...base,pose:{x:node.position.x,y:node.position.y,z:node.position.z,yaw:Math.atan2(Math.sin(node.rotation.y),Math.cos(node.rotation.y)),scale:node.scale.x}};
  };
  function disable(){
    const stale=dirty&&(revision!==editRevision||objects?.revision!==editObjects);
    transform.enabled=!blocked&&!busy&&!stale;orbit.enabled=!dragging;
    select.disabled=busy||dirty;move.disabled=rotate.disabled=blocked||busy||!item()||stale;
    save.disabled=blocked||busy||!dirty||stale;cancel.disabled=busy||!dirty;
    if(stale)message.textContent='La pièce ou les objets ont changé ailleurs. Rechargez avant de modifier.';
  }
  function attach(id:string){selected=id;select.value=id;transform.detach();const node=roots()?.['prop:'+id];if(node)transform.attach(node);disable();}
  const move=button('Déplacer',()=>{transform.setMode('translate');transform.showX=transform.showY=transform.showZ=true;});
  const rotate=button('Tourner',()=>{transform.setMode('rotate');transform.showX=transform.showZ=false;transform.showY=true;});
  const save=button('Enregistrer la position',()=>void commit());
  const cancel=button('Annuler / recharger',()=>{dirty=false;key='';receive(model,revision,objects,blocked);});
  select.onchange=()=>attach(select.value);
  transform.addEventListener('dragging-changed',event=>{dragging=!!event.value;orbit.enabled=!dragging;});
  transform.addEventListener('objectChange',()=>{
    const base=item(),node=roots()?.['prop:'+selected];
    if(base&&node&&model){const height=libraryAsset(base.asset,base.assetVersion??1)!.size.height*node.scale.x;node.position.y=THREE.MathUtils.clamp(node.position.y,0,Math.max(0,model.height-height));}
    if(!dirty){editRevision=revision;editObjects=objects?.revision??0;}dirty=true;
    const object=draft();try{if(object&&model)validateObjectPlacement(model,object);message.textContent='Position modifiée : cliquez sur Enregistrer la position.';}catch(error){message.textContent=String(error);}
    disable();
  });
  renderer.domElement.addEventListener('pointerdown',event=>{pointerStart={x:event.clientX,y:event.clientY};gizmoPress=!!transform.axis;});
  renderer.domElement.addEventListener('pointerup',event=>{
    if(gizmoPress||dirty||busy||Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>5||!group)return;
    const rect=renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);
    for(const hit of ray.intersectObjects(Object.values(roots()??{}),true)){
      let node:THREE.Object3D|null=hit.object;while(node&&!node.userData.libraryObject)node=node.parent;
      if(node?.userData.libraryObject){attach(String(node.userData.libraryObject));break;}
    }
  });
  async function commit(){
    if(blocked||busy||!dirty||revision!==editRevision||objects?.revision!==editObjects)return;
    const object=draft();if(!object||!model)return;
    try{validateObjectPlacement(model,object);}catch(error){message.textContent=String(error);return;}
    busy=true;disable();
    try{await request({action:'update',object,revision:editRevision,objectRevision:editObjects});dirty=false;key='';await changed();message.textContent='Position enregistrée sur le serveur.';}
    catch(error){message.textContent=String(error);}finally{busy=false;disable();}
  }
  function receive(next:RoomModel|null,nextRevision=0,nextObjects?:ObjectSnapshot,nextBlocked=true){
    const switched=next?.id!==model?.id;
    model=next;revision=nextRevision;objects=nextObjects;blocked=nextBlocked||!objects||!!objects.held.length||!model;
    if(switched||!next){dirty=false;key='';selected='';}
    const nextKey=JSON.stringify([next,nextObjects?.poses]);
    if(!dirty&&nextKey!==key){
      key=nextKey;transform.detach();if(group)disposeGroup(group);group=next?addLibraryObjects(modelGroup(next),next):undefined;
      if(group){scene.add(group);for(const [id,node] of Object.entries(roots()??{})){const pose=objects?.poses[id as keyof typeof objects.poses];if(pose){node.position.set(pose.x,pose.y,pose.z);node.rotation.y=pose.yaw;node.scale.setScalar(pose.scale??1);}}}
      select.replaceChildren();for(const object of next?.objects?.items??[]){const option=document.createElement('option');option.value=object.id;option.textContent=object.name;select.append(option);}
      attach(next?.objects?.items.some(i=>i.id===selected)?selected:select.value);
      if(group&&roomId!==next!.id){roomId=next!.id;const bounds=new THREE.Box3().setFromObject(group),center=bounds.getCenter(new THREE.Vector3()),distance=Math.max(bounds.getSize(new THREE.Vector3()).length(),2);orbit.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(distance,distance*.8,distance));orbit.update();}
      if(!busy)message.textContent=next?'Cliquez un objet puis tirez les flèches. Enregistrez après déplacement.':'Activez une pièce enregistrée.';
    }
    disable();
  }
  const resize=()=>{const width=Math.max(container.clientWidth,1);renderer.setSize(width,420);camera.aspect=width/420;camera.updateProjectionMatrix();};
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  renderer.setAnimationLoop(()=>{if(container.offsetParent!==null)renderer.render(scene,camera);});
  window.addEventListener('pagehide',()=>{observer.disconnect();renderer.setAnimationLoop(null);transform.dispose();orbit.dispose();if(group)disposeGroup(group);renderer.dispose();},{once:true});
  disable();return {receive};
}
