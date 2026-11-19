import * as THREE from 'three';
import { puzzlePanel,type RoomModel } from '../../../server/src/scene-schema.js';
export type MenuButton={id:string;title:string;disabled?:boolean};
export type MenuHit={id:string;x:number;y:number;width:number;height:number};
export function hitMenu(hits:MenuHit[],u:number,v:number){
  const x=u*1024,y=(1-v)*768;return hits.find(hit=>x>=hit.x&&x<=hit.x+hit.width&&y>=hit.y&&y<=hit.y+hit.height)?.id;
}
export function positionWallMenu(group:THREE.Object3D,room:RoomModel){
  const pose=puzzlePanel(room);if(!pose)return false;
  group.position.set(pose.position.x,pose.height,pose.position.z);group.rotation.set(0,pose.yaw,0);return true;
}
export class WallMenuView {
  readonly group=new THREE.Group();
  private anchor=new THREE.Group();
  readonly canvas=document.createElement('canvas');private context:CanvasRenderingContext2D;
  private texture:THREE.CanvasTexture;private mesh:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;private hits:MenuHit[]=[];
  constructor(overlay=false){
    this.canvas.width=1024;this.canvas.height=768;this.context=this.canvas.getContext('2d')!;
    this.texture=new THREE.CanvasTexture(this.canvas);this.texture.colorSpace=THREE.SRGBColorSpace;
    this.mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,.75),new THREE.MeshBasicMaterial({map:this.texture,side:THREE.DoubleSide,depthTest:!overlay,depthWrite:!overlay}));this.mesh.renderOrder=overlay?1000:0;
    this.group.add(this.anchor);this.anchor.add(this.mesh);this.group.name='myroom-wall-menu';
  }
  place(room:RoomModel){return positionWallMenu(this.anchor,room);}
  atUV(u:number,v:number){return hitMenu(this.hits,u,v);}
  draw(title:string,lines:string[],buttons:MenuButton[]){
    const c=this.context;c.fillStyle='#101e32';c.fillRect(0,0,1024,768);c.strokeStyle='#80efb0';c.lineWidth=5;c.strokeRect(3,3,1018,762);
    c.fillStyle='#80efb0';c.font='bold 38px sans-serif';c.fillText(title.slice(0,45),32,55);
    c.fillStyle='#f0f6ff';c.font='25px sans-serif';lines.slice(0,4).forEach((line,i)=>c.fillText(line.slice(0,72),32,100+i*34));
    this.hits=buttons.slice(0,36).map((button,i)=>{const cols=buttons.length>14?6:2,width=cols===6?150:465,height=cols===6?62:58;
      const hit={id:button.id,x:32+(i%cols)*(width+18),y:244+Math.floor(i/cols)*(height+12),width,height};
      c.fillStyle=button.disabled?'#24303e':'#234361';c.fillRect(hit.x,hit.y,width,height);c.fillStyle=button.disabled?'#87919b':'#ffffff';c.font=`${cols===6?25:24}px sans-serif`;c.fillText(button.title.slice(0,cols===6?9:32),hit.x+12,hit.y+38);return {...hit,disabled:button.disabled};}).filter(hit=>!hit.disabled);
    this.texture.needsUpdate=true;
  }
  pick(origin:THREE.Vector3,direction:THREE.Vector3){
    this.group.updateWorldMatrix(true,true);const hit=new THREE.Raycaster(origin,direction,0,8).intersectObject(this.mesh)[0];
    return hit?.uv?hitMenu(this.hits,hit.uv.x,hit.uv.y):undefined;
  }
  intersects(origin:THREE.Vector3,direction:THREE.Vector3){this.group.updateWorldMatrix(true,true);return !!new THREE.Raycaster(origin,direction,0,8).intersectObject(this.mesh)[0];}
  dispose(){this.group.removeFromParent();this.mesh.geometry.dispose();this.mesh.material.dispose();this.texture.dispose();}
}
