import * as THREE from 'three';
import { loadLibraryModel } from './object-view';
import { disposeGroup } from '../model-view';

/** Render static catalogue images with one temporary context, not one per card. */
export function catalogPreviews(container:HTMLElement,entries:{asset:string;image:HTMLImageElement;status:HTMLElement}[]){
  let stopped=false;let observer:IntersectionObserver|undefined;
  let renderer:THREE.WebGLRenderer|undefined;
  const cleanup=()=>{stopped=true;observer?.disconnect();renderer?.dispose();renderer=undefined;window.removeEventListener('pagehide',cleanup);};
  const render=async()=>{
    if(stopped)return;
    try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(360,240);renderer.setPixelRatio(1);}
    catch{for(const entry of entries)entry.status.textContent='Aperçu indisponible (WebGL)';return;}
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1.5,.01,100);
    scene.add(new THREE.HemisphereLight(0xffffff,0x6a7590,2));
    const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(3,6,5);scene.add(light);
    for(const entry of entries){
      if(stopped)break;
      let model:THREE.Group|undefined;
      try{
        model=await loadLibraryModel({asset:entry.asset});
        if(stopped)break;
        model.traverse(node=>{
          const mesh=node as THREE.Mesh;if(!mesh.isMesh)return;
          const lit=(material:THREE.Material)=>{const source=material as THREE.MeshBasicMaterial;const next=new THREE.MeshStandardMaterial({color:source.color,vertexColors:source.vertexColors,map:source.map,side:source.side,transparent:source.transparent,opacity:source.opacity,alphaTest:source.alphaTest,roughness:.85});material.dispose();return next;};
          mesh.material=Array.isArray(mesh.material)?mesh.material.map(lit):lit(mesh.material);
        });
        scene.add(model);model.updateMatrixWorld(true);
        const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3()),radius=bounds.getSize(new THREE.Vector3()).length()/2;
        const distance=radius/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))*1.12;
        camera.position.copy(center).add(new THREE.Vector3(1,.7,1.2).normalize().multiplyScalar(distance));camera.lookAt(center);
        renderer!.render(scene,camera);
        entry.image.src=renderer!.domElement.toDataURL('image/png');entry.image.hidden=false;
        entry.status.hidden=true;entry.image.dataset.previewState='ready';
      }catch{entry.status.textContent='Aperçu indisponible';entry.image.dataset.previewState='error';}
      finally{if(model)disposeGroup(model);}
    }
    renderer?.dispose();renderer=undefined;
    window.removeEventListener('pagehide',cleanup);
  };
  window.addEventListener('pagehide',cleanup,{once:true});
  if(typeof IntersectionObserver==='undefined'){void render();return cleanup;}
  observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer?.disconnect();void render();}});
  observer.observe(container);
  return cleanup;
}
