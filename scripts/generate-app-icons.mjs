// Deterministic, dependency-free PNG artwork: a room outline on the MyRoom background.
// Run from anywhere with: node scripts/generate-app-icons.mjs
import { mkdirSync,writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
const output=new URL('../client/public/icons/',import.meta.url);
mkdirSync(output,{recursive:true});
function crc32(buffer){let crc=0xffffffff;for(const byte of buffer){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([name,data])));return Buffer.concat([length,name,data,crc]);}
function icon(size){
  const pixels=Buffer.alloc(size*size*4);
  for(let i=0;i<pixels.length;i+=4){pixels[i]=17;pixels[i+1]=24;pixels[i+2]=39;pixels[i+3]=255;}
  const line=(a,b,color=[103,232,249])=>{
    const ax=a[0]*size,ay=a[1]*size,bx=b[0]*size,by=b[1]*size,dx=bx-ax,dy=by-ay,r=size*0.012;
    for(let y=Math.max(0,Math.floor(Math.min(ay,by)-r));y<Math.min(size,Math.ceil(Math.max(ay,by)+r));y++)for(let x=Math.max(0,Math.floor(Math.min(ax,bx)-r));x<Math.min(size,Math.ceil(Math.max(ax,bx)+r));x++){
      const t=Math.max(0,Math.min(1,((x+0.5-ax)*dx+(y+0.5-ay)*dy)/(dx*dx+dy*dy)));
      if(Math.hypot(x+0.5-ax-t*dx,y+0.5-ay-t*dy)<=r){const i=(y*size+x)*4;pixels[i]=color[0];pixels[i+1]=color[1];pixels[i+2]=color[2];}
    }
  };
  const a=[0.25,0.36],b=[0.5,0.23],c=[0.75,0.36],d=[0.75,0.66],e=[0.5,0.8],f=[0.25,0.66],g=[0.5,0.52];
  for(const [p,q] of [[a,b],[b,c],[c,d],[d,e],[e,f],[f,a],[a,g],[c,g],[g,e]])line(p,q);
  for(const [p,q] of [[[0.59,0.75],[0.59,0.57]],[[0.59,0.57],[0.67,0.525]],[[0.67,0.525],[0.67,0.705]]])line(p,q,[167,243,160]);
  const header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
  const rows=Buffer.alloc((size*4+1)*size);for(let y=0;y<size;y++)pixels.copy(rows,y*(size*4+1)+1,y*size*4,(y+1)*size*4);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
for(const size of [192,512])writeFileSync(new URL(`myroom-${size}.png`,output),icon(size));
writeFileSync(new URL('myroom-maskable-512.png',output),icon(512));
