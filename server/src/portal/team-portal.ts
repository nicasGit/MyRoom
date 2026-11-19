import { CrossingDetector } from './crossing-detector.js';
import { DEFAULT_PORTAL,STAFF_IDS,parsePortalConfig,validatePlacement,type PortalConfig,type PortalPublic,type PortalCommand,type Vec3 } from './portal-types.js';
import type { RoomModel } from '../scene-schema.js';
import { staffLayout } from './staff-layout.js';
import type { DisplayMode } from '../display-modes.js';
export class TeamPortal {
  private state:PortalPublic={serverNow:0,sessionId:'inactive',revision:0,active:false,phase:'waiting',config:structuredClone(DEFAULT_PORTAL),simulation:false,startedAt:0,players:[]};
  private pose=new Map<number,{p:Vec3;at:number;seq:number}>();
  private detectors=Array.from({length:4},()=>new CrossingDetector());
  private seen=new Set<string>();private launched=false;
  private room:RoomModel|null=null;private layoutKey='';private positions:ReturnType<typeof staffLayout>={};
  setRoom(room:RoomModel|null){this.room=room;const key=JSON.stringify([room,this.state.config]);if(key!==this.layoutKey){this.layoutKey=key;this.positions=staffLayout(this.state.config,room);}}
  snapshot(){this.setRoom(this.room);return {...structuredClone(this.state),staffPositions:structuredClone(this.positions),serverNow:Date.now()};}
  get active(){return this.state.active;}
  prepare(names:string[],slots:number[]){
    if(this.active||this.state.phase!=='waiting')return;
    const players=names.slice(0,this.state.config.playerCount??4).map((name,i)=>({slot:i+1,name,present:slots.includes(i+1),ready:false,claimed:false,crossed:false}));
    if(JSON.stringify(players)!==JSON.stringify(this.state.players)){this.state.players=players;this.state.revision++;}
  }
  configure(config:PortalConfig){if(this.active)throw Error('Arrêtez l’introduction avant de modifier son placement.');this.state.config=parsePortalConfig(config);this.state.revision++;}
  begin(sessionId:string,names:string[],room:RoomModel|null,now:number,simulation=false){
    if(this.active)throw Error('Introduction déjà active.');validatePlacement(this.state.config,room);this.setRoom(room);
    if(Object.keys(this.positions).length!==(this.state.config.playerCount??4))throw Error('Pas assez de place libre pour disperser les bâtons du groupe. Ajustez le portail ou le relevé de pièce.');
    if(!this.state.config.confirmed)throw Error('L’organisateur doit vérifier et confirmer l’espace physique.');
    this.pose.clear();this.seen.clear();this.detectors.forEach(d=>d.reset());this.launched=false;
    this.state={...this.state,sessionId,revision:this.state.revision+1,active:true,phase:'waiting',simulation,startedAt:now,players:names.slice(0,this.state.config.playerCount??4).map((name,i)=>({slot:i+1,name,present:false,ready:false,claimed:false,crossed:false}))};
  }
  cancel(){this.state.active=false;this.state.phase='waiting';this.state.revision++;this.pose.clear();this.detectors.forEach(d=>d.reset());}
  presence(slots:number[],now:number){
    let changed=false;
    for(const p of this.state.players){const present=this.state.simulation||slots.includes(p.slot),ready=present&&(this.state.simulation||!!this.pose.get(p.slot)&&now-this.pose.get(p.slot)!.at<1500);
      if(p.present!==present||p.ready!==ready){p.present=present;p.ready=ready;changed=true;}
      if(!ready)this.detectors[p.slot-1].reset();if(!present)this.pose.delete(p.slot);
    }
    if(changed)this.state.revision++;return changed;
  }
  claim(slot:number,target:string){
    const p=this.state.players[slot-1];if(!this.active||!['collecting','opening','portal-open'].includes(this.state.phase)||target!==STAFF_IDS[slot-1]||!p?.ready)throw Error('Bâton réservé à votre place ; suivi calibré requis.');
    if(p.claimed)throw Error('Bâton déjà attribué.');p.claimed=true;this.state.revision++;
  }
  canGrab(slot:number,target:string){const p=this.state.players[slot-1];return this.active&&['collecting','opening','portal-open'].includes(this.state.phase)&&target===STAFF_IDS[slot-1]&&!!p?.ready;}
  act(c:PortalCommand,slot:number,room:RoomModel|null,now:number,mode:DisplayMode='quest-webxr'){
    if(!this.active||c.sessionId!==this.state.sessionId||this.state.simulation)throw Error('Session portail incompatible.');
    if(this.seen.has(c.commandId))throw Error('Commande déjà reçue.');
    if(c.action!=='pose'&&c.revision!==this.state.revision||c.revision>this.state.revision)throw Error('Révision portail périmée.');
    const p=this.state.players[slot-1];if(!p?.present)throw Error('Place absente.');
    const previous=this.pose.get(slot);if(previous&&c.seq<=previous.seq)throw Error('Séquence déjà reçue.');
    if(c.action==='pose'){
      const v=c.position!;if(!room||v.y<0.4||v.y>Math.min(room.height,3)||!room.floor.length)throw Error('Pose de tête invalide.');
      // Coherence is checked on server arrival times, never trusting client timestamps.
      if(previous&&(now<=previous.at||now-previous.at<100||Math.hypot(v.x-previous.p.x,v.y-previous.p.y,v.z-previous.p.z)>Math.min(0.8,(now-previous.at)/1000*3+0.1)))throw Error('Déplacement incohérent ou trop fréquent.');
      if(!insideRoom(v,room.floor))throw Error('Pose hors de la pièce.');
      this.pose.set(slot,{p:v,at:now,seq:c.seq});if(!p.ready){p.ready=true;this.state.revision++;}
      if(mode!=='camera-ar'&&this.state.phase==='portal-open'&&this.allReady()&&!p.crossed&&this.detectors[slot-1].sample(v,now,this.state.config.portal))this.cross(slot,mode==='virtual-3d'?'virtual-crossing':'physical-xr');
    }else if(c.action==='unready'){this.pose.delete(slot);p.ready=false;this.detectors[slot-1].reset();this.state.revision++;}
    else {if(!p.ready)throw Error('Signalez votre présence avant la confirmation accessible.');this.cross(slot,mode==='camera-ar'?'camera-confirmation':'accessible-confirmation');}
    this.seen.add(c.commandId);if(this.seen.size>512)this.seen.delete(this.seen.values().next().value!);
  }
  clearTracking(slot:number){this.pose.delete(slot);this.detectors[slot-1]?.reset();const player=this.state.players[slot-1];if(player?.ready){player.ready=false;this.state.revision++;}}
  private allReady(){return this.state.players.length===(this.state.config.playerCount??4)&&this.state.players.every(p=>p.present&&p.ready);}
  private cross(slot:number,method:import('./portal-types.js').PassageMethod='simulation'){const p=this.state.players[slot-1];if(this.state.phase!=='portal-open'||!this.allReady()||!p||p.crossed)throw Error('Passage déjà validé ou portail indisponible.');p.crossed=true;p.validationMethod=method;this.state.revision++;}
  adminCross(slot:number){this.cross(slot,'admin');}
  simulate(slot:number,cross:boolean){if(!this.state.simulation||!this.active)throw Error('Simulation PC inactive.');if(cross)this.cross(slot);else this.claim(slot,STAFF_IDS[slot-1]);}
  skip(){if(!this.active)throw Error('Introduction inactive.');this.state.phase='transitioning';this.state.startedAt=0;this.state.players.forEach(p=>{p.present=true;p.ready=true;p.crossed=true;p.validationMethod='admin';});this.state.simulation=true;this.state.revision++;}
  tick(now:number,launch:()=>void){
    if(!this.active)return false;const old=this.state.revision;
    if(this.state.phase==='waiting'&&this.state.players.some(p=>p.ready)){this.state.phase='collecting';this.state.revision++;}
    if(this.state.phase==='collecting'&&this.state.players.some(p=>p.claimed)){this.state.phase='opening';this.state.startedAt=now;this.state.revision++;}
    if(this.state.phase==='opening'&&now-this.state.startedAt>=5000){
      this.state.phase='portal-open';this.state.revision++;
      // Preserve a recent approach pose when the gate opens between two samples.
      // Otherwise an immediate first step can miss the arming distance entirely.
      this.detectors.forEach((detector,index)=>{detector.reset();const pose=this.pose.get(index+1);if(pose&&now-pose.at<=1200)detector.sample(pose.p,pose.at,this.state.config.portal);});
    }
    if(this.state.phase==='portal-open'&&this.allReady()&&this.state.players.every(p=>p.crossed)){this.state.phase='transitioning';this.state.startedAt=now;this.state.revision++;}
    if(this.state.phase==='transitioning'&&this.allReady()&&now-this.state.startedAt>=2000&&!this.launched){launch();this.launched=true;this.state.phase='completed';this.state.active=false;this.state.revision++;this.pose.clear();}
    return old!==this.state.revision;
  }
  staffPoses(){if(!this.active)return {};this.setRoom(this.room);return Object.fromEntries(Object.entries(this.positions).map(([id,p])=>[id,{...p,yaw:0}]));}
}
import { inside as insideRoom } from '../scene-schema.js';
