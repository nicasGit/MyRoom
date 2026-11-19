type VideoTarget=Pick<HTMLVideoElement,'srcObject'|'play'|'pause'|'muted'|'playsInline'>;
// No acquisition in the constructor: activation must follow a user gesture.
export class CameraStream {
  private stream?:MediaStream;private generation=0;
  constructor(private video:VideoTarget,private acquire:(constraints:MediaStreamConstraints)=>Promise<MediaStream>,private ended:()=>void=()=>{}){this.video.muted=true;this.video.playsInline=true;}
  async start(){this.stop();const generation=this.generation;
    const stream=await this.acquire({video:{facingMode:{ideal:'environment'}},audio:false});
    if(generation!==this.generation){stream.getTracks().forEach(track=>track.stop());return false;}
    this.stream=stream;this.video.srcObject=stream;
    for(const track of stream.getVideoTracks())track.addEventListener('ended',()=>{if(generation===this.generation){this.stop();this.ended();}},{once:true});
    try{await this.video.play();if(generation!==this.generation)return false;return true;}catch(error){if(generation===this.generation)this.stop();throw error;}
  }
  stop(){this.generation++;this.stream?.getTracks().forEach(track=>track.stop());this.stream=undefined;this.video.pause();this.video.srcObject=null;}
}
