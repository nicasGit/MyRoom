import { inside,type RoomModel } from '../scene-schema.js';
import { STAFF_IDS,type PortalConfig,type StaffId,type Vec3 } from './portal-types.js';

// Deterministic shared layout, kept separate from game ownership and live poses.
export function staffLayout(config:PortalConfig,room:RoomModel|null):Partial<Record<StaffId,Vec3>>{
  if(!room)return {};
  const xs=room.floor.map(p=>p.x),zs=room.floor.map(p=>p.z),candidates:{x:number;z:number}[]=[];
  const p=config.portal,nx=Math.sin(p.yaw)*p.direction,nz=Math.cos(p.yaw)*p.direction;
  const clear=(x:number,z:number)=>[-.3,.3].every(dx=>[-.3,.3].every(dz=>inside({x:x+dx,z:z+dz},room.floor)))&&!room.obstacles.some(o=>Math.abs(x-o.x)<o.width/2+.35&&Math.abs(z-o.z)<o.depth/2+.35);
  for(let x=Math.min(...xs)+.4;x<=Math.max(...xs)-.4;x+=.35)for(let z=Math.min(...zs)+.4;z<=Math.max(...zs)-.4;z+=.35){
    const d=(x-p.x)*nx+(z-p.z)*nz,u=(x-p.x)*Math.cos(p.yaw)-(z-p.z)*Math.sin(p.yaw);
    if(Math.abs(u)<p.width/2+.5&&d>-p.exit-.4&&d<p.approach+.4||!clear(x,z))continue;
    candidates.push({x,z});
  }
  const chosen:{x:number;z:number}[]=[];
  for(let i=0;i<4;i++){
    let best:typeof candidates[number]|undefined,score=-Infinity;
    for(const point of candidates){const distance=chosen.length?Math.min(...chosen.map(other=>Math.hypot(point.x-other.x,point.z-other.z))):-Math.hypot(point.x-config.stand.x,point.z-config.stand.z);
      if(chosen.length&&distance<1)continue;if(distance>score){score=distance;best=point;}}
    if(!best)return {};chosen.push(best);
  }
  const y=Math.min(config.stand.y+.9,room.height-Math.max(...config.staffs.map(s=>s.length))-.3);
  if(y<.5)return {};
  return Object.fromEntries(STAFF_IDS.map((id,i)=>[id,{x:Number(chosen[i].x.toFixed(4)),y,z:Number(chosen[i].z.toFixed(4))}]));
}
