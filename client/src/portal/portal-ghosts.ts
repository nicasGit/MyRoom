import * as THREE from 'three';
import { label } from '../adventure-view';
import { disposeGroup } from '../model-view';
import type { PortalPublic,Vec3 } from '../../../server/src/portal/portal-types.js';

/** Estimated body under a measured head, not a tracked skeleton or collision bound. */
export function ghostBody(){
  const group=new THREE.Group(),material=new THREE.MeshBasicMaterial({color:0x9defff,transparent:true,opacity:.32,depthTest:false,depthWrite:false});
  const head=new THREE.Mesh(new THREE.SphereGeometry(.14,12,8),material);group.add(head);
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.24,.55,4,10),material);body.position.y=-.65;group.add(body);
  const feet=new THREE.Mesh(new THREE.RingGeometry(.3,.34,24),material);feet.rotation.x=-Math.PI/2;group.add(feet);
  group.traverse(node=>node.renderOrder=1800);
  return {group,update(height:number,near:boolean,opacity:number){
    body.scale.y=Math.max(.35,(height-.2)/1.05);body.position.y=-(height-.1)/2;
    feet.position.y=-height+.035;material.color.setHex(near?0xffb86b:0x9defff);material.opacity=opacity;
  }};
}

export class PortalGhosts {
  readonly group=new THREE.Group();
  private views=new Map<number,ReturnType<typeof ghostBody>>();
  private state:PortalPublic|undefined;private receivedAt=0;
  constructor(private nameLabel:(name:string)=>THREE.Object3D=name=>label(name,'#e0fbff')){}
  update(state:PortalPublic,ownSlot:number,head:Vec3,now:number){
    if(this.state?.sessionId!==state.sessionId){for(const view of this.views.values())disposeGroup(view.group);this.views.clear();}
    if(this.state!==state){this.state=state;this.receivedAt=now;}
    for(const view of this.views.values())view.group.visible=false;
    if(!state.active||state.simulation)return;
    for(const ghost of state.ghosts??[]){
      const player=state.players.find(p=>p.slot===ghost.slot),age=ghost.ageMs+Math.max(0,now-this.receivedAt);
      if(ghost.slot===ownSlot||!player?.present||!player.ready||age>=1000||age<0)continue;
      let view=this.views.get(ghost.slot);
      if(!view){view=ghostBody();this.group.add(view.group);this.views.set(ghost.slot,view);}
      if(view.group.userData.name!==player.name){
        for(const child of [...view.group.children])if(child.userData.ghostName)disposeGroup(child);
        const name=this.nameLabel(player.name);name.position.y=.28;name.scale.set(.7,.18,1);name.renderOrder=1801;name.userData.ghostName=true;
        name.traverse(node=>{const material=(node as THREE.Mesh).material;if(material)for(const m of Array.isArray(material)?material:[material]){m.depthTest=false;m.depthWrite=false;}});
        view.group.add(name);view.group.userData.name=player.name;
      }
      const near=Math.hypot(head.x-ghost.head.x,head.z-ghost.head.z)<.9;
      view.group.position.copy(ghost.head);view.group.visible=true;
      view.update(ghost.head.y,near,(near?.55:.32)*Math.min(1,(1000-age)/400));
    }
  }
}
