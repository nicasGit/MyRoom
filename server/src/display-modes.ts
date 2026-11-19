import { existsSync,mkdirSync,readFileSync,writeFileSync,renameSync } from 'node:fs';
import { join } from 'node:path';
import { record,integer,bool,text } from './engine/validation.js';
export const DISPLAY_MODES=['virtual-3d','camera-ar','quest-webxr'] as const;
export type DisplayMode=typeof DISPLAY_MODES[number];
export type ModePolicy={version:1;revision:number;defaultMode:DisplayMode;allowPlayerChange:boolean;cameraAREnabled:boolean};
export type ClientCapabilities={webgl:boolean;webxr:boolean;immersiveAR:boolean;camera:boolean;touch:boolean;secureContext:boolean};
export const DEFAULT_MODE_POLICY:ModePolicy={version:1,revision:0,defaultMode:'virtual-3d',allowPlayerChange:true,cameraAREnabled:false};
export function displayMode(value:unknown):DisplayMode{if(!DISPLAY_MODES.includes(value as DisplayMode))throw Error('Mode inconnu.');return value as DisplayMode;}
export function parseModePolicy(value:unknown):ModePolicy{
  const c=record(value,['version','revision','defaultMode','allowPlayerChange','cameraAREnabled']);
  if(c.version!==1)throw Error('Version des modes inconnue.');const policy={version:1 as const,revision:integer(c.revision),defaultMode:displayMode(c.defaultMode),allowPlayerChange:bool(c.allowPlayerChange),cameraAREnabled:bool(c.cameraAREnabled)};
  if(policy.defaultMode==='camera-ar'&&!policy.cameraAREnabled)throw Error('Activez le mode caméra avant de le choisir par défaut.');return policy;
}
export function parseCapabilities(value:unknown):ClientCapabilities{
  const c=record(value,['webgl','webxr','immersiveAR','camera','touch','secureContext']);
  return {webgl:bool(c.webgl),webxr:bool(c.webxr),immersiveAR:bool(c.immersiveAR),camera:bool(c.camera),touch:bool(c.touch),secureContext:bool(c.secureContext)};
}
export type ModeCommand={type:'display_mode';requestId:string;action:'hello';capabilities:ClientCapabilities}|{type:'display_mode';requestId:string;action:'change';mode:DisplayMode}|{type:'display_mode';requestId:string;action:'fallback';reason:'camera-failed'|'quest-ended'|'unsupported'};
export function parseModeCommand(value:unknown):ModeCommand{
  const c=record(value,['type','requestId','action','capabilities','mode','reason']);const requestId=text(c.requestId,64);
  const expected=c.action==='hello'?'action,capabilities,requestId,type':c.action==='change'?'action,mode,requestId,type':c.action==='fallback'?'action,reason,requestId,type':'';
  if(c.type!=='display_mode'||Object.keys(c).sort().join(',')!==expected)throw Error('Commande de mode invalide.');
  if(c.action==='hello')return {type:'display_mode',requestId,action:'hello',capabilities:parseCapabilities(c.capabilities)};
  if(c.action==='change')return {type:'display_mode',requestId,action:'change',mode:displayMode(c.mode)};
  if(!['camera-failed','quest-ended','unsupported'].includes(String(c.reason)))throw Error('Motif de repli invalide.');
  return {type:'display_mode',requestId,action:'fallback',reason:c.reason as 'camera-failed'|'quest-ended'|'unsupported'};
}
type ClientMode={id:string;mode:DisplayMode;capabilities:ClientCapabilities;policyRevision:number};
export class DisplayModes {
  private policy:ModePolicy={...DEFAULT_MODE_POLICY};private entries=new Map<string,ClientMode>();private file?:string;
  constructor(directory?:string){if(directory){mkdirSync(directory,{recursive:true});this.file=join(directory,'display-modes.json');if(existsSync(this.file)){const data=readFileSync(this.file,'utf8');if(data.length>4096)throw Error('Configuration modes trop volumineuse.');this.policy=parseModePolicy(JSON.parse(data));}}}
  snapshot(){return structuredClone(this.policy);}
  clients(){return structuredClone([...this.entries.values()]);}
  mode(id:string):DisplayMode{return this.entries.get(id)?.mode??'quest-webxr';}
  remove(id:string){this.entries.delete(id);}
  configure(value:unknown){const policy=parseModePolicy(value);if(policy.revision!==this.policy.revision)throw Error('Configuration périmée.');policy.revision++;
    if(this.file){writeFileSync(this.file+'.tmp',JSON.stringify(policy),{mode:0o600});renameSync(this.file+'.tmp',this.file);}this.policy=policy;return this.snapshot();}
  act(id:string,command:ModeCommand){
    let client=this.entries.get(id);
    if(command.action==='hello'){
      if(client)throw Error('Capacités déjà déclarées.');const c=command.capabilities,requested=this.policy.defaultMode;
      const supported=requested==='virtual-3d'||requested==='quest-webxr'&&c.webxr&&c.immersiveAR&&c.secureContext||requested==='camera-ar'&&this.policy.cameraAREnabled&&c.camera&&c.secureContext;
      client={id,mode:supported?requested:'virtual-3d',capabilities:c,policyRevision:this.policy.revision};this.entries.set(id,client);
    }else{
      if(!client)throw Error('Déclarez les capacités avant de changer de mode.');
      if(command.action==='fallback'){client.mode='virtual-3d';}
      else if(command.mode!==client.mode){
        if(!this.policy.allowPlayerChange)throw Error('Changement de mode interdit par l’organisateur.');
        if(command.mode==='camera-ar'&&(!this.policy.cameraAREnabled||!client.capabilities.camera||!client.capabilities.secureContext))throw Error('Caméra AR désactivée ou indisponible.');
        if(command.mode==='quest-webxr'&&(!client.capabilities.webxr||!client.capabilities.immersiveAR||!client.capabilities.secureContext))throw Error('WebXR immersif indisponible.');
        client.mode=command.mode;
      }
    }
    return {type:'display_mode_result' as const,accepted:true,requestId:command.requestId,mode:client.mode,policy:this.snapshot()};
  }
}
