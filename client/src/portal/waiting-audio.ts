const LOOP_SECONDS=8;

/** Original procedural sound, no sample from a television soundtrack. */
export function temporalEngineSample(seconds:number){
  const t=((seconds%LOOP_SECONDS)+LOOP_SECONDS)%LOOP_SECONDS,turn=Math.PI*2;
  const breath=.18+.82*Math.pow(.5-.5*Math.cos(turn*t/4),1.5);
  const phase=turn*82*t+180*Math.sin(turn*t/4);
  const grind=Math.sin(phase)+.32*Math.sin(phase*3)+.12*Math.sin(phase*7);
  const rumble=.4*Math.sin(turn*41*t+90*Math.sin(turn*t/4));
  const air=.12*Math.sin(turn*1733*t+5*Math.sin(turn*17*t))*Math.sin(turn*2371*t);
  return .1*Math.tanh((grind+rumble+air)*.8)*breath;
}

/** Gesture-unlocked personal ambience. No timer or audio permission affects gameplay. */
export class WaitingAudio {
  private context:AudioContext|undefined;
  private buffer:AudioBuffer|undefined;
  private voice:{source:AudioBufferSourceNode;gain:GainNode}|undefined;
  private wanted=false;
  private disposed=false;
  private resuming=false;
  private nextResume=0;
  constructor(private createContext:()=>AudioContext=()=>new AudioContext()){}
  async unlock(){
    if(this.disposed)return;
    try{
      this.context??=this.createContext();
      this.context.onstatechange=()=>{if(this.wanted&&!this.disposed&&this.context?.state==='running')this.setActive(true);};
      if(this.context.state==='suspended')await this.context.resume();
      // Precompute after the launch gesture, outside the XR animation loop.
      if(!this.disposed&&this.context.state==='running')this.prepareBuffer(this.context);
      if(!this.disposed)this.setActive(this.wanted);
    }catch{/* Audio refusal must never block the portal. A later gesture can retry. */}
  }
  setActive(active:boolean){
    this.wanted=active;
    if(!active){this.stop();return;}
    const context=this.context;
    if(this.disposed||!context)return;
    if((context.state==='suspended'||String(context.state)==='interrupted')&&!this.resuming&&Date.now()>=this.nextResume){
      this.nextResume=Date.now()+2000;this.resuming=true;void context.resume().then(()=>{if(!this.disposed&&this.wanted)this.setActive(true);}).catch(()=>{}).finally(()=>{this.resuming=false;});
    }
    if(this.voice||context.state!=='running')return;
    try{
      const source=context.createBufferSource(),gain=context.createGain();
      source.buffer=this.prepareBuffer(context);source.loop=true;
      gain.gain.setValueAtTime(0,context.currentTime);gain.gain.linearRampToValueAtTime(.7,context.currentTime+.4);
      source.connect(gain);gain.connect(context.destination);
      source.onended=()=>{if(this.voice?.source===source)this.voice=undefined;source.disconnect();gain.disconnect();};
      this.voice={source,gain};source.start();
    }catch{this.stop();}
  }
  private prepareBuffer(context:AudioContext){
    if(this.buffer)return this.buffer;
    const rate=Math.min(context.sampleRate,22050);
    this.buffer=context.createBuffer(1,Math.round(rate*LOOP_SECONDS),rate);
    const samples=this.buffer.getChannelData(0);
    for(let i=0;i<samples.length;i++)samples[i]=temporalEngineSample(i/rate);
    return this.buffer;
  }
  private stop(){
    const voice=this.voice,context=this.context;this.voice=undefined;
    if(!voice||!context)return;
    try{
      const now=context.currentTime;
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value,now);
      voice.gain.gain.linearRampToValueAtTime(0,now+.18);
      voice.source.stop(now+.2);
    }catch{voice.source.disconnect();voice.gain.disconnect();}
  }
  dispose(){this.disposed=true;this.setActive(false);this.buffer=undefined;void this.context?.close().catch(()=>{});}
}
