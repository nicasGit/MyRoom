import { CrossingDetector } from '../../../server/src/portal/crossing-detector.js';
import type { PortalPublic,Vec3 } from '../../../server/src/portal/portal-types.js';

/** Local visual prediction only. Progression always comes from TeamPortal. */
export class PortalWaiting {
  private detector=new CrossingDetector();
  private key='';
  private entered=false;
  private last:{head:Vec3;at:number}|undefined;
  reset(){this.detector.reset();this.entered=false;this.key='';this.last=undefined;}
  update(state:PortalPublic|undefined,slot:number,head:Vec3|undefined,now:number){
    const player=state?.players.find(p=>p.slot===slot);
    if(!state?.active||!head||!player?.present||!player.ready||!['portal-open','transitioning'].includes(state.phase)){
      this.reset();return false;
    }
    const key=JSON.stringify([state.sessionId,slot,state.config.portal]);
    if(key!==this.key){this.reset();this.key=key;}
    if(player.crossed){this.entered=true;return true;}
    if(!state.players.every(p=>p.present&&p.ready)){this.reset();return false;}
    const previous=this.last;
    if(previous&&(now<=previous.at||now-previous.at>1200||Math.hypot(head.x-previous.head.x,head.y-previous.head.y,head.z-previous.head.z)>Math.min(.8,(now-previous.at)/1000*3+.1))){this.reset();return false;}
    this.last={head:{...head},at:now};
    const portal=state.config.portal;
    const distance=((head.x-portal.x)*Math.sin(portal.yaw)+(head.z-portal.z)*Math.cos(portal.yaw))*portal.direction;
    // A tentative head peek is reversible until the server acknowledges passage.
    if(distance>=.05)this.entered=false;
    if(this.detector.sample(head,now,portal,.015))this.entered=true;
    return this.entered;
  }
}
