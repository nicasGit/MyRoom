import { atomicRename } from './atomic-file.js';
import { mkdirSync,existsSync,readFileSync,writeFileSync,statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash,randomUUID } from 'node:crypto';
import { record,text,integer,bool } from './engine/validation.js';
import { parseImportedAsset,setImportedCatalog,type LibraryAsset } from './object-library.js';
import { inspectGlb,MAX_GLB_BYTES } from './glb-validation.js';

export type ModelIndex={version:1;revision:number;assets:LibraryAsset[]};
export class ModelStore {
  private index:ModelIndex={version:1,revision:0,assets:[]};
  private directory:string;private file:string;
  constructor(directory:string){
    this.directory=join(directory,'models');mkdirSync(this.directory,{recursive:true});this.file=join(this.directory,'catalog.json');
    if(existsSync(this.file)){
      if(statSync(this.file).size>512*1024)throw Error('Catalogue de modèles trop grand.');
      const data=record(JSON.parse(readFileSync(this.file,'utf8')),['version','revision','assets']);
      if(data.version!==1||!Array.isArray(data.assets)||data.assets.length>256)throw Error('Catalogue de modèles invalide.');
      this.index={version:1,revision:integer(data.revision),assets:data.assets.map(parseImportedAsset)};
      for(const asset of this.index.assets){const path=this.path(asset.model.split('/').pop()!);if(!path||!existsSync(path)||statSync(path).size>MAX_GLB_BYTES)throw Error('Fichier GLB enregistré introuvable ou trop grand.');}
    }
    setImportedCatalog({revision:this.index.revision,assets:this.index.assets});
  }
  snapshot(){return structuredClone(this.index);}
  path(name:string){return /^[a-f0-9]{64}\.glb$/.test(name)?join(this.directory,name):undefined;}
  publicPath(name:string){const path=this.path(name);return path&&this.index.assets.some(asset=>asset.model.endsWith('/'+name))?path:undefined;}
  private commit(assets:LibraryAsset[]){
    if(assets.length>256)throw Error('Maximum 256 versions de modèles.');
    const next:ModelIndex={version:1,revision:this.index.revision+1,assets:assets.map(parseImportedAsset)};
    writeFileSync(this.file+'.tmp',JSON.stringify(next,null,2),{mode:0o600});atomicRename(this.file+'.tmp',this.file);
    this.index=next;setImportedCatalog({revision:next.revision,assets:next.assets});
  }
  import(file:Buffer,filename:string,metadata:unknown,revision:unknown){
    if(revision!==this.index.revision)throw Error('Catalogue modifié ailleurs. Actualisez.');
    if(!/\.glb$/i.test(filename)||filename.length>160||/[\x00-\x1f\x7f/\\]/.test(filename))throw Error('Nom de fichier GLB invalide.');
    const meta=record(metadata,['source','license','rightsConfirmed']);if(bool(meta.rightsConfirmed)!==true)throw Error('Confirmez le droit d’utiliser et redistribuer ce modèle.');
    const source=text(meta.source,512),license=text(meta.license,128),info=inspectGlb(file),hash=createHash('sha256').update(file).digest('hex');
    const model=`/api/library/models/${hash}.glb`,existing=this.index.assets.filter(asset=>asset.model===model).sort((a,b)=>b.version!-a.version!)[0];
    if(existing)return {asset:structuredClone(existing),duplicate:true,info};
    const files=[...new Set(this.index.assets.map(asset=>asset.model.split('/').pop()!))];
    if(files.length>=64)throw Error('Maximum 64 modèles importés.');
    const used=files.reduce((sum,name)=>sum+statSync(this.path(name)!).size,0);if(used+file.length>128*1024*1024)throw Error('Limite de 128 Mio de modèles atteinte.');
    // Default to a one-metre-high model when source units do not fit authoring limits.
    const factor=info.size.height>6||info.size.height<.01||info.size.width>20||info.size.depth>20?1/info.size.height:1;
    const size={width:info.size.width*factor,height:info.size.height*factor,depth:info.size.depth*factor};
    const asset=parseImportedAsset({id:'custom-'+randomUUID(),version:1,name:filename.replace(/\.glb$/i,'').slice(0,64),category:'accessoires',model,size,hands:Math.max(size.width,size.height,size.depth)>.7?2:1,source,license,defaultMovable:true,defaultYaw:0});
    const path=this.path(hash+'.glb')!;
    if(!existsSync(path)){writeFileSync(path+'.tmp',file,{mode:0o600});atomicRename(path+'.tmp',path);}
    this.commit([...this.index.assets,asset]);return {asset,duplicate:false,info};
  }
  update(value:unknown){
    const data=record(value,['revision','asset']);if(Object.keys(data).length!==2||data.revision!==this.index.revision)throw Error('Catalogue modifié ailleurs. Actualisez.');
    const asset=parseImportedAsset(data.asset),previous=this.index.assets.filter(item=>item.id===asset.id).sort((a,b)=>b.version!-a.version!)[0];
    if(!previous||previous.version!==asset.version||previous.model!==asset.model)throw Error('Version de modèle périmée ou fichier différent.');
    const next={...asset,version:asset.version!+1};this.commit([...this.index.assets,next]);return structuredClone(next);
  }
}
