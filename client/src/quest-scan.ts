import { Matrix4,Vector3 } from 'three';
import { toRoom,type makeCalibration } from './calibration';
import { area,inside,parseFloor,parseRoom,type RoomModel } from '../../server/src/scene-schema.js';

export type Surface={label:string;orientation:string;points:{x:number;y:number;z:number}[]};
type Calibration=ReturnType<typeof makeCalibration>;
const furniture=new Set(['table','desk','couch','sofa','bed','chair','storage','shelf']);

// Only labelled furniture meshes are converted; a global room mesh is not an obstacle.
export function captureMeshes(frame:XRFrame,reference:XRReferenceSpace):Surface[]{
  const surfaces:Surface[]=[];
  for(const mesh of frame.detectedMeshes??[]){
    if(surfaces.length>=32)break;
    const label=(mesh.semanticLabel??'').toLowerCase();
    if(!furniture.has(label)||mesh.vertices.length<9||mesh.vertices.length>60000||mesh.vertices.length%3)continue;
    const pose=frame.getPose(mesh.meshSpace,reference);if(!pose)continue;
    const matrix=new Matrix4().fromArray(pose.transform.matrix),points:Vector3[]=[];
    for(let i=0;i<mesh.vertices.length;i+=3)points.push(new Vector3(mesh.vertices[i],mesh.vertices[i+1],mesh.vertices[i+2]).applyMatrix4(matrix));
    if(points.some(p=>!p.toArray().every(Number.isFinite)))continue;
    // Preserve only bounding corners, not an unbounded mesh payload.
    const bounds=['x','y','z'].map(axis=>{const values=points.map(p=>p[axis as 'x'|'y'|'z']);return [Math.min(...values),Math.max(...values)];});
    surfaces.push({label,orientation:'volume',points:bounds[0].flatMap(x=>bounds[1].flatMap(y=>bounds[2].map(z=>({x,y,z}))))});
  }
  return surfaces;
}

export class QuestButtons {
  private states=new WeakMap<XRInputSource,boolean[]>();
  pollMenu(sources:Iterable<XRInputSource>){
    let pressed=false;
    for(const source of sources){
      if(source.handedness!=='left'||source.gamepad?.mapping!=='xr-standard')continue;
      const previous=this.states.get(source),current=Array.from(source.gamepad.buttons,b=>b.pressed);this.states.set(source,current);
      if(!previous)continue;
      if(([4,5] as const).some(index=>current[index]&&!previous[index]))pressed=true;
    }
    return pressed;
  }
  poll(sources:Iterable<XRInputSource>):('import'|'save'|'cancel')[]{
    const actions:('import'|'save'|'cancel')[]=[];
    for(const source of sources){
      if(source.gamepad?.mapping!=='xr-standard')continue;
      const previous=this.states.get(source),current=Array.from(source.gamepad.buttons,b=>b.pressed);this.states.set(source,current);
      if(!previous)continue;
      if(current[4]&&!previous[4])actions.push('import');
      if(current[5]&&!previous[5]&&source.handedness==='right')actions.push('save');
      if(current[5]&&!previous[5]&&source.handedness==='left')actions.push('cancel');
    }
    return actions;
  }
}

// Snapshot only currently located surfaces, within an active XR frame. Never accumulate stale poses.
export function capturePlanes(frame:XRFrame,reference:XRReferenceSpace):Surface[]{
  const surfaces:Surface[]=[];
  for(const plane of frame.detectedPlanes??[]){
    if(surfaces.length>=128)break;
    if(plane.polygon.length<3||plane.polygon.length>256)continue;
    const pose=frame.getPose(plane.planeSpace,reference);if(!pose)continue;
    const matrix=new Matrix4().fromArray(pose.transform.matrix);
    const points=plane.polygon.map(p=>new Vector3(p.x,p.y,p.z).applyMatrix4(matrix));
    if(points.some(p=>!p.toArray().every(Number.isFinite)))continue;
    surfaces.push({label:(plane.semanticLabel??'').toLowerCase(),orientation:plane.orientation,points:points.map(p=>({x:p.x,y:p.y,z:p.z}))});
  }
  return surfaces;
}

