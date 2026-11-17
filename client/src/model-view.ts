import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { wallPanels,type RoomModel } from '../../server/src/scene-schema.js';

export function modelGroup(model: RoomModel, closed=true) {
  const group=new THREE.Group();
  model.floor.forEach(p=>{
    const marker=new THREE.Mesh(new THREE.SphereGeometry(0.035,8,8),new THREE.MeshBasicMaterial({color:0x67e8f9}));
    marker.position.set(p.x,0.035,p.z);group.add(marker);
  });
  const outline=model.floor.map(p=>new THREE.Vector3(p.x,0.015,p.z));
  if(closed && outline.length>2) outline.push(outline[0].clone());
  if(outline.length>1) group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(outline),new THREE.LineBasicMaterial({color:0x67e8f9})));
  if(closed&&model.floor.length>=3) {
    const shape=new THREE.Shape(model.floor.map(p=>new THREE.Vector2(p.x,-p.z)));
    const floor=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:0x67e8f9,transparent:true,opacity:0.18,side:THREE.DoubleSide,depthWrite:false}));
    floor.rotation.x=-Math.PI/2; group.add(floor);
    model.floor.forEach((a,i)=> {
      const b=model.floor[(i+1)%model.floor.length];
      const length=Math.hypot(b.x-a.x,b.z-a.z),openings=(model.openings??[]).filter(o=>o.wall===i);
      const wall=new THREE.Group();wall.name=`wall-${i}`;
      wall.position.set(a.x,0,a.z); wall.rotation.y=-Math.atan2(b.z-a.z,b.x-a.x);
      for(const panel of wallPanels(length,model.height,openings)){
        const mesh=new THREE.Mesh(new THREE.BoxGeometry(panel.width,panel.height,0.025),new THREE.MeshBasicMaterial({color:0x79b4f5,transparent:true,opacity:0.12,depthWrite:false}));
        mesh.position.set(panel.offset+panel.width/2,panel.bottom+panel.height/2,0);
        mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color:0x79b4f5})));wall.add(mesh);
      }
      for(const o of openings){
        const points=[[o.offset,o.sill],[o.offset+o.width,o.sill],[o.offset+o.width,o.sill+o.height],[o.offset,o.sill+o.height]].map(([x,y])=>new THREE.Vector3(x,y,0));
        wall.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:o.kind==='door'?0x87f0b5:0xffe082})));
      }
      group.add(wall);
    });
  }
  model.obstacles.forEach(o=> {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(o.width,o.height,o.depth),new THREE.MeshBasicMaterial({color:0xffbd73,transparent:true,opacity:0.4,depthWrite:false}));
    mesh.position.set(o.x,o.height/2,o.z);
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color:0xffbd73}))); group.add(mesh);
  });
  return group;
}
export function disposeGroup(group: THREE.Object3D) {
  group.traverse(object=> {
    const mesh=object as THREE.Mesh;
    mesh.geometry?.dispose();
    const materials=mesh.material ? (Array.isArray(mesh.material)?mesh.material:[mesh.material]) : [];
    materials.forEach(material=>{(material as THREE.MeshBasicMaterial).map?.dispose();material.dispose();});
  });
  group.removeFromParent();
}
export function createPreview(container: HTMLElement) {
  let renderer: THREE.WebGLRenderer;
  try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true}); }
  catch { container.textContent='Aperçu 3D indisponible : WebGL requis.'; return (_model:RoomModel|null)=>{}; }
  container.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','Modèle 3D de la pièce. Glisser pour tourner, pincer pour zoomer.');
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(50,1,0.01,200);
  const controls=new OrbitControls(camera,renderer.domElement);
  let group:THREE.Group|undefined;
  const render=()=>renderer.render(scene,camera);
  controls.addEventListener('change',render);
  const resize=()=> { const width=Math.max(container.clientWidth,1); renderer.setSize(width,300); camera.aspect=width/300;camera.updateProjectionMatrix();render(); };
  new ResizeObserver(resize).observe(container);
  return (model:RoomModel|null)=> {
    if(group) disposeGroup(group);
    group=model?modelGroup(model):undefined;
    if(group) {
      scene.add(group);
      const bounds=new THREE.Box3().setFromObject(group),center=bounds.getCenter(new THREE.Vector3());
      const distance=Math.max(bounds.getSize(new THREE.Vector3()).length(),2);
      controls.target.copy(center); camera.position.copy(center).add(new THREE.Vector3(distance, distance*0.8,distance));
      controls.update();
    }
    resize();
  };
}
