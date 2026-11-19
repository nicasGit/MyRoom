import * as THREE from 'three';
import { modelGroup,disposeGroup } from '../model-view';
import { adventureGroup,applyObjectPoses,animateAdventure } from '../adventure-view';
import { portalView } from '../portal/portal-view';
import type { AdventureState } from '../../../server/src/adventure.js';
import type { PortalPublic } from '../../../server/src/portal/portal-types.js';
import { puzzlePanel,type RoomModel } from '../../../server/src/scene-schema.js';
import { canStand,roomStart } from './navigation';
import type { GrabHand } from '../object-grab';
type SimState={model:RoomModel|null;adventure:AdventureState;portal:PortalPublic;slot:number;actor:string};
type Hooks={intro:()=>boolean;position:(position:THREE.Vector3,camera:boolean)=>void;select:(group:THREE.Group,origin:THREE.Vector3,direction:THREE.Vector3,camera:THREE.Camera)=>void;wall:THREE.Group;wallPick:(origin:THREE.Vector3,direction:THREE.Vector3)=>boolean;grab:(group:THREE.Group|undefined,hands:GrabHand[],enabled:boolean)=>void;notify:(text:string)=>void};
type Offset={x:number;y:number;yaw:number;scale:number};
export class SimulatorScene {
  readonly video=document.createElement('video');readonly host=document.createElement('section');
  private surface=document.createElement('div');private message=document.createElement('p');private adjustButton=document.createElement('button');private target=document.createElement('select');
  private scene=new THREE.Scene();private world=new THREE.Group();private camera=new THREE.PerspectiveCamera(65,1,.05,100);private renderer?:THREE.WebGLRenderer;
  private state?:SimState;private room?:THREE.Group;private game?:THREE.Group;private key='';private modelKey='';
  private active=false;private cameraMode=false;private adjusting=false;private raf=0;private previous=0;private yaw=0;private pitch=0;
  private keys=new Set<string>();private moveX=0;private moveZ=0;private pointers=new Map<number,{x:number;y:number}>();private dragged=false;
  private bases=new Map<THREE.Object3D,{position:THREE.Vector3;quaternion:THREE.Quaternion;scale:THREE.Vector3}>();private offsets=new Map<string,Offset>();private synthetic?:GrabHand;private firstGrip=false;
  constructor(parent:HTMLElement,private hooks:Hooks){
    this.host.className='simulator';this.host.hidden=true;this.surface.className='simulator-surface';
    this.video.autoplay=true;this.video.muted=true;this.video.playsInline=true;this.video.setAttribute('webkit-playsinline','');this.video.setAttribute('aria-label','Flux caméra local');
    this.message.setAttribute('role','status');this.target.setAttribute('aria-label','Objet de superposition à placer');
    const reset=document.createElement('button');reset.textContent='Recentrer';reset.onclick=()=>this.recenter();
    this.adjustButton.textContent='Placer la superposition';this.adjustButton.onclick=()=>{this.adjusting=!this.adjusting;this.adjustButton.setAttribute('aria-pressed',String(this.adjusting));};
    this.host.append(this.message,reset,this.adjustButton,this.target,this.surface);this.surface.append(this.video);parent.prepend(this.host);this.scene.add(this.world);
    const joystick=document.createElement('div');joystick.className='simulator-joystick';joystick.textContent='Déplacer';joystick.setAttribute('aria-label','Joystick tactile de déplacement');this.surface.append(joystick);
    const steer=(event:PointerEvent)=>{const rect=joystick.getBoundingClientRect();this.moveX=THREE.MathUtils.clamp((event.clientX-rect.left-rect.width/2)/35,-1,1);this.moveZ=THREE.MathUtils.clamp(-(event.clientY-rect.top-rect.height/2)/35,-1,1);};
    joystick.onpointerdown=event=>{event.preventDefault();joystick.setPointerCapture(event.pointerId);steer(event);};joystick.onpointermove=event=>{if(joystick.hasPointerCapture(event.pointerId))steer(event);};
    joystick.onpointerup=joystick.onpointercancel=joystick.onlostpointercapture=()=>{this.moveX=this.moveZ=0;};
    const stopKeys=()=>{this.keys.clear();this.moveX=this.moveZ=0;};window.addEventListener('blur',stopKeys);
    window.addEventListener('keydown',event=>{if(this.active&&event.target===this.renderer?.domElement){if(['w','a','s','d','z','q','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();this.keys.add(event.key);}}});
    window.addEventListener('keyup',event=>this.keys.delete(event.key));
    new ResizeObserver(()=>this.resize()).observe(this.surface);
    window.addEventListener('pagehide',()=>{this.stop();this.renderer?.dispose();},{once:true});
  }
  receive(state:SimState){this.state=state;const modelKey=JSON.stringify(state.model);if(modelKey!==this.modelKey){this.modelKey=modelKey;this.offsets.clear();this.recenter();if(this.room)disposeGroup(this.room);this.room=state.model?modelGroup(state.model):undefined;if(this.room)this.world.add(this.room);}
    const key=JSON.stringify([modelKey,state.adventure.revision,state.portal.revision,state.actor]);if(key!==this.key){this.key=key;if(this.game)disposeGroup(this.game);this.game=state.model?(this.hooks.intro()?portalView(state.portal,state.slot):adventureGroup(state.model,state.adventure,state.actor)):undefined;if(this.game)this.world.add(this.game);this.bases.clear();for(const node of Object.values(this.game?.userData.grabbables??{}) as THREE.Object3D[])this.bases.set(node,{position:node.position.clone(),quaternion:node.quaternion.clone(),scale:node.scale.clone()});this.options();}
  }
  start(camera:boolean){
    this.cameraMode=camera;this.host.hidden=false;this.video.hidden=!camera;this.adjustButton.hidden=this.target.hidden=!camera;
    this.message.textContent=camera?'Superposition caméra — sans ancrage spatial. Position virtuelle au joystick ; placer : glisser, pincer et tourner.':'Simulation 3D · WASD/ZQSD/flèches ou joystick ; glisser pour regarder ; toucher pour interagir.';
    this.scene.background=camera?null:new THREE.Color(0x102035);this.active=true;
    if(!this.renderer){this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));const canvas=this.renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','Scène MyRoom interactive');this.surface.append(canvas);this.bindCanvas(canvas);}
    this.hooks.wall.position.set(0,0,0);this.hooks.wall.rotation.set(0,0,0);this.world.add(this.hooks.wall);this.resize();this.previous=0;cancelAnimationFrame(this.raf);this.raf=requestAnimationFrame(this.frame);
  }
  stop(){this.active=false;cancelAnimationFrame(this.raf);this.host.hidden=true;this.keys.clear();this.pointers.clear();this.moveX=this.moveZ=0;this.synthetic=undefined;this.hooks.grab(this.game,[],false);this.hooks.wall.removeFromParent();}
  recenter(){this.offsets.clear();this.world.position.set(0,0,0);this.world.rotation.set(0,0,0);this.world.scale.setScalar(1);if(!this.state?.model)return;const p=roomStart(this.state.model);if(!p)return;
    this.camera.position.set(p.x,Math.min(1.6,this.state.model.height-.1),p.z);this.pitch=0;const panel=puzzlePanel(this.state.model);this.yaw=panel?Math.atan2(-(panel.position.x-p.x),-(panel.position.z-p.z)):0;this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');
  }
  private resize(){if(!this.renderer)return;const width=this.surface.clientWidth||640,height=this.surface.clientHeight||480;this.renderer.setSize(width,height);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();}
  private options(){const current=this.target.value;this.target.replaceChildren();for(const id of ['scene',...Object.keys(this.game?.userData.grabbables??{})]){const option=document.createElement('option');option.value=id;option.textContent=id==='scene'?'Ensemble des objets':id;this.target.append(option);}if(Array.from(this.target.options).some(o=>o.value===current))this.target.value=current;}
  private bindCanvas(canvas:HTMLCanvasElement){
    canvas.onpointerdown=event=>{canvas.focus();canvas.setPointerCapture(event.pointerId);this.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});this.dragged=this.pointers.size>1;};
    canvas.onpointermove=event=>{const previous=this.pointers.get(event.pointerId);if(!previous)return;
      const dx=event.clientX-previous.x,dy=event.clientY-previous.y;if(Math.abs(dx)+Math.abs(dy)>2)this.dragged=true;
      if(this.cameraMode&&this.adjusting){const id=this.target.value||'scene',offset=this.offsets.get(id)??{x:0,y:0,yaw:0,scale:1};
        const other=[...this.pointers].find(([key])=>key!==event.pointerId)?.[1];if(other){const before=Math.hypot(previous.x-other.x,previous.y-other.y),after=Math.hypot(event.clientX-other.x,event.clientY-other.y);if(before>10){offset.scale=THREE.MathUtils.clamp(offset.scale*after/before,.15,4);offset.yaw+=Math.atan2(event.clientY-other.y,event.clientX-other.x)-Math.atan2(previous.y-other.y,previous.x-other.x);}}
        else{offset.x+=dx*.004;offset.y-=dy*.004;}this.offsets.set(id,offset);
      }else{this.yaw-=dx*.005;this.pitch=THREE.MathUtils.clamp(this.pitch-dy*.005,-1.25,1.25);}
      this.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    };
    canvas.onpointerup=event=>{this.pointers.delete(event.pointerId);if(!this.dragged&&!(this.cameraMode&&this.adjusting))this.select(event.clientX,event.clientY);};canvas.onpointercancel=event=>{this.pointers.delete(event.pointerId);this.dragged=true;};
  }
  private select(x:number,y:number){if(!this.renderer||!this.game||!this.state)return;const rect=this.renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((x-rect.left)/rect.width*2-1,-(y-rect.top)/rect.height*2+1),this.camera);
    if(this.hooks.wallPick(ray.ray.origin,ray.ray.direction))return;
    if(this.hooks.intro()){
      const id=`staff${this.state.slot}`,node=this.game.userData.grabbables?.[id] as THREE.Object3D|undefined;
      if(node&&ray.intersectObject(node,true).length){const pose=this.state.adventure.objects?.poses[id as 'staff1'];if(!pose||Math.hypot(pose.x-this.camera.position.x,pose.z-this.camera.position.z)>1.3){this.hooks.notify('Approchez votre bâton au joystick avant de le prendre.');return;}
        this.synthetic={side:'right',pressed:true,position:new THREE.Vector3(pose.x,pose.y+.3,pose.z),yaw:0};this.firstGrip=true;return;}
    }
    this.hooks.select(this.game,ray.ray.origin,ray.ray.direction,this.camera);
  }
  private frame=(time:number)=>{
    if(!this.active||!this.renderer)return;const dt=this.previous?Math.min(.05,(time-this.previous)/1000):0;this.previous=time;
    const model=this.state?.model;
    if(model){const forward=this.moveZ+Number(this.keys.has('w')||this.keys.has('z')||this.keys.has('ArrowUp'))-Number(this.keys.has('s')||this.keys.has('ArrowDown'));
      const right=this.moveX+Number(this.keys.has('d')||this.keys.has('ArrowRight'))-Number(this.keys.has('a')||this.keys.has('q')||this.keys.has('ArrowLeft'));
      const magnitude=Math.max(1,Math.hypot(forward,right)),x=this.camera.position.x+(Math.cos(this.yaw)*right-Math.sin(this.yaw)*forward)/magnitude*dt*1.4,z=this.camera.position.z+(-Math.sin(this.yaw)*right-Math.cos(this.yaw)*forward)/magnitude*dt*1.4;
      if(canStand(model,x,z)){this.camera.position.x=x;this.camera.position.z=z;}this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');this.hooks.position(this.camera.position,this.cameraMode);
    }
    if(this.room)this.room.visible=!this.cameraMode;this.hooks.wall.visible=this.hooks.intro()&&!!model;
    for(const [node,base] of this.bases){node.position.copy(base.position);node.quaternion.copy(base.quaternion);node.scale.copy(base.scale);}if(this.game){applyObjectPoses(this.game,this.state?.adventure.objects);animateAdventure(this.game,time);this.game.userData.animatePortal?.(Date.now());}
    this.world.position.set(0,0,0);this.world.rotation.set(0,0,0);this.world.scale.setScalar(1);
    for(const [id,offset] of this.offsets){const object=id==='scene'?this.world:this.game?.userData.grabbables?.[id];if(object){object.position.x+=offset.x;object.position.y+=offset.y;object.rotation.y+=offset.yaw;object.scale.setScalar(offset.scale);}}
    if(this.synthetic){this.hooks.grab(this.game,[{...this.synthetic,pressed:this.firstGrip}],!!this.state?.portal.active);this.firstGrip=false;}else this.hooks.grab(this.game,[],false);
    this.renderer.render(this.scene,this.camera);this.raf=requestAnimationFrame(this.frame);
  };
}
