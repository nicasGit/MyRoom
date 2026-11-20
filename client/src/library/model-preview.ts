import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { disposeGroup } from '../model-view';
import { loadLibraryModel } from './object-view';
import type { LibraryAsset } from '../../../server/src/object-library.js';

export class ModelPreview {
  private renderer?:THREE.WebGLRenderer;private controls?:OrbitControls;private group?:THREE.Group;
  private scene=new THREE.Scene();private camera=new THREE.PerspectiveCamera(40,1,.001,100000);private generation=0;
  private resizeObserver:ResizeObserver;
  constructor(private host:HTMLElement,private status:HTMLElement){
    this.scene.background=new THREE.Color(0x142337);this.scene.add(new THREE.HemisphereLight(0xffffff,0x65758a,2));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(3,7,5);this.scene.add(light);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);
  }
  private resize(){if(!this.renderer)return;const width=Math.max(1,this.host.clientWidth);this.renderer.setSize(width,340);this.camera.aspect=width/340;this.camera.updateProjectionMatrix();this.draw();}
  private draw=()=>{this.renderer?.render(this.scene,this.camera);};
  async show(input:LibraryAsset|File){
    const generation=++this.generation;this.status.textContent='Chargement du modèle…';if(this.group){disposeGroup(this.group);this.group=undefined;}
    try{
      if(!this.renderer){this.renderer=new THREE.WebGLRenderer({antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.domElement.setAttribute('aria-label','Aperçu 3D interactif : glisser pour tourner, molette ou pincer pour zoomer');this.host.append(this.renderer.domElement);this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.addEventListener('change',this.draw);}
      const model=input instanceof File?(await new GLTFLoader().parseAsync(await input.arrayBuffer(),'')).scene:await loadLibraryModel({asset:input.id,assetVersion:input.version??1});
      if(generation!==this.generation){disposeGroup(model);return;}
      this.group=model;this.scene.add(model);model.updateMatrixWorld(true);
      const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),distance=size.length()/2/Math.sin(THREE.MathUtils.degToRad(this.camera.fov/2))*1.2;
      this.camera.position.copy(center).add(new THREE.Vector3(1,.65,1.2).normalize().multiplyScalar(distance));this.camera.lookAt(center);this.controls!.target.copy(center);this.controls!.update();this.resize();
      this.status.textContent=`${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)} m · Glisser pour tourner, pincer ou molette pour zoomer.`;
    }catch(error){if(generation===this.generation)this.status.textContent='Aperçu indisponible : '+String(error);}
  }
  close(){this.generation++;if(this.group)disposeGroup(this.group);this.group=undefined;this.controls?.dispose();this.controls=undefined;this.renderer?.dispose();this.renderer?.forceContextLoss();this.renderer?.domElement.remove();this.renderer=undefined;}
  dispose(){this.close();this.resizeObserver.disconnect();}
}
