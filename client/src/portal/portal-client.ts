import * as THREE from 'three';
import type { PortalPublic,PortalCommand } from '../../../server/src/portal/portal-types.js';
import { toRoom,type makeCalibration } from '../calibration';
import { portalView } from './portal-view';
import { hasStaffAccess } from './portal-access';
import { modelGroup,disposeGroup } from '../model-view';
import { createPreview } from '../model-view';
import type { RoomModel } from '../../../server/src/scene-schema.js';
export class PortalClient {
  state:PortalPublic|undefined;private bypassIntro=false;private slot=0;private seq=0;private last=-Infinity;private wasReady=false;
  private panels:HTMLElement[]=[];private audio:AudioContext|undefined;private preview:(model:RoomModel|null)=>void;private previewState:PortalPublic|undefined;private host=document.createElement('div');
  constructor(private send:(command:PortalCommand)=>boolean,private calibration:()=>ReturnType<typeof makeCalibration>|undefined,private changed:()=>void,private notify:(text:string)=>void){
    for(const id of ['adventure-desktop','adventure-ar']){const panel=document.createElement('section');panel.hidden=true;document.getElementById(id)!.before(panel);this.panels.push(panel);}
    const host=this.host;host.hidden=true;this.panels[0].after(host);
    this.preview=createPreview(host,model=>{const group=modelGroup(model);if(this.previewState?.config.enabled&&this.previewState.phase!=='completed')group.add(portalView(this.previewState,this.slot));return group;});
    document.addEventListener('pointerdown',()=>{try{this.audio=new AudioContext();void this.audio.resume();}catch{}},{once:true});
  }
  visible(){return !this.bypassIntro&&!!this.state?.config.enabled&&this.state.phase!=='completed';}
  receive(state:PortalPublic,slot:number,model:RoomModel|null,bypassIntro=false){
    const previous=this.state,bypassChanged=this.bypassIntro!==bypassIntro;this.bypassIntro=bypassIntro;this.state=state;this.slot=slot;
    if(previous?.sessionId!==state.sessionId){this.seq=0;this.wasReady=false;}
    const changed=bypassChanged||previous?.revision!==state.revision||previous?.sessionId!==state.sessionId;
    if(changed){
      for(const id of ['adventure-desktop','adventure-ar']){const root=document.getElementById(id)!;root.hidden=this.visible();}
      this.panels.forEach(panel=>{panel.hidden=!this.visible();panel.replaceChildren();if(!this.visible())return;const text=document.createElement('p');text.textContent=this.story();panel.append(text);const button=document.createElement('button');button.textContent='Mode accessible : valider mon passage sans traverser';button.disabled=state.phase!=='portal-open'||!hasStaffAccess(state,slot);button.onclick=()=>this.confirm();panel.append(button);});
      this.host.hidden=!this.visible();this.previewState=state;this.preview(this.visible()?model:null);this.changed();
      const crossed=state.players.find(p=>p.slot===slot)?.crossed&&!previous?.players.find(p=>p.slot===slot)?.crossed;
      if(hasStaffAccess(state,slot)&&((state.phase==='opening'&&previous?.phase!=='opening')||crossed||!hasStaffAccess(previous,slot)&&state.phase==='portal-open'))this.chime(state);
      if(crossed)this.notify('Votre passage est validé. Attendez vos coéquipiers dans la même pièce.');
    }
  }
  story(){const s=this.state;if(!s||!this.visible())return '';if(s.active&&!hasStaffAccess(s,this.slot))return 'Prenez votre b\u00e2ton personnel pour r\u00e9v\u00e9ler le vortex et son panneau.';if(!s.active)return 'Bienvenue dans MyRoom. Calibrez les reperes A/B : le vortex et les batons sont l’accueil commun avant toute aventure. L’organisateur prepare puis demarre le rituel.';return `${s.simulation?'SIMULATION PC · ':''}Team Portal · ${s.phase} · ${s.players.filter(p=>p.claimed).length}/${s.config.playerCount??4} bâtons · ${s.players.filter(p=>p.crossed).length}/${s.config.playerCount??4} passages. ${s.phase==='portal-open'?'Le passage est ouvert. Marchez calmement dans le sens de la flèche ou utilisez la confirmation accessible.':'Prenez votre bâton : la première prise ouvre le vortex. Tous les joueurs choisis doivent être calibrés et passer pour commencer.'}`;}
  private command(action:PortalCommand['action'],position?:THREE.Vector3){const s=this.state;if(!s?.active)return;this.send({type:'portal_action',sessionId:s.sessionId,revision:s.revision,commandId:crypto.randomUUID(),seq:++this.seq,action,...(position?{position:{x:position.x,y:position.y,z:position.z}}:{})});}
  update(local:THREE.Vector3|undefined,now=performance.now()){
    if(!this.state?.active||this.state.simulation)return;const calibration=this.calibration();
    if(!local||!calibration){if(this.wasReady){this.command('unready');this.wasReady=false;}return;}
    if(now-this.last>=300){this.last=now;const point=toRoom(local,calibration);if(this.audio){this.audio.listener.positionX.value=point.x;this.audio.listener.positionY.value=point.y;this.audio.listener.positionZ.value=point.z;}this.command('pose',point);this.wasReady=true;}
  }
  confirm(){if(!hasStaffAccess(this.state,this.slot)){this.notify('Prenez votre bâton personnel pour révéler le vortex.');return;}this.command('confirm');}
  updateVirtual(position:THREE.Vector3,now=performance.now()){
    if(!this.state?.active||this.state.simulation)return;
    if(now-this.last>=300){this.last=now;this.command('pose',position);this.wasReady=true;}
  }
  raycast(group:THREE.Group,origin:THREE.Vector3,direction:THREE.Vector3,camera:THREE.Camera){group.updateMatrixWorld(true);const ray=new THREE.Raycaster(origin,direction,0,8);ray.camera=camera;if(ray.intersectObject(group,true).some(hit=>hit.object.userData.portalConfirm))this.confirm();}
  private chime(state:PortalPublic){try{if(!this.audio||this.audio.state!=='running')return;const oscillator=this.audio.createOscillator(),gain=this.audio.createGain(),panner=this.audio.createPanner();panner.panningModel='HRTF';panner.positionX.value=state.config.portal.x;panner.positionY.value=1.2;panner.positionZ.value=state.config.portal.z;oscillator.frequency.setValueAtTime(220,this.audio.currentTime);oscillator.frequency.linearRampToValueAtTime(660,this.audio.currentTime+1);gain.gain.setValueAtTime(0.08,this.audio.currentTime);gain.gain.exponentialRampToValueAtTime(0.001,this.audio.currentTime+1.2);oscillator.connect(gain).connect(panner).connect(this.audio.destination);oscillator.start();oscillator.stop(this.audio.currentTime+1.2);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();panner.disconnect();};}catch{}}
}