function contour(surface:Surface){
  const points=surface.points.map(p=>({x:p.x,z:p.z}));
  while(points.length>3&&Math.hypot(points[0].x-points.at(-1)!.x,points[0].z-points.at(-1)!.z)<0.001)points.pop();
  // Some implementations repeat the closing vertex. Drop redundant straight vertices,
  // preserving concave corners rather than replacing the outline with a convex hull.
  let changed=true;
  while(changed&&points.length>3){
    changed=false;
    for(let i=0;i<points.length;i++){
      const a=points[(i+points.length-1)%points.length],b=points[i],c=points[(i+1)%points.length];
      const dx=c.x-a.x,dz=c.z-a.z,length=Math.hypot(dx,dz);
      if(Math.hypot(b.x-a.x,b.z-a.z)<0.001||(length>0&&Math.abs(dx*(b.z-a.z)-dz*(b.x-a.x))/length<0.001&&(b.x-a.x)*(b.x-c.x)+(b.z-a.z)*(b.z-c.z)<=0)){
        points.splice(i,1);changed=true;break;
      }
    }
  }
  return parseFloor(points);
}

export function importSurfaces(surfaces:Surface[],calibration:Calibration,id:string):{room:RoomModel;warnings:string[]}{
  const warnings:string[]=[];
  const converted=surfaces.slice(0,128).filter(s=>s.points.length>=3&&s.points.length<=256&&s.points.every(p=>[p.x,p.y,p.z].every(Number.isFinite))).map(s=>({...s,points:s.points.map(p=>toRoom(new Vector3(p.x,p.y,p.z),calibration))}));
  const candidates=converted.filter(s=>s.orientation==='horizontal'&&(s.label==='floor'||s.label==='')&&s.points.every(p=>Math.abs(p.y)<0.2)).flatMap(s=>{
    try{const floor=contour(s);return inside({x:0,z:0},floor)&&inside({x:calibration.distance,z:0},floor)?[{floor,explicit:s.label==='floor'}]:[];}catch{return [];}
  }).sort((a,b)=>Number(b.explicit)-Number(a.explicit)||area(b.floor)-area(a.floor));
  if(!candidates.length)throw new Error('Aucun contour de sol exploitable contenant A et B. Configurez l’espace du Quest, autorisez les données spatiales, ou utilisez le relevé manuel.');
  const floor=candidates[0].floor;
  if(candidates.length>1)warnings.push('Plusieurs sols : le plus grand contour compatible A/B a été choisi.');
  const heights=converted.filter(s=>s.label==='ceiling'||(s.orientation==='vertical'&&s.label==='wall')).filter(s=>s.points.every(p=>inside(p,floor))).map(s=>Math.max(...s.points.map(p=>p.y))).filter(h=>h>=0.5&&h<=6).sort((a,b)=>a-b);
  const height=heights.length?heights[Math.floor(heights.length/2)]:2.5;
  warnings.push(heights.length?'Hauteur estimée depuis les surfaces : vérifiez-la.':'Hauteur proposée : 2,5 m, à mesurer et corriger.');
  let room=parseRoom({id,name:'Pièce importée du Quest',floor,height,obstacles:[],openings:[]});
  let skipped=0;
  for(const surface of [...converted].sort((a,b)=>Number(b.orientation==='volume')-Number(a.orientation==='volume'))){
    if(!['horizontal','volume'].includes(surface.orientation)||!furniture.has(surface.label))continue;
    const xs=surface.points.map(p=>p.x),zs=surface.points.map(p=>p.z),ys=surface.points.map(p=>p.y);
    const x0=Math.min(...xs),x1=Math.max(...xs),z0=Math.min(...zs),z1=Math.max(...zs);
    const obstacle={name:`${surface.label} ${room.obstacles.length+1}`,x:(x0+x1)/2,z:(z0+z1)/2,width:x1-x0,depth:z1-z0,height:Math.max(...ys)};
    if(room.obstacles.some(o=>{
      const overlapX=Math.max(0,Math.min(o.x+o.width/2,x1)-Math.max(o.x-o.width/2,x0));
      const overlapZ=Math.max(0,Math.min(o.z+o.depth/2,z1)-Math.max(o.z-o.depth/2,z0));
      return overlapX*overlapZ/Math.max(.001,Math.min(o.width*o.depth,obstacle.width*obstacle.depth))>.8;
    }))continue;
    try{room=parseRoom({...room,obstacles:[...room.obstacles,obstacle]});}catch{skipped++;}
  }
  if(skipped)warnings.push(`${skipped} surface(s) de meuble ignorée(s), hors limites ou hors contour.`);
  warnings.push('Meubles approximés par des boîtes ; portes, fenêtres et obstacles manquants à compléter.');
  return {room,warnings};
}
