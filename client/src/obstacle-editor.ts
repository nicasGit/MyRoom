import * as THREE from 'three';
import { parseRoom,type RoomModel } from '../../server/src/scene-schema.js';

type Obstacle=RoomModel['obstacles'][number];
type Hand={side:string;pressed:boolean;position:THREE.Vector3};
const box=(o:Obstacle)=>new THREE.Box3(new THREE.Vector3(o.x-o.width/2,0,o.z-o.depth/2),new THREE.Vector3(o.x+o.width/2,o.height,o.z+o.depth/2));

// Local draft gestures only. The server validates and persists the final room on Save.
export class ObstacleEditor {
  readonly group=new THREE.Group();
  private preview=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0x67e8f9,transparent:true,opacity:.55,depthWrite:false}));
  private active?:{index:number;room:RoomModel;value:Obstacle;base:Obstacle;hands:Hand[]};
  private blocked=false;
  constructor(private commit:(index:number,value:Obstacle)=>void,private notify:(message:string)=>void=()=>{}){
    this.preview.add(new THREE.LineSegments(new THREE.EdgesGeometry(this.preview.geometry),new THREE.LineBasicMaterial({color:0xffffff})));
    this.group.add(this.preview);this.group.visible=false;
  }
  get holding(){return !!this.active;}
  get index(){return this.active?.index;}
  reset(){this.active=undefined;this.group.visible=false;this.blocked=false;}
  update(room:RoomModel|null|undefined,hands:Hand[]){
    if(!room){this.reset();return;}
    if(this.active&&this.active.room!==room){this.reset();return;}
    const pressed=hands.filter(h=>h.pressed);
    if(!this.active){
      for(const hand of pressed){
        let distance=.18,index=-1;
        room.obstacles.forEach((o,i)=>{const d=box(o).distanceToPoint(hand.position);if(d<distance){distance=d;index=i;}});
        if(index<0)continue;
        const value={...room.obstacles[index]};
        this.active={index,room,value,base:{...value},hands:[{...hand,position:hand.position.clone()}]};break;
      }
    }
    const active=this.active;if(!active)return;
    // Missing tracked hands cancel rather than accidentally confirming a change.
    if(active.hands.some(h=>!hands.some(current=>current.side===h.side))){this.reset();return;}
    const joined=pressed.filter(h=>active.hands.some(old=>old.side===h.side)||box(active.value).distanceToPoint(h.position)<.18).slice(0,2);
    if(!joined.length){const {index,value}=active;this.reset();this.commit(index,value);return;}
    if(joined.length!==active.hands.length||joined.some(h=>!active.hands.some(old=>old.side===h.side))){
      active.base={...active.value};active.hands=joined.map(h=>({...h,position:h.position.clone()}));
    }
    const current=active.hands.map(old=>joined.find(h=>h.side===old.side)!);
    const midpoint=(list:Hand[])=>list.reduce((sum,h)=>sum.add(h.position),new THREE.Vector3()).divideScalar(list.length);
    const delta=midpoint(current).sub(midpoint(active.hands)),value={...active.base,x:active.base.x+delta.x,z:active.base.z+delta.z};
    if(current.length===2){
      const span=current[0].position.clone().sub(current[1].position),before=active.hands[0].position.clone().sub(active.hands[1].position);
      value.width=THREE.MathUtils.clamp(active.base.width+Math.abs(span.x)-Math.abs(before.x),.1,20);
      value.depth=THREE.MathUtils.clamp(active.base.depth+Math.abs(span.z)-Math.abs(before.z),.1,20);
      value.height=THREE.MathUtils.clamp(active.base.height+Math.abs(span.y)-Math.abs(before.y),.1,room.height);
    }
    try{
      const obstacles=room.obstacles.map((o,i)=>i===active.index?value:o);parseRoom({...room,obstacles});active.value=value;this.blocked=false;
    }catch{if(!this.blocked)this.notify('Volume hors limites ou incompatible avec les placements. Dernière position valide conservée.');this.blocked=true;}
    const o=active.value;this.group.visible=true;this.preview.position.set(o.x,o.height/2,o.z);this.preview.scale.set(o.width,o.height,o.depth);
  }
  dispose(){this.reset();this.group.traverse(node=>{const mesh=node as THREE.Mesh;mesh.geometry?.dispose();if(mesh.material)(mesh.material as THREE.Material).dispose();});this.group.removeFromParent();}
}
