import type { IncomingMessage,ServerResponse } from 'node:http';
import { inspectGlb,MAX_GLB_BYTES } from './glb-validation.js';
import type { ModelStore } from './model-store.js';
import { log } from './logger.js';

/** Called only after the existing admin authentication and origin checks. */
export async function modelAdmin(req:IncomingMessage,res:ServerResponse,store:ModelStore,broadcast:()=>void){
  const reply=(status:number,data:unknown)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  const inspect=req.url==='/api/admin/models/inspect',upload=inspect||req.url==='/api/admin/models/import';
  if(req.method!=='POST'||(!upload&&req.url!=='/api/admin/models/update')){reply(404,{error:'Route inconnue.'});return;}
  if(req.headers['content-type']?.split(';')[0]!== (upload?'application/octet-stream':'application/json')){reply(415,{error:upload?'Fichier GLB binaire attendu.':'JSON attendu.'});return;}
  try{
    const chunks:Buffer[]=[];let bytes=0;const maximum=upload?MAX_GLB_BYTES:8192;
    if(Number(req.headers['content-length'])>maximum){reply(413,{error:'Fichier trop grand (8 Mio maximum).'});return;}
    for await(const chunk of req){bytes+=Buffer.byteLength(chunk);if(bytes>maximum){reply(413,{error:'Fichier trop grand (8 Mio maximum).'});return;}chunks.push(Buffer.from(chunk));}
    const body=Buffer.concat(chunks);
    if(inspect){reply(200,{info:inspectGlb(body)});return;}
    const result=upload?store.import(body,decodeURIComponent(String(req.headers['x-file-name']??'')),{
      source:decodeURIComponent(String(req.headers['x-model-source']??'')),license:decodeURIComponent(String(req.headers['x-model-license']??'')),rightsConfirmed:req.headers['x-model-rights']==='confirmed',
    },Number(req.headers['x-catalog-revision'])):{asset:store.update(JSON.parse(body.toString('utf8')))};
    log(upload?'model_imported':'model_updated',{id:result.asset.id,version:result.asset.version,bytes:upload?bytes:undefined});broadcast();reply(200,{...result,revision:store.snapshot().revision});
  }catch(error){reply(400,{error:error instanceof Error?error.message:'Import refusé.'});}
}
