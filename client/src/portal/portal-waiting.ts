import { hasStaffAccess } from './portal-access';
import { crossesEntry } from './entry-window';
import type { PortalPublic,Vec3 } from '../../../server/src/portal/portal-types.js';

/** Local visual prediction only. Progression always comes from TeamPortal. */
export class PortalWaiting {
  private key='';
  private entered=false;
  private exiting=false;
  private last:{head:Vec3;at:number}|undefined;
  reset(){this.entered=false;this.exiting=false;this.key='';this.last=undefined;}
  update(state:PortalPublic|undefined,slot:number,head:Vec3|undefined,now:number){
    const player=state?.players.find(p=>p.slot===slot);
    if(!state?.active||!hasStaffAccess(state,slot)||!player?.present||!['portal-open','transitioning'].includes(state.phase)){
      this.reset();return false;
    }
    const key=JSON.stringify([state.sessionId,slot,state.config.portal]);
    if(key!==this.key){this.reset();this.key=key;}
    if(!head){this.last=undefined;this.exiting=false;return this.entered;}
    const previous=this.last;
    this.last={head:{...head},at:now};
    if(previous&&(now<=previous.at||now-previous.at>1200||Math.hypot(head.x-previous.head.x,head.y-previous.head.y,head.z-previous.head.z)>Math.min(.8,(now-previous.at)/1000*3+.1))){this.exiting=false;return this.entered;}
    const portal=state.config.portal;
    const distance=((head.x-portal.x)*Math.sin(portal.yaw)+(head.z-portal.z)*Math.cos(portal.yaw))*portal.direction;
    // Only traversing the visible hole changes universe. Walking around it does not.
    if(previous&&crossesEntry(previous.head,head,portal)){
      const before=((previous.head.x-portal.x)*Math.sin(portal.yaw)+(previous.head.z-portal.z)*Math.cos(portal.yaw))*portal.direction;
      if(!this.entered&&before>=0&&distance<0)this.entered=true;
      else if(this.entered&&before<=0&&distance>0)this.exiting=true;
    }
    if(distance<=0)this.exiting=false;
    if(this.entered&&this.exiting&&distance>=.005){this.entered=false;this.exiting=false;}
    return this.entered;
  }
}
