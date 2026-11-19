import * as THREE from 'three';

// Procedural energy tunnel: no video, external texture or post-processing pass.
export function vortexView(width:number,height:number){
  const group=new THREE.Group();group.name='energy-vortex';group.scale.set(width,height,1);
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
    uniforms:{time:{value:0}},
    vertexShader:`varying vec2 uvPortal; void main(){uvPortal=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`precision mediump float;
      varying vec2 uvPortal; uniform float time;
      void main(){
        vec2 p=(uvPortal-.5)*2.;float r=length(p);float a=atan(p.y,p.x);
        float twist=a*5.+log(max(r,.025))*11.-time*3.;
        float arms=pow(.5+.5*sin(twist+sin(r*19.-time*2.)*.65),5.);
        float wisps=pow(.5+.5*sin(a*13.+r*32.-time*5.),12.);
        float rim=exp(-pow((r-.91)*24.,2.));
        vec3 color=mix(vec3(.003,.008,.06),vec3(.015,.12,.42),smoothstep(.02,.65,r));
        color+=vec3(.07,.48,1.)*arms*(.2+.8*r)+vec3(.2,.65,1.)*wisps*.2;
        color+=vec3(.45,.85,1.)*rim*(.8+.2*sin(a*17.-time*6.));
        float edge=1.-smoothstep(.93,1.,r);
        gl_FragColor=vec4(color,edge*.9);
      }`,
  });
  const surface=new THREE.Mesh(new THREE.CircleGeometry(.5,80),material);group.add(surface);
  const rimMaterial=new THREE.MeshBasicMaterial({color:0x8deaff,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false});
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.465,.012,6,80),rimMaterial);rim.position.z=.007;group.add(rim);
  const tunnel=new THREE.Group();group.add(tunnel);
  for(let strand=0;strand<3;strand++){
    const points=Array.from({length:100},(_,i)=>{const t=i/99,angle=t*Math.PI*5+strand*Math.PI*2/3,r=.43*(1-t)+.025;return new THREE.Vector3(Math.cos(angle)*r,Math.sin(angle)*r,-t*1.2);});
    const ribbon=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),100,.008,4,false),new THREE.MeshBasicMaterial({color:strand===1?0xa7eaff:0x238aff,transparent:true,opacity:.65,blending:THREE.AdditiveBlending,depthWrite:false}));tunnel.add(ribbon);
  }
  const count=120,positions=new Float32Array(count*3),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const particles=new THREE.Points(geometry,new THREE.PointsMaterial({color:0x9beeff,size:.012,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false}));particles.frustumCulled=false;group.add(particles);
  const animate=(seconds:number)=>{
    material.uniforms.time.value=seconds%1000;tunnel.rotation.z=-seconds*.7;
    for(let i=0;i<count;i++){const t=(i/count+seconds*.13)%1,angle=i*2.399963+seconds*(.5+t),radius=.46*(1-t)+.015;positions[i*3]=Math.cos(angle)*radius;positions[i*3+1]=Math.sin(angle)*radius;positions[i*3+2]=-t*1.2+.015;}
    geometry.attributes.position.needsUpdate=true;
  };
  animate(0);
  return {group,animate,crossed:()=>rimMaterial.color.setHex(0xffe082)};
}
