import * as THREE from 'three';
import { RealisticHand } from './realistic-hand';
export function handPreview(host:HTMLElement){
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Aperçu de la main 3D';details.append(summary);host.append(details);
  let renderer:THREE.WebGLRenderer|undefined,pressed=false;
  const hand=new RealisticHand('right'),scene=new THREE.Scene();scene.background=new THREE.Color(0x111e30);scene.add(hand.group,new THREE.HemisphereLight(0xffffff,0x66554b,2));
  const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(1,2,2);scene.add(light);
  const camera=new THREE.PerspectiveCamera(35,1.6,.01,5);camera.position.set(.1,.2,.32);camera.lookAt(0,0,-.02);
  const loop=(time:number)=>{if(!details.open||!renderer)return;hand.grip(new THREE.Vector3(),new THREE.Quaternion(),pressed,time);renderer.render(scene,camera);requestAnimationFrame(loop);};
  details.ontoggle=()=>{if(!details.open)return;
    if(!renderer){renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(640,400);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.domElement.setAttribute('aria-label','Main réaliste 3D');details.append(renderer.domElement);
      const button=document.createElement('button');button.textContent='Fermer la main';button.onclick=()=>{pressed=!pressed;button.textContent=pressed?'Ouvrir la main':'Fermer la main';};details.append(button);void hand.load();
    }requestAnimationFrame(loop);
  };
  window.addEventListener('pagehide',()=>{details.open=false;hand.dispose();renderer?.dispose();},{once:true});
}
