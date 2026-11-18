// Pure geometry/schema module shared with the browser. All dimensions are metres.
export type Point2 = { x: number; z: number };
export type Obstacle = { name: string; x: number; z: number; width: number; depth: number; height: number };
export type Opening = { name:string; kind:'door'|'window'; wall:number; offset:number; width:number; height:number; sill:number };
export const PUZZLE_ITEMS=['chest','sun','tree','moon','star','table','four','eight','king'] as const;
export type PuzzleItem=typeof PUZZLE_ITEMS[number];
export type WallPanel={wall:number;offset:number};
export type PuzzleLayout={points:Record<PuzzleItem,Point2>;panel?:WallPanel;poses?:Partial<Record<PuzzleItem,{y:number;yaw:number}>>};
export type RoomModel = { id: string; name: string; floor: Point2[]; height: number; obstacles: Obstacle[]; openings:Opening[]; puzzles?:PuzzleLayout };
export type RoomLibrary = { version: 1; revision: number; activeId: string | null; rooms: RoomModel[] };
const number = (n: unknown, min: number, max: number): n is number => typeof n === 'number' && Number.isFinite(n) && n >= min && n <= max;
const text = (n: unknown): n is string => typeof n === 'string' && n.trim().length > 0 && n.length <= 64;
function object(n: unknown): Record<string, unknown> {
  if (!n || typeof n !== 'object' || Array.isArray(n)) throw new Error('Objet attendu.');
  return n as Record<string, unknown>;
}
function cross(a: Point2, b: Point2, c: Point2) { return (b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x); }
function onSegment(a: Point2, b: Point2, p: Point2) {
  return Math.abs(cross(a,b,p)) < 1e-8 && p.x >= Math.min(a.x,b.x)-1e-8 && p.x <= Math.max(a.x,b.x)+1e-8 && p.z >= Math.min(a.z,b.z)-1e-8 && p.z <= Math.max(a.z,b.z)+1e-8;
}
function intersects(a: Point2,b: Point2,c: Point2,d: Point2) {
  return (cross(a,b,c)*cross(a,b,d)<0 && cross(c,d,a)*cross(c,d,b)<0) || onSegment(a,b,c) || onSegment(a,b,d) || onSegment(c,d,a) || onSegment(c,d,b);
}
export function area(points: Point2[]) {
  return Math.abs(points.reduce((sum,p,i) => { const q = points[(i+1)%points.length]; return sum+p.x*q.z-q.x*p.z; },0))/2;
}
export function inside(p: Point2, polygon: Point2[]) {
  let result = false;
  for (let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const a=polygon[j],b=polygon[i];
    if (onSegment(a,b,p)) return true;
    if ((a.z>p.z)!==(b.z>p.z) && p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x) result=!result;
  }
  return result;
}
export function parseFloor(value: unknown): Point2[] {
  if (!Array.isArray(value) || value.length<3 || value.length>32) throw new Error('Placer entre 3 et 32 coins de pièce.');
  const points = value.map(item => { const p=object(item); if (!number(p.x,-30,30)||!number(p.z,-30,30)) throw new Error('Coordonnées hors limites (±30 m).'); return {x:p.x,z:p.z}; });
  for (let i=0;i<points.length;i++) {
    const a=points[i],b=points[(i+1)%points.length];
    if (Math.hypot(a.x-b.x,a.z-b.z)<0.15) throw new Error('Deux coins sont trop proches (15 cm minimum).');
    if (Math.abs(cross(points[(i+points.length-1)%points.length],a,b))<1e-6) throw new Error('Supprimer les coins alignés ou superposés.');
    for(let j=i+1;j<points.length;j++) {
      if (j===i+1 || (i===0&&j===points.length-1)) continue;
      if(intersects(a,b,points[j],points[(j+1)%points.length])) throw new Error('Le contour se croise. Replacer les coins dans l’ordre.');
    }
  }
  if(area(points)<0.5||area(points)>900) throw new Error('Surface autorisée : 0,5 à 900 m².');
  return points;
}
export function parseRoom(value: unknown): RoomModel {
  const r=object(value);
  if(typeof r.id!=='string'|| !/^[a-zA-Z0-9-]{1,64}$/.test(r.id)||!text(r.name)) throw new Error('Nom ou identifiant de pièce invalide.');
  const floor=parseFloor(r.floor);
  if(!number(r.height,0.5,6)) throw new Error('Hauteur des murs : 0,5 à 6 mètres.');
  const height=r.height;
  if(!Array.isArray(r.obstacles)||r.obstacles.length>32) throw new Error('Maximum 32 obstacles par pièce.');
  const obstacles=r.obstacles.map(item => {
    const o=object(item);
    if(!text(o.name)||!number(o.x,-30,30)||!number(o.z,-30,30)||!number(o.width,0.1,20)||!number(o.depth,0.1,20)||!number(o.height,0.1,height)) throw new Error('Obstacle invalide : dimensions, hauteur ou nom.');
    const obstacle={ name:o.name.trim(),x:o.x,z:o.z,width:o.width,depth:o.depth,height:o.height };
    const corners=[{x:o.x-o.width/2,z:o.z-o.depth/2},{x:o.x+o.width/2,z:o.z-o.depth/2},{x:o.x+o.width/2,z:o.z+o.depth/2},{x:o.x-o.width/2,z:o.z+o.depth/2}];
    if(!corners.every(p=>inside(p,floor))) throw new Error('Un obstacle dépasse du contour de la pièce.');
    // Check edge midpoints and boundary crossings for concave rooms, too.
    for(let i=0;i<4;i++) {
      const a=corners[i],b=corners[(i+1)%4];
      if(!inside({x:(a.x+b.x)/2,z:(a.z+b.z)/2},floor)) throw new Error('Obstacle hors de la pièce.');
      for(let j=0;j<floor.length;j++) {
        const c=floor[j],d=floor[(j+1)%floor.length];
        if(cross(a,b,c)*cross(a,b,d)<-1e-8 && cross(c,d,a)*cross(c,d,b)<-1e-8) throw new Error('Obstacle traversant un mur.');
      }
    }
    return obstacle;
  });
  const rawOpenings=r.openings===undefined?[]:r.openings;
  if(!Array.isArray(rawOpenings)||rawOpenings.length>32)throw new Error('Maximum 32 ouvertures par pièce.');
  const openings:Opening[]=rawOpenings.map(item=>{
    const o=object(item);
    if(!text(o.name)||(o.kind!=='door'&&o.kind!=='window')||!Number.isInteger(o.wall)||!number(o.wall,0,floor.length-1))throw new Error('Nom, type ou mur de l’ouverture invalide.');
    const a=floor[o.wall],b=floor[(o.wall+1)%floor.length],length=Math.hypot(b.x-a.x,b.z-a.z);
    if(!number(o.offset,0,length)||!number(o.width,0.15,length)||!number(o.height,0.15,height)||!number(o.sill,0,height)||o.offset+o.width>length+1e-8||o.sill+o.height>height+1e-8)throw new Error('L’ouverture doit tenir entièrement dans le mur (dimensions en mètres).');
    if(o.kind==='door'&&o.sill!==0)throw new Error('Une porte doit commencer au sol.');
    return {name:o.name.trim(),kind:o.kind,wall:o.wall,offset:o.offset,width:o.width,height:o.height,sill:o.sill};
  });
  for(let i=0;i<openings.length;i++)for(let j=i+1;j<openings.length;j++){
    const a=openings[i],b=openings[j];
    if(a.wall===b.wall&&Math.min(a.offset+a.width,b.offset+b.width)-Math.max(a.offset,b.offset)>1e-8&&Math.min(a.sill+a.height,b.sill+b.height)-Math.max(a.sill,b.sill)>1e-8)throw new Error('Deux ouvertures se chevauchent sur le même mur.');
  }
  const room:RoomModel={id:r.id,name:r.name.trim(),floor,height:r.height,obstacles,openings};
  if(r.puzzles!==undefined){
    const layout=object(r.puzzles),raw=object(layout.points);
    if(Object.keys(layout).some(key=>!['points','panel','poses'].includes(key))||Object.keys(raw).length!==PUZZLE_ITEMS.length)throw new Error('Placer les neuf éléments des énigmes.');
    const points={} as Record<PuzzleItem,Point2>;
    for(const id of PUZZLE_ITEMS){
      const p=object(raw[id]);
      const rawPose=layout.poses===undefined?undefined:object(layout.poses)[id],baseY=rawPose===undefined?0:object(rawPose).y;
      const supports=typeof baseY==='number'?room.obstacles.filter(o=>baseY<o.height-0.02):room.obstacles;
      if(Object.keys(p).length!==2||!number(p.x,-30,30)||!number(p.z,-30,30)||!canPlacePuzzlePoint({x:p.x,z:p.z},{...room,obstacles:supports}))throw new Error(`Position invalide pour ${id} : rester dans la pièce, hors des obstacles, avec 20 cm de marge.`);
      points[id]={x:p.x,z:p.z};
      for(const other of Object.values(points))if(other!==points[id]&&Math.hypot(other.x-p.x,other.z-p.z)<0.6)throw new Error('Écarter les éléments des énigmes d’au moins 60 cm.');
    }
    room.puzzles={points};
    if(layout.poses!==undefined){const poses=object(layout.poses);if(Object.keys(poses).some(id=>!PUZZLE_ITEMS.includes(id as PuzzleItem)))throw new Error('Objet de pose inconnu.');room.puzzles.poses={};for(const id of PUZZLE_ITEMS)if(poses[id]!==undefined){const pose=object(poses[id]);if(Object.keys(pose).sort().join(',')!=='y,yaw'||!number(pose.y,0,height-0.2)||!number(pose.yaw,-Math.PI,Math.PI))throw new Error('Pose invalide.');room.puzzles.poses[id]={y:pose.y,yaw:pose.yaw};}}
    if(layout.panel!==undefined){
      const panel=object(layout.panel);
      if(Object.keys(panel).sort().join(',')!=='offset,wall'||!Number.isSafeInteger(panel.wall)||!number(panel.offset,0,100))throw new Error('Position du panneau mural invalide.');
      room.puzzles.panel={wall:panel.wall as number,offset:panel.offset};
      panelPose(room,room.puzzles.panel);
    }else{const proposed=findPuzzlePanel(room);if(proposed)room.puzzles.panel=proposed;}
  }
  return room;
}
export function canPlacePuzzlePoint(p:Point2,room:Pick<RoomModel,'floor'|'obstacles'>){
  return [-0.2,0.2].every(x=>[-0.2,0.2].every(z=>inside({x:p.x+x,z:p.z+z},room.floor)))&&inside(p,room.floor)&&!room.obstacles.some(o=>Math.abs(p.x-o.x)<o.width/2+0.2&&Math.abs(p.z-o.z)<o.depth/2+0.2);
}
// A one-metre panel centred 1.35 m above the floor, facing the room interior.
export function panelPose(room:RoomModel,panel:WallPanel){
  const a=room.floor[panel.wall],b=room.floor[(panel.wall+1)%room.floor.length];
  if(!a||!b||room.height<1.8)throw new Error('Mur trop bas ou introuvable pour le panneau.');
  const length=Math.hypot(b.x-a.x,b.z-a.z),ux=(b.x-a.x)/length,uz=(b.z-a.z)/length;
  if(panel.offset<0.6||panel.offset>length-0.6)throw new Error('Le panneau doit rester à 60 cm des coins du mur.');
  const mid={x:a.x+ux*panel.offset,z:a.z+uz*panel.offset};
  let nx=-uz,nz=ux;if(!inside({x:mid.x+nx*0.08,z:mid.z+nz*0.08},room.floor)){nx=-nx;nz=-nz;}
  const position={x:mid.x+nx*0.08,z:mid.z+nz*0.08};
  if(![-0.5,0,0.5].every(d=>inside({x:position.x+ux*d,z:position.z+uz*d},room.floor)))throw new Error('Panneau hors du contour.');
  if(room.openings.some(o=>o.wall===panel.wall&&Math.min(o.offset+o.width,panel.offset+0.5)>Math.max(o.offset,panel.offset-0.5)&&Math.min(o.sill+o.height,1.75)>Math.max(o.sill,0.95)))throw new Error('Le panneau chevauche une porte ou une fenêtre.');
  if([-0.5,0,0.5].some(d=>room.obstacles.some(o=>Math.abs(position.x+ux*d-o.x)<o.width/2+0.15&&Math.abs(position.z+uz*d-o.z)<o.depth/2+0.15)))throw new Error('Le panneau rencontre un obstacle déclaré.');
  return {position,yaw:Math.atan2(nx,nz),height:1.35};
}
export function findPuzzlePanel(room:RoomModel,target:Point2=room.puzzles?.points.chest??room.floor[0]):WallPanel|undefined{
  const candidates:{panel:WallPanel;distance:number}[]=[];
  room.floor.forEach((a,wall)=>{
    const b=room.floor[(wall+1)%room.floor.length],length=Math.hypot(b.x-a.x,b.z-a.z);
    const projection=((target.x-a.x)*(b.x-a.x)+(target.z-a.z)*(b.z-a.z))/length;
    const offsets=[Math.max(0.6,Math.min(length-0.6,projection))];
    for(let offset=0.6;offset<=length-0.6;offset+=0.25)offsets.push(offset);
    for(const offset of offsets){const panel={wall,offset:Number(offset.toFixed(3))};try{const pose=panelPose(room,panel);candidates.push({panel,distance:Math.hypot(pose.position.x-target.x,pose.position.z-target.z)});}catch{/* Try another unobstructed wall segment. */}}
  });
  return candidates.sort((a,b)=>a.distance-b.distance)[0]?.panel;
}
export function puzzlePanel(room:RoomModel){const panel=room.puzzles?.panel??findPuzzlePanel(room);return panel?{panel,...panelPose(room,panel)}:undefined;}
export function suggestPuzzleLayout(room:RoomModel,random:()=>number=Math.random):PuzzleLayout{
  const xs=room.floor.map(p=>p.x),zs=room.floor.map(p=>p.z),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
  const step=Math.max(0.35,Math.max(maxX-minX,maxZ-minZ)/60),candidates:Point2[]=[];
  for(let x=minX+0.25;x<maxX;x+=step)for(let z=minZ+0.25;z<maxZ;z+=step){const p={x:Number(x.toFixed(3)),z:Number(z.toFixed(3))};if(canPlacePuzzlePoint(p,room))candidates.push(p);}
  const chosen:Point2[]=[],center={x:(minX+maxX)/2,z:(minZ+maxZ)/2},points={} as Record<PuzzleItem,Point2>;
  const rotation=random()*Math.PI*2;
  const ordered:PuzzleItem[]=['chest','table','sun','tree','moon','star','four','eight','king'];
  for(const [index,id] of ordered.entries()){
    const angle=rotation+(index-2)*Math.PI*2/7,radius=0.65+random()*0.2;
    const target=index<2?center:{x:center.x+Math.cos(angle)*(maxX-minX)*radius/2,z:center.z+Math.sin(angle)*(maxZ-minZ)*radius/2};
    candidates.sort((a,b)=>{
      const score=(p:Point2)=>chosen.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<(id==='table'?1.2:0.6))?-Infinity:-Math.hypot(p.x-target.x,p.z-target.z);
      return score(b)-score(a);
    });
    const p=candidates.shift();if(!p||chosen.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<0.6))throw new Error('Pas assez de place libre pour neuf éléments. Replacer les obstacles ou choisir une pièce plus grande.');
    chosen.push(p);points[id]=p;
  }
  return parseRoom({...room,puzzles:{points}}).puzzles!;
}
// Solid rectangular panels around holes, in wall-local coordinates (x from first corner).
export function wallPanels(length:number,height:number,openings:Opening[]){
  const cuts=[...new Set([0,length,...openings.flatMap(o=>[o.offset,o.offset+o.width])])].sort((a,b)=>a-b);
  const panels:{offset:number;width:number;bottom:number;height:number}[]=[];
  for(let i=0;i<cuts.length-1;i++){
    const x=cuts[i],end=cuts[i+1];if(end-x<1e-8)continue;
    const middle=(x+end)/2;
    const holes=openings.filter(o=>middle>o.offset&&middle<o.offset+o.width).sort((a,b)=>a.sill-b.sill);
    let bottom=0;
    for(const hole of holes){if(hole.sill-bottom>1e-8)panels.push({offset:x,width:end-x,bottom,height:hole.sill-bottom});bottom=Math.max(bottom,hole.sill+hole.height);}
    if(height-bottom>1e-8)panels.push({offset:x,width:end-x,bottom,height:height-bottom});
  }
  return panels;
}
export function parseLibrary(value: unknown): RoomLibrary {
  const library=object(value);
  if(library.version!==1||!Number.isSafeInteger(library.revision)||Number(library.revision)<0||!Array.isArray(library.rooms)||library.rooms.length>20) throw new Error('Bibliothèque invalide.');
  const rooms=library.rooms.map(parseRoom);
  if(new Set(rooms.map(r=>r.id)).size!==rooms.length) throw new Error('Identifiants de pièces dupliqués.');
  if(library.activeId!==null && !rooms.some(r=>r.id===library.activeId)) throw new Error('Pièce active introuvable.');
  return {version:1,revision:library.revision as number,activeId:library.activeId as string|null,rooms};
}
