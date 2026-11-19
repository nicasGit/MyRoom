import type { DisplayMode } from '../../../server/src/display-modes.js';
import { CameraStream } from './camera-stream';
export interface DisplayAdapter {readonly id:DisplayMode;start():Promise<void>;stop():Promise<void>;recenter():void;}
export interface SceneSurface {start(camera:boolean):void;stop():void;recenter():void;}
export class Virtual3D implements DisplayAdapter {
  readonly id='virtual-3d';constructor(private scene:SceneSurface){}
  async start(){this.scene.start(false);}async stop(){this.scene.stop();}recenter(){this.scene.recenter();}
}
export class CameraAR implements DisplayAdapter {
  readonly id='camera-ar';readonly camera:CameraStream;
  constructor(private scene:SceneSurface,video:HTMLVideoElement,acquire:(constraints:MediaStreamConstraints)=>Promise<MediaStream>,ended:()=>void=()=>{}){this.camera=new CameraStream(video,acquire,ended);}
  async start(){try{if(await this.camera.start())this.scene.start(true);}catch(error){this.camera.stop();throw error;}}async stop(){this.camera.stop();this.scene.stop();}recenter(){this.scene.recenter();}
}
export class QuestWebXR implements DisplayAdapter {
  readonly id='quest-webxr';constructor(private enter:()=>Promise<void>,private exit:()=>Promise<void>,private reset:()=>void){}
  start(){return this.enter();}stop(){return this.exit();}recenter(){this.reset();}
}
