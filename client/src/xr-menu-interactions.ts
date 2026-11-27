import * as THREE from 'three';
import type { WallMenuView } from './portal/wall-menu-view';
export type MenuHand={side:string;pressed:boolean;position:THREE.Vector3;orientation:THREE.Quaternion;ray?:{origin:THREE.Vector3;direction:THREE.Vector3};dragging?:boolean};
type Panel=Pick<WallMenuView,'group'|'placement'|'distanceTo'|'markMoved'> & Partial<Pick<WallMenuView,'intersection'>>;
export class MenuMover {
  private hold?:{panel:Panel;side:string;offset:THREE.Matrix4};
  private releasedUntil=0;
  get holding(){return !!this.hold;}
  blocksSelect(){return this.holding||performance.now()<this.releasedUntil;}
  reset(){if(this.hold)this.releasedUntil=performance.now()+500;this.hold=undefined;}
  update(panels:Panel[],hands:MenuHand[]){
    if(this.hold){const hand=hands.find(h=>h.side===this.hold!.side);
      if(!hand?.pressed||!panels.includes(this.hold.panel)||!this.hold.panel.group.visible){this.reset();return;}
      const node=this.hold.panel.placement;node.parent?.updateWorldMatrix(true,false);
      const world=new THREE.Matrix4().compose(hand.position,hand.orientation,new THREE.Vector3(1,1,1)).multiply(this.hold.offset);
      if(node.parent)world.premultiply(node.parent.matrixWorld.clone().invert());
      world.decompose(node.position,node.quaternion,node.scale);return;
    }
    // A hand pinch is a menu click. Panel dragging uses the controller grip
    // gesture, exposed separately as `dragging`, so a pinch cannot steal the
    // select event and move the admin panel instead of activating its button.
    for(const hand of hands.filter(h=>h.dragging ?? h.pressed)){
      const panel=panels.filter(p=>p.group.visible&&p.distanceTo(hand.position)<.18).sort((a,b)=>a.distanceTo(hand.position)-b.distanceTo(hand.position))[0];
      if(!panel){
        if(!hand.ray)continue;
        const hit=panels.filter(p=>p.group.visible).map(p=>({panel:p,hit:p.intersection?.(hand.ray!.origin,hand.ray!.direction)})).filter(p=>p.hit&&p.hit.distance<=8).sort((a,b)=>a.hit!.distance-b.hit!.distance)[0];
        if(!hit)continue;
        // Bring the targeted panel to a readable distance, then use the same grip drag.
        const node=hit.panel.placement;node.parent?.updateWorldMatrix(true,false);
        const worldPosition=hand.ray.origin.clone().addScaledVector(hand.ray.direction,.85);
        const worldRotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(hand.ray.origin,worldPosition,new THREE.Vector3(0,1,0)));
        const world=new THREE.Matrix4().compose(worldPosition,worldRotation,node.getWorldScale(new THREE.Vector3()));
        if(node.parent)world.premultiply(node.parent.matrixWorld.clone().invert());
        world.decompose(node.position,node.quaternion,node.scale);node.updateWorldMatrix(true,false);
        const grip=new THREE.Matrix4().compose(hand.position,hand.orientation,new THREE.Vector3(1,1,1));
        this.hold={panel:hit.panel,side:hand.side,offset:grip.invert().multiply(node.matrixWorld)};hit.panel.markMoved();return;
      }
      panel.placement.updateWorldMatrix(true,false);
      const grip=new THREE.Matrix4().compose(hand.position,hand.orientation,new THREE.Vector3(1,1,1));
      this.hold={panel,side:hand.side,offset:grip.invert().multiply(panel.placement.matrixWorld)};panel.markMoved();return;
    }
  }
}
export class MenuPointers {
  readonly group=new THREE.Group();aiming=false;
  private geometry=new THREE.SphereGeometry(.012,10,8);
  private material=new THREE.MeshBasicMaterial({color:0xffe082,depthTest:false,depthWrite:false});
  private dots=[new THREE.Mesh(this.geometry,this.material),new THREE.Mesh(this.geometry,this.material)];
  constructor(){for(const dot of this.dots){dot.visible=false;dot.renderOrder=2002;this.group.add(dot);}}
  update(panels:WallMenuView[],rays:{origin:THREE.Vector3;direction:THREE.Vector3}[]){
    this.aiming=false;this.dots.forEach(dot=>dot.visible=false);
    rays.slice(0,2).forEach((ray,index)=>{const hit=panels.filter(panel=>panel.group.visible).map(panel=>panel.intersection(ray.origin,ray.direction)).filter((hit):hit is THREE.Intersection=>!!hit).sort((a,b)=>a.distance-b.distance)[0];
      if(!hit)return;const dot=this.dots[index];dot.visible=true;dot.position.copy(hit.point).addScaledVector(ray.direction,-.015);this.aiming=true;
    });
  }
  dispose(){this.group.removeFromParent();this.geometry.dispose();this.material.dispose();}
}
