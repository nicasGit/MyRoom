import { inside,type RoomModel } from '../../../server/src/scene-schema.js';
export function canStand(model:RoomModel,x:number,z:number){return inside({x,z},model.floor)&&!model.obstacles.some(o=>o.height>.2&&Math.abs(x-o.x)<o.width/2+.15&&Math.abs(z-o.z)<o.depth/2+.15);}
export function roomStart(model:RoomModel){
  const xs=model.floor.map(p=>p.x),zs=model.floor.map(p=>p.z),cx=(Math.min(...xs)+Math.max(...xs))/2,cz=(Math.min(...zs)+Math.max(...zs))/2;
  let best:{x:number;z:number}|undefined,distance=Infinity;
  for(let x=Math.min(...xs)+.2;x<Math.max(...xs);x+=.25)for(let z=Math.min(...zs)+.2;z<Math.max(...zs);z+=.25){const d=Math.hypot(x-cx,z-cz);if(d<distance&&canStand(model,x,z)){best={x,z};distance=d;}}
  return best;
}
