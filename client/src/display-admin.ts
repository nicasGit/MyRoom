import type { ModePolicy,DisplayMode,ClientCapabilities } from '../../server/src/display-modes.js';
export type DisplayClient={id:string;mode:DisplayMode;capabilities:ClientCapabilities;policyRevision:number};
export class DisplayAdmin {
  private policy?:ModePolicy;private dirty=false;private form=document.createElement('form');private mode=document.createElement('select');
  private change=document.createElement('input');private camera=document.createElement('input');private clients=document.createElement('div');private status=document.createElement('p');
  constructor(host:HTMLElement,save:(policy:ModePolicy)=>Promise<unknown>){
    const panel=document.createElement('section');panel.className='panel';const title=document.createElement('h2');title.textContent='Modes d’affichage';
    for(const id of ['virtual-3d','camera-ar','quest-webxr']){const option=document.createElement('option');option.value=option.textContent=id;this.mode.append(option);}
    const row=document.createElement('label');row.textContent='Mode par défaut des prochaines connexions ';row.append(this.mode);this.form.append(row);
    for(const [input,text] of [[this.change,'Autoriser les joueurs à changer de mode'],[this.camera,'Activer la superposition caméra expérimentale']] as const){input.type='checkbox';const label=document.createElement('label');label.append(input,document.createTextNode(text));this.form.append(label);}
    const button=document.createElement('button');button.textContent='Enregistrer les modes';this.form.append(button);this.form.oninput=()=>{this.dirty=true;};
    this.form.onsubmit=event=>{event.preventDefault();if(!this.policy)return;button.disabled=true;
      void save({...this.policy,defaultMode:this.mode.value as DisplayMode,allowPlayerChange:this.change.checked,cameraAREnabled:this.camera.checked}).then(()=>{this.dirty=false;this.status.textContent='Enregistré. Les clients en cours conservent leur mode et leur progression.';}).catch(error=>{this.status.textContent=String(error);}).finally(()=>{button.disabled=false;});};
    panel.append(title,this.form,this.status,this.clients);host.prepend(panel);
  }
  receive(policy:ModePolicy|undefined,clients:DisplayClient[]=[]){if(!policy)return;this.policy=policy;
    if(!this.dirty){this.mode.value=policy.defaultMode;this.change.checked=policy.allowPlayerChange;this.camera.checked=policy.cameraAREnabled;}
    this.clients.replaceChildren();for(const client of clients){const p=document.createElement('p');p.textContent=`${client.id.slice(0,8)} · ${client.mode} · capacités déclarées : ${Object.entries(client.capabilities).map(([key,value])=>`${key}=${value?'oui':'non'}`).join(', ')}`;this.clients.append(p);}
  }
}
