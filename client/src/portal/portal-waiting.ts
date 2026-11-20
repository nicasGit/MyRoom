import { hasStaffAccess } from './portal-access';
import type { PortalPublic,Vec3 } from '../../../server/src/portal/portal-types.js';

/** Local visual prediction only. Progression always comes from TeamPortal. */
export class PortalWaiting {
  private key='';
  private entered=false;
  private last:{head:Vec3;at:number}|undefined;
  reset(){this.entered=false;this.key='';this.last=undefined;}
  update(state:PortalPublic|undefined,slot:number,head:Vec3|undefined,now:number){
    const player=state?.players.find(p=>p.slot===slot);
    if(!state?.active||!hasStaffAccess(state,slot)||!head||!player?.present||!player.ready||!['portal-open','transitioning'].includes(state.phase)){
      this.reset();return false;
    }
    const key=JSON.stringify([state.sessionId,slot,state.config.portal]);
    if(key!==this.key){this.reset();this.key=key;}
    const previous=this.last;
    if(previous&&(now<=previous.at||now-previous.at>1200||Math.hypot(head.x-previous.head.x,head.y-previous.head.y,head.z-previous.head.z)>Math.min(.8,(now-previous.at)/1000*3+.1))){this.reset();return false;}
    this.last={head:{...head},at:now};
    const portal=state.config.portal;
    const distance=((head.x-portal.x)*Math.sin(portal.yaw)+(head.z-portal.z)*Math.cos(portal.yaw))*portal.direction;
    // Visual immersion follows this head, even after server acknowledgement.
    // This never changes the authoritative passage/progression flags.
    if(distance>=.005)this.entered=false;
    if(distance<=0){
      if(player.crossed)this.entered=true;
      else if(previous){
        const before=((previous.head.x-portal.x)*Math.sin(portal.yaw)+(previous.head.z-portal.z)*Math.cos(portal.yaw))*portal.direction;
        if(before>=0){
          const t=before/(before-distance),x=previous.head.x+(head.x-previous.head.x)*t,z=previous.head.z+(head.z-previous.head.z)*t,y=previous.head.y+(head.y-previous.head.y)*t;
          const horizontal=(x-portal.x)*Math.cos(portal.yaw)-(z-portal.z)*Math.sin(portal.yaw);
          if(Math.abs(horizontal)<=portal.width/2-.08&&y>=.4&&y<=portal.height-.05)this.entered=true;
        }
      }
    }
    return this.entered;
  }
}
