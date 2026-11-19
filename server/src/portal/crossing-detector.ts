import type { PortalConfig,Vec3 } from './portal-types.js';
export class CrossingDetector {
  private last:{p:Vec3;at:number}|undefined;
  private armed=false;private intersected=false;
  reset(){this.last=undefined;this.armed=false;this.intersected=false;}
  sample(p:Vec3,at:number,config:PortalConfig['portal'],exitDepth=0.3){
    const nx=Math.sin(config.yaw)*config.direction,nz=Math.cos(config.yaw)*config.direction;
    const local=(q:Vec3)=>({d:(q.x-config.x)*nx+(q.z-config.z)*nz,u:(q.x-config.x)*Math.cos(config.yaw)-(q.z-config.z)*Math.sin(config.yaw)});
    const current=local(p),previous=this.last,valid=(u:number,y:number)=>Math.abs(u)<=config.width/2-0.08&&y>=0.4&&y<=config.height-0.05;
    if(previous&&(at-previous.at>1200||at<=previous.at||Math.hypot(p.x-previous.p.x,p.y-previous.p.y,p.z-previous.p.z)>Math.min(0.8,(at-previous.at)/1000*3+0.1))){this.reset();return false;}
    this.last={p:{...p},at};
    if(current.d>=0.3&&current.d<=config.approach&&valid(current.u,p.y)){this.armed=true;this.intersected=false;}
    if(!this.armed||!previous)return false;
    const before=local(previous.p);
    if(before.d>0&&current.d<=0){const t=before.d/(before.d-current.d),u=before.u+(current.u-before.u)*t,y=previous.p.y+(p.y-previous.p.y)*t;this.intersected=valid(u,y);}
    if(!valid(current.u,p.y)||current.d>config.approach+0.2){this.armed=false;this.intersected=false;return false;}
    if(current.d>=0.1)this.intersected=false;
    if(this.intersected&&current.d<=-exitDepth&&current.d>=-config.exit){this.reset();return true;}
    return false;
  }
}
