import {PADS,PAD_TOP,SIZE,tip} from './core.js';
export async function createSimulator(host){
 const T=window.THREE;if(!T)throw Error('3D 라이브러리를 불러오지 못했습니다.');
 const scene=new T.Scene();scene.background=new T.Color(0xeaf1f7);
 const camera=new T.PerspectiveCamera(42,1,.1,1500);const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','CubeLink 실물 모델 3D 시뮬레이션');
 const controls=new T.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=90;controls.maxDistance=450;
 function resetCamera(){camera.position.set(-140,155,210);controls.target.set(-15,45,0);controls.update();}resetCamera();
 renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;
 scene.add(new T.HemisphereLight(0xffffff,0x7c95a5,.8));const light=new T.DirectionalLight(0xffffff,.9);light.position.set(-80,180,100);light.castShadow=true;scene.add(light);
 const mat=(c)=>new T.MeshStandardMaterial({color:c,roughness:.65,metalness:.08});
 function box(w,h,d,color,x,y,z){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);return mesh;}
 box(225,2,190,0xe0e9f0,0,-1,0);const grid=new T.GridHelper(220,22,0xb0c2d0,0xcddce5);grid.position.y=.05;scene.add(grid);
 const colors={A:0xf4bb54,B:0xef6a66,C:0x39b990,D:0x5899ec};
 function label(text){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=96;const c=canvas.getContext('2d');c.fillStyle='#17354a';c.font='bold 42px sans-serif';c.textAlign='center';c.fillText(text,128,65);const sp=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(canvas),depthTest:false}));sp.scale.set(32,12,1);return sp;}
 for(const [k,p] of Object.entries(PADS)){box(22,3,22,colors[k],p.x,PAD_TOP-1.5,p.z);box(7,PAD_TOP-3,7,0xb7c8d5,p.x,(PAD_TOP-3)/2,p.z);box(22,2,22,0x9bafbe,p.x,1,p.z);const s=label(k);s.position.set(p.x,PAD_TOP-8,p.z+15);scene.add(s);}
 const loader=new T.GLTFLoader();const models=Object.fromEntries(await Promise.all(['base','lower','upper','grip01','grip02'].map(async name=>[name,(await loader.loadAsync('./models/cubelink-arm/'+name+'.glb')).scene])));
 const base=new T.Group(),lower=new T.Group(),upper=new T.Group(),grip=new T.Group(),f1=new T.Group(),f2=new T.Group();scene.add(base);base.position.set(0,11,0);models.base.position.set(0,-11,0);base.add(models.base,lower);lower.add(models.lower,upper);upper.position.set(-20,75,0);models.upper.position.set(20,-72,0);upper.add(models.upper,grip);grip.position.set(-40,-12,0);grip.add(f1,f2);f1.position.set(0,0,-1);f2.position.set(0,0,1);models.grip01.position.set(0,0,-10);models.grip02.position.set(0,0,7);f1.add(models.grip01);f2.add(models.grip02);
 Object.values(models).forEach(m=>m.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;}));
 const marker=new T.Mesh(new T.SphereGeometry(1.7,12,8),mat(0xffb323));scene.add(marker);
 let world,cubeMeshes=[];const cubeColors={red:0xef5d63,green:0x30b68c,blue:0x4b91eb};
 function update(w){world=w;const p=w.pose,r=T.MathUtils?.degToRad||T.Math.degToRad;base.rotation.y=r(p.base-90);lower.rotation.z=r(p.lower-90);upper.rotation.z=r(p.upper-90);f1.rotation.y=-r(p.gripper-90)*1.2;f2.rotation.y=r(p.gripper-90)*1.2;
  if(cubeMeshes.length!==w.cubes.length){for(const m of cubeMeshes){scene.remove(m);m.geometry.dispose();m.material.dispose();}cubeMeshes=w.cubes.map(c=>box(SIZE,SIZE,SIZE,cubeColors[c.color],c.x,c.y,c.z));}
  w.cubes.forEach((c,i)=>cubeMeshes[i].position.set(c.x,c.y,c.z));const t=tip(p);marker.position.set(t.x,t.y,t.z);
 }
 const observer=new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix();});observer.observe(host);
 let raf;function frame(){controls.update();renderer.render(scene,camera);raf=requestAnimationFrame(frame);}frame();
 return {update,resetCamera,dispose(){cancelAnimationFrame(raf);observer.disconnect();controls.dispose();renderer.dispose();},world:()=>world};
}
