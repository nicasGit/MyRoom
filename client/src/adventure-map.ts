import { puzzlePanel,type Point2,type RoomModel } from '../../server/src/scene-schema.js';
export const ITEM_NAMES={chest:'Coffre',sun:'Soleil',tree:'Arbre',moon:'Lune',star:'Étoile',table:'Table de blackjack',four:'Carte 4',eight:'Carte 8',king:'Carte Roi'};
export function drawMap(canvas:HTMLCanvasElement,model:RoomModel,markers:{point:Point2;label:string;color?:string}[],player?:Point2){
  const panel=model.puzzles&&puzzlePanel(model);if(panel)markers=[...markers,{point:panel.position,label:'Panneau mural',color:'#c4a7ff'}];
  const context=canvas.getContext('2d')!;canvas.width=800;canvas.height=420;
  const xs=model.floor.map(p=>p.x),zs=model.floor.map(p=>p.z),minX=Math.min(...xs)-0.5,maxX=Math.max(...xs)+0.5,minZ=Math.min(...zs)-0.5,maxZ=Math.max(...zs)+0.5;
  const scale=Math.min(740/(maxX-minX),360/(maxZ-minZ)),ox=(800-(maxX-minX)*scale)/2,oz=(420-(maxZ-minZ)*scale)/2;
  const screen=(p:Point2)=>({x:ox+(p.x-minX)*scale,y:oz+(p.z-minZ)*scale});
  context.fillStyle='#0b1424';context.fillRect(0,0,800,420);context.beginPath();
  model.floor.forEach((p,i)=>{const v=screen(p);if(i===0)context.moveTo(v.x,v.y);else context.lineTo(v.x,v.y);});
  context.closePath();context.fillStyle='#182b40';context.fill();context.strokeStyle='#67e8f9';context.lineWidth=2;context.stroke();
  context.fillStyle='#775033';for(const o of model.obstacles){const p=screen({x:o.x-o.width/2,z:o.z-o.depth/2});context.fillRect(p.x,p.y,o.width*scale,o.depth*scale);}
  context.font='15px sans-serif';context.textAlign='center';
  for(const marker of markers){const p=screen(marker.point);context.beginPath();context.arc(p.x,p.y,7,0,Math.PI*2);context.fillStyle=marker.color??'#ffe082';context.fill();context.fillStyle='white';context.fillText(marker.label,p.x,Math.max(16,p.y-12));}
  if(player){const p=screen(player);context.strokeStyle='#ffffff';context.lineWidth=3;context.beginPath();context.arc(p.x,p.y,11,0,Math.PI*2);context.stroke();}
  context.fillStyle='#c3d8eb';context.textAlign='left';context.fillText('Vue de dessus · coordonnées en mètres dans le repère A/B',16,404);
  return (x:number,y:number)=>({x:(x-ox)/scale+minX,z:(y-oz)/scale+minZ});
}
