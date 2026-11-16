// Pure geometry/schema module shared with the browser. All dimensions are metres.
export type Point2 = { x: number; z: number };
export type Obstacle = { name: string; x: number; z: number; width: number; depth: number; height: number };
export type RoomModel = { id: string; name: string; floor: Point2[]; height: number; obstacles: Obstacle[] };
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
  return {id:r.id,name:r.name.trim(),floor,height:r.height,obstacles};
}
export function parseLibrary(value: unknown): RoomLibrary {
  const library=object(value);
  if(library.version!==1||!Number.isSafeInteger(library.revision)||Number(library.revision)<0||!Array.isArray(library.rooms)||library.rooms.length>20) throw new Error('Bibliothèque invalide.');
  const rooms=library.rooms.map(parseRoom);
  if(new Set(rooms.map(r=>r.id)).size!==rooms.length) throw new Error('Identifiants de pièces dupliqués.');
  if(library.activeId!==null && !rooms.some(r=>r.id===library.activeId)) throw new Error('Pièce active introuvable.');
  return {version:1,revision:library.revision as number,activeId:library.activeId as string|null,rooms};
}
