import * as THREE from 'three';
import { label } from '../adventure-view';
import type { PortalPublic,Vec3 } from '../../../server/src/portal/portal-types.js';

/** Opaque enclosure: no camera movement, no dependency on native scene APIs. */
export function waitingTunnel(){
  const group=new THREE.Group();
  const shell=new THREE.Mesh(new THREE.SphereGeometry(100,24,16),new THREE.MeshBasicMaterial({color:0x030614,side:THREE.BackSide}));
  group.add(shell);
  const material=new THREE.ShaderMaterial({
    side:THREE.BackSide,
    uniforms:{time:{value:0}},
    vertexShader:`varying vec3 location;
      void main(){location=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying vec3 location;uniform float time;
      void main(){
        float angle=atan(location.z,location.x);
        float spiral=angle*4.0+location.y*.65-time*.35;
        float waves=pow(.5+.5*sin(spiral),7.0);
        float rings=pow(.5+.5*sin(location.y*1.8+sin(angle*3.0+time*.2)*.7-time*.6),18.0);
        float cloud=.5+.5*sin(angle*7.0+location.y*.3+sin(spiral)*2.0);
        vec3 base=mix(vec3(.012,.025,.10),vec3(.10,.035,.22),cloud);
        vec3 color=base+vec3(.04,.24,.55)*waves+vec3(.14,.46,.65)*rings;
        gl_FragColor=vec4(color,1.0);
      }`,
  });
  const tunnel=new THREE.Mesh(new THREE.CylinderGeometry(5,5,60,64,1,true),material);
  tunnel.rotation.x=Math.PI/2;tunnel.position.set(0,1.5,-16);group.add(tunnel);
  return {group,animate:(seconds:number)=>{material.uniforms.time.value=seconds;}};
}

export function waitingCorridor(){
  const view=waitingTunnel(),group=new THREE.Group(),board=new THREE.Group();
  group.add(view.group,board);group.visible=false;
  let key='';
  return {group,update(state:PortalPublic,slot:number,head:Vec3,seconds:number){
    const p=state.config.portal;
    view.group.position.set(p.x,0,p.z);view.group.rotation.y=p.yaw+(p.direction===-1?Math.PI:0);
    if(!group.visible){
      // Position once on entry in the calibrated room, never follow the head.
      board.position.set(head.x-Math.sin(p.yaw)*p.direction*1.2,head.y-.1,head.z-Math.cos(p.yaw)*p.direction*1.2);
    }
    const arrived=state.players.filter(p=>p.crossed).length,total=state.players.length;
    const confirmed=!!state.players.find(p=>p.slot===slot)?.crossed;
    const lines=['Entre les univers',`${arrived}/${total} passages validés`,confirmed?'Restez ici, attendez le groupe':'Avancez la tête doucement pour valider',state.phase==='transitioning'?'Le groupe est prêt…':'Restez dans votre espace réel dégagé'];
    const next=JSON.stringify(lines);
    if(key!==next){
      for(const child of [...board.children]){
        const sprite=child as THREE.Sprite;sprite.material.map?.dispose();sprite.material.dispose();board.remove(child);
      }
      lines.forEach((text,i)=>{const sprite=label(text,i===0?'#a5f3fc':'#ffffff');sprite.scale.set(1.25,.24,1);sprite.position.y=.38-i*.25;board.add(sprite);});
      key=next;
    }
    group.visible=true;view.animate(seconds);
  }};
}
