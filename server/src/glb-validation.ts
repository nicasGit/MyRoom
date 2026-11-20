/** Bounded static GLB subset. No scripts, external resources or decoder services. */
export const MAX_GLB_BYTES=8*1024*1024;
const fail=()=>{throw Error('GLB invalide ou non pris en charge (modèle statique autonome requis).');};
const uint=(value:unknown,max=1000000):number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0&&value<=max?value:fail();
const array=(value:unknown,max:number):any[]=>Array.isArray(value)&&value.length<=max?value:fail();
function pixels(bytes:Buffer,mime:string){
  if(mime==='image/png'&&bytes.length>=24&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return [bytes.readUInt32BE(16),bytes.readUInt32BE(20)];
  if(mime==='image/jpeg'&&bytes[0]===255&&bytes[1]===216){
    let i=2;while(i+9<bytes.length){if(bytes[i++]!==255)fail();while(bytes[i]===255)i++;const marker=bytes[i++];if(marker===0xd9||marker===0xda)break;const length=bytes.readUInt16BE(i);if(length<2||i+length>bytes.length)fail();if([0xc0,0xc1,0xc2].includes(marker))return [bytes.readUInt16BE(i+5),bytes.readUInt16BE(i+3)];i+=length;}
  }
  return fail();
}
const identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function multiply(a:number[],b:number[]){const out=Array(16).fill(0);for(let col=0;col<4;col++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)out[col*4+row]+=a[k*4+row]*b[col*4+k];return out;}
function numbers(value:unknown,length:number,fallback:number[]){if(value===undefined)return fallback;const n=array(value,length);if(n.length!==length||n.some(x=>typeof x!=='number'||!Number.isFinite(x)||Math.abs(x)>10000))fail();return n as number[];}
function transform(node:any){
  if(node.matrix!==undefined){if(node.rotation||node.translation||node.scale)fail();const m=numbers(node.matrix,16,identity());if(m[3]!==0||m[7]!==0||m[11]!==0||m[15]!==1)fail();return m;}
  const [x,y,z,w]=numbers(node.rotation,4,[0,0,0,1]);if(Math.abs(Math.hypot(x,y,z,w)-1)>.001)fail();
  const [sx,sy,sz]=numbers(node.scale,3,[1,1,1]),[tx,ty,tz]=numbers(node.translation,3,[0,0,0]);
  return [(1-2*y*y-2*z*z)*sx,(2*x*y+2*z*w)*sx,(2*x*z-2*y*w)*sx,0,(2*x*y-2*z*w)*sy,(1-2*x*x-2*z*z)*sy,(2*y*z+2*x*w)*sy,0,(2*x*z+2*y*w)*sz,(2*y*z-2*x*w)*sz,(1-2*x*x-2*y*y)*sz,0,tx,ty,tz,1];
}
export function inspectGlb(file:Buffer){
  if(file.length<28||file.length>MAX_GLB_BYTES||file.readUInt32LE(0)!==0x46546c67||file.readUInt32LE(4)!==2||file.readUInt32LE(8)!==file.length)fail();
  const jsonLength=file.readUInt32LE(12);if(jsonLength>512*1024||jsonLength%4||20+jsonLength+8>file.length||file.readUInt32LE(16)!==0x4e4f534a)fail();
  let gltf:any;try{gltf=JSON.parse(file.toString('utf8',20,20+jsonLength));}catch{fail();}
  const start=20+jsonLength,length=file.readUInt32LE(start);if(length%4||start+8+length!==file.length||file.readUInt32LE(start+4)!==0x004e4942)fail();
  const binary=file.subarray(start+8);
  let keys=0;
  function scan(value:any,depth=0){if(depth>40||++keys>100000)fail();if(value&&typeof value==='object')for(const [key,child] of Object.entries(value)){if(['uri','__proto__','constructor','prototype'].includes(key))fail();scan(child,depth+1);}}
  scan(gltf);
  if(gltf.asset?.version!=='2.0'||gltf.skins?.length||gltf.animations?.length)fail();
  const supported=['KHR_materials_unlit','KHR_materials_ior','KHR_materials_specular','KHR_materials_clearcoat','KHR_materials_sheen','KHR_materials_transmission','KHR_materials_volume','KHR_materials_emissive_strength','KHR_materials_pbrSpecularGlossiness','KHR_texture_transform'];
  for(const ext of [...(gltf.extensionsUsed??[]),...(gltf.extensionsRequired??[])])if(!supported.includes(ext))throw Error('Extension GLB non prise en charge : '+String(ext).slice(0,80));
  const buffers=array(gltf.buffers,1);if(buffers.length!==1||uint(buffers[0].byteLength,MAX_GLB_BYTES)>binary.length||binary.length-buffers[0].byteLength>3)fail();
  const views=array(gltf.bufferViews,2048),accessors=array(gltf.accessors,2048),meshes=array(gltf.meshes,128),nodes=array(gltf.nodes,512),scenes=array(gltf.scenes,16);
  if(!meshes.length||!nodes.length||!scenes.length)fail();
  for(const view of views){if(view.buffer!==0)fail();const offset=uint(view.byteOffset??0,MAX_GLB_BYTES),size=uint(view.byteLength,MAX_GLB_BYTES);if(offset+size>buffers[0].byteLength)fail();if(view.byteStride!==undefined&&(uint(view.byteStride,252)<4||view.byteStride%4))fail();}
  const sizes:Record<string,number>={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},components:Record<number,number>={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
  for(const accessor of accessors){
    const view=views[uint(accessor.bufferView,views.length-1)],count=uint(accessor.count,600000),component=components[accessor.componentType],width=sizes[accessor.type];if(!view||!component||!width||accessor.sparse||!count)fail();
    const offset=uint(accessor.byteOffset??0,MAX_GLB_BYTES),stride=view.byteStride??component*width;
    if(offset%component||((view.byteOffset??0)+offset)%component||stride<component*width||offset+(count-1)*stride+component*width>view.byteLength)fail();
  }
  let totalVertices=0,totalTriangles=0,totalPixels=0;
  for(const image of array(gltf.images??[],16)){const view=views[uint(image.bufferView,views.length-1)];if(!view)fail();const [w,h]=pixels(binary.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength),image.mimeType);if(!w||!h||w>2048||h>2048||(totalPixels+=w*h)>4194304)throw Error('Textures trop grandes (2048 px, 4 mégapixels au total).');}
  array(gltf.materials??[],128);array(gltf.textures??[],32);
  const bounds=meshes.map(mesh=>{
    let triangles=0;
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(const primitive of array(mesh.primitives,128)){
      if(primitive.targets||mesh.weights||primitive.mode!==undefined&&primitive.mode!==4)fail();const a=accessors[uint(primitive.attributes?.POSITION,accessors.length-1)];
      if(!a||a.type!=='VEC3'||a.componentType!==5126||(totalVertices+=a.count)>100000)throw Error('Maximum 100 000 sommets.');
      const index=primitive.indices===undefined?undefined:accessors[uint(primitive.indices,accessors.length-1)];if(index&&(index.type!=='SCALAR'||![5121,5123,5125].includes(index.componentType)))fail();
      if(index){const view=views[index.bufferView],offset=(view.byteOffset??0)+(index.byteOffset??0),bytes=components[index.componentType],stride=view.byteStride??bytes;for(let i=0;i<index.count;i++){const at=offset+i*stride,n=bytes===1?binary.readUInt8(at):bytes===2?binary.readUInt16LE(at):binary.readUInt32LE(at);if(n>=a.count)fail();}}
      const count=index?.count??a.count;if(count%3)fail();triangles+=count/3;
      if((totalTriangles+=count/3)>200000)throw Error('Maximum 200 000 triangles.');
      const view=views[a.bufferView],offset=(view.byteOffset??0)+(a.byteOffset??0),stride=view.byteStride??12;
      const localMin=[Infinity,Infinity,Infinity],localMax=[-Infinity,-Infinity,-Infinity];
      for(let i=0;i<a.count;i++)for(let axis=0;axis<3;axis++){const n=binary.readFloatLE(offset+i*stride+axis*4);if(!Number.isFinite(n)||Math.abs(n)>10000)fail();localMin[axis]=Math.min(localMin[axis],n);localMax[axis]=Math.max(localMax[axis],n);min[axis]=Math.min(min[axis],n);max[axis]=Math.max(max[axis],n);}
      const declaredMin=numbers(a.min,3,[]),declaredMax=numbers(a.max,3,[]);if(declaredMin.length!==3||declaredMax.length!==3||localMin.some((n,i)=>Math.abs(n-declaredMin[i])>1e-4)||localMax.some((n,i)=>Math.abs(n-declaredMax[i])>1e-4))throw Error('Bornes de géométrie GLB incohérentes.');
    }
    return {min,max,triangles};
  });
  // Check every node, including unused scenes, before a browser loader sees it.
  const colors=new Map<number,number>();let edges=0;
  function graph(index:number,depth:number){if(depth>64||colors.get(index)===1)fail();if(colors.get(index)===2)return;const node=nodes[index];if(!node)fail();colors.set(index,1);transform(node);for(const child of array(node.children??[],512)){if(++edges>1024)fail();graph(uint(child,nodes.length-1),depth+1);}colors.set(index,2);}
  nodes.forEach((_,i)=>graph(i,0));let renderedTriangles=0;
  const visiting=new Set<number>(),visited=new Set<number>(),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];let draws=0;
  function walk(index:number,parent:number[],depth:number){
    if(depth>64||visiting.has(index)||visited.has(index))fail();const node=nodes[index];if(!node)fail();visiting.add(index);visited.add(index);const world=multiply(parent,transform(node));
    if(node.mesh!==undefined){const box=bounds[uint(node.mesh,meshes.length-1)];if(!box||++draws>128||(renderedTriangles+=box.triangles)>200000)fail();for(const x of [box.min[0],box.max[0]])for(const y of [box.min[1],box.max[1]])for(const z of [box.min[2],box.max[2]])for(let axis=0;axis<3;axis++){const n=world[axis]*x+world[4+axis]*y+world[8+axis]*z+world[12+axis];if(!Number.isFinite(n)||Math.abs(n)>10000)fail();min[axis]=Math.min(min[axis],n);max[axis]=Math.max(max[axis],n);}}
    for(const child of array(node.children??[],512))walk(uint(child,nodes.length-1),world,depth+1);visiting.delete(index);
  }
  const scene=scenes[uint(gltf.scene??0,scenes.length-1)];if(!scene)fail();for(const root of array(scene.nodes,512))walk(uint(root,nodes.length-1),identity(),0);
  const dimensions=max.map((n,i)=>n-min[i]);if(!draws||dimensions.some(n=>!Number.isFinite(n)||n<.00001))throw Error('Le modèle doit avoir un volume 3D non nul.');
  return {size:{width:dimensions[0],height:dimensions[1],depth:dimensions[2]},vertices:totalVertices,triangles:Math.ceil(totalTriangles)};
}
