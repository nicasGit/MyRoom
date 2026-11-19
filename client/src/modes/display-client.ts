import type { DisplayMode,ModePolicy,ModeCommand,ClientCapabilities } from '../../../server/src/display-modes.js';
import type { DisplayAdapter } from './adapters';
export const MODE_LABELS:Record<DisplayMode,string>={'virtual-3d':'Simulation 3D','camera-ar':'Caméra AR expérimentale','quest-webxr':'Quest WebXR'};
export async function detectCapabilities():Promise<ClientCapabilities>{
  let immersiveAR=false;try{immersiveAR=await navigator.xr?.isSessionSupported('immersive-ar')??false;}catch{}
  let webgl=false;try{const canvas=document.createElement('canvas');const gl=canvas.getContext('webgl2')??canvas.getContext('webgl');webgl=!!gl;gl?.getExtension('WEBGL_lose_context')?.loseContext();}catch{}
  return {webgl,webxr:!!navigator.xr,immersiveAR,camera:!!navigator.mediaDevices?.getUserMedia,touch:navigator.maxTouchPoints>0,secureContext:isSecureContext};
}
export class DisplayClient {
  current:DisplayMode|undefined;private policy?:ModePolicy;private active?:DisplayAdapter;private generation=0;private helloGeneration=0;private transitioning=false;
  private select=document.createElement('select');private activateButton=document.createElement('button');private status=document.createElement('p');private pending=false;
  constructor(host:HTMLElement,private adapters:Record<DisplayMode,DisplayAdapter>,private send:(command:ModeCommand)=>boolean,private changed:(mode:DisplayMode)=>void){
    const panel=document.createElement('section'),title=document.createElement('h2');panel.className='display-modes';title.textContent='Mode de jeu';this.select.setAttribute('aria-label','Mode de jeu');
    for(const id of Object.keys(MODE_LABELS) as DisplayMode[]){const option=document.createElement('option');option.value=id;option.textContent=MODE_LABELS[id];this.select.append(option);}
    this.activateButton.textContent='Activer le mode';this.select.disabled=true;this.select.onchange=()=>this.choose(this.select.value as DisplayMode);this.activateButton.onclick=()=>{void this.activate();};
    const fallback=document.createElement('button');fallback.textContent='Retour immédiat en 3D';fallback.onclick=()=>this.fallback('unsupported');this.status.setAttribute('role','status');
    panel.append(title,this.select,this.activateButton,fallback,this.status);const launch=host.querySelector('#game-launch');if(launch)launch.after(panel);else host.prepend(panel);
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.current==='camera-ar')this.fallback('camera-failed');});
    window.addEventListener('pagehide',()=>{this.generation++;void this.active?.stop();},{once:true});
  }
  async hello(){const generation=++this.helloGeneration;const capabilities=await detectCapabilities();if(generation===this.helloGeneration)this.send({type:'display_mode',action:'hello',requestId:crypto.randomUUID(),capabilities});}
  receivePolicy(policy:ModePolicy){this.policy=policy;this.controls();}
  private controls(){this.select.disabled=!this.policy?.allowPlayerChange||this.pending;
    for(const option of Array.from(this.select.options))option.disabled=option.value==='camera-ar'&&!this.policy?.cameraAREnabled&&this.current!=='camera-ar';
    if(this.current)this.select.value=this.current;this.activateButton.hidden=this.current==='virtual-3d';this.activateButton.disabled=!this.current||this.transitioning;
    this.activateButton.textContent=this.current==='camera-ar'?'Activer la caméra':'Entrer dans WebXR';
  }
  choose(mode:DisplayMode){if(this.pending)return;this.pending=true;this.controls();if(!this.send({type:'display_mode',action:'change',requestId:crypto.randomUUID(),mode})){this.pending=false;this.status.textContent='Serveur déconnecté.';this.controls();}}
  receive(message:{accepted:boolean;mode?:DisplayMode;policy?:ModePolicy;message?:string}){
    this.pending=false;if(message.policy)this.policy=message.policy;
    if(!message.accepted){this.status.textContent=message.message??'Mode refusé.';this.controls();return;}
    if(!message.mode)return;const changed=this.current!==message.mode;this.current=message.mode;this.controls();
    if(changed){this.changed(this.current);if(this.current==='virtual-3d')void this.activate();else{const generation=++this.generation;this.transitioning=true;void Promise.resolve(this.active?.stop()).finally(()=>{if(generation===this.generation){this.transitioning=false;this.controls();}});this.active=undefined;this.status.textContent='Mode prêt. Activez-le explicitement pour autoriser caméra ou WebXR.';}}
  }
  async activate(){const mode=this.current;if(!mode)return;const generation=++this.generation;this.transitioning=true;this.controls();
    try{await this.active?.stop();if(generation!==this.generation)return;this.active=this.adapters[mode];await this.active.start();if(generation!==this.generation)return;this.status.textContent=mode==='camera-ar'?'Superposition caméra — sans ancrage spatial':MODE_LABELS[mode];}
    catch(error){if(generation===this.generation){this.status.textContent=`Activation impossible : ${String(error)}. Retour en 3D.`;this.fallback(mode==='camera-ar'?'camera-failed':'unsupported');}}
    finally{if(generation===this.generation){this.transitioning=false;this.controls();}}
  }
  fallback(reason:'camera-failed'|'quest-ended'|'unsupported'){
    const generation=++this.generation;this.transitioning=true;const stopping=this.active?.stop();this.active=undefined;this.current='virtual-3d';this.changed('virtual-3d');
    void Promise.resolve(stopping).then(async()=>{if(generation!==this.generation)return;this.active=this.adapters['virtual-3d'];await this.active.start();}).catch(error=>{this.status.textContent=String(error);}).finally(()=>{if(generation===this.generation){this.transitioning=false;this.controls();}});
    this.send({type:'display_mode',action:'fallback',requestId:crypto.randomUUID(),reason});this.status.textContent='Retour en simulation 3D. La progression est conservée.';
  }
  questEnded(){if(this.current==='quest-webxr'&&!this.transitioning)this.fallback('quest-ended');}
  disconnect(){this.helloGeneration++;this.pending=false;if(this.current==='camera-ar')this.fallback('camera-failed');}
}
