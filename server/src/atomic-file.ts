import { renameSync } from 'node:fs';

/** Keep atomic rename; briefly retry transient Windows file locks, never delete the target. */
export function atomicRename(from:string,to:string,rename=renameSync,windows=process.platform==='win32',pause=()=>{Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,20);}){
  for(let attempt=0;;attempt++){
    try{rename(from,to);return;}
    catch(error){const code=(error as NodeJS.ErrnoException).code;if(!windows||attempt>=4||!['EPERM','EBUSY'].includes(code??''))throw error;pause();}
  }
}
