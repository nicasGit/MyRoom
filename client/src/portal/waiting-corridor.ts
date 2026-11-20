import * as THREE from 'three';
import { vortexSign } from './vortex-sign';
import { PortalGhosts } from './portal-ghosts';
import { entryWindow } from './entry-window';
import type { PortalPublic,Vec3 } from '../../../server/src/portal/portal-types.js';

/** Opaque enclosure: no camera movement, no dependency on native scene APIs. */
export function waitingTunnel(){
  const group=new THREE.Group();
  const shell=new THREE.Mesh(new THREE.SphereGeometry(20,24,16),new THREE.MeshBasicMaterial({color:0x030614,side:THREE.BackSide,depthTest:false,depthWrite:false}));
  shell.name='opaque-passthrough-cover';shell.renderOrder=-10000;shell.frustumCulled=false;
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
  return {group,shell,animate:(seconds:number)=>{material.uniforms.time.value=seconds;}};
}

export function waitingCorridor(){
  const view=waitingTunnel(),group=new THREE.Group(),board=vortexSign(),ghosts=new PortalGhosts();
  const window=entryWindow();group.add(view.group,view.shell,board.group,ghosts.group,window);group.visible=false;
  return {group,update(state:PortalPublic,slot:number,head:Vec3,seconds:number){
    const p=state.config.portal;
    window.position.set(p.x,p.height/2,p.z);window.rotation.y=p.yaw;window.scale.set(p.width,p.height,1);
    // Alpha-blend WebXR clears to transparent regardless of scene.background.
    // An opaque enclosure covers both eyes in every direction; only this flat
    // background follows the head. The tunnel and sign remain room anchored.
    view.shell.position.set(head.x,head.y,head.z);
    view.group.position.set(p.x,0,p.z);view.group.rotation.y=p.yaw+(p.direction===-1?Math.PI:0);
    if(!group.visible){
      // Position once on entry in the calibrated room, never follow the head.
      board.group.position.set(head.x-Math.sin(p.yaw)*p.direction*2.2,head.y-.1,head.z-Math.cos(p.yaw)*p.direction*2.2);
      board.group.rotation.y=p.yaw+(p.direction===-1?Math.PI:0);
    }
    const arrived=state.players.filter(p=>p.crossed).length,total=state.players.length;
    const confirmed=!!state.players.find(p=>p.slot===slot)?.crossed;
    ghosts.update(state,slot,head,seconds*1000);
    const visibleGhosts=ghosts.group.children.filter(ghost=>ghost.visible).length;
    board.draw(`${arrived}/${total} arrivés · ${confirmed?'Puis attendez ici':'Passage en attente'}`,visibleGhosts<total-1?'Suivi incomplet · Vérifiez l’espace réel':'Fantômes approximatifs · Gardez vos distances');
    group.visible=true;view.animate(seconds);
  }};
}
