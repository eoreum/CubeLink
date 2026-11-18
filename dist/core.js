// Shared geometry and learning state. No serial transport is imported here.
export const LIMITS={base:[10,170],lower:[30,170],upper:[10,160],gripper:[50,120]};
export const STORAGE={base:90,lower:30,upper:160,gripper:90};
export const START={base:90,lower:60,upper:130,gripper:120}; // Simulation only; physical validation pending.
export const ANGLES={A:60,B:110,C:140,D:165};
export const SIZE=11, HALF=SIZE/2;
const rad=n=>n*Math.PI/180;
function rot(x,y,a){return [x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)];}
export function tip(p){
 const a=rad(p.lower-90),b=rad(p.lower+p.upper-180);
 const [x1,y1]=rot(-20,75,a),[x2,y2]=rot(-52,-12,b),yaw=rad(p.base-90);
 const x=x1+x2;return {x:x*Math.cos(yaw),y:11+y1+y2,z:-x*Math.sin(yaw)};
}
const contact=tip({...START,base:90,lower:80});
export const PAD_TOP=contact.y-HALF;
export const PADS=Object.fromEntries(Object.entries(ANGLES).map(([k,v])=>[k,tip({...START,base:v,lower:80})]));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function validPose(p){for(const [k,[lo,hi]] of Object.entries(LIMITS))if(!Number.isFinite(p[k])||p[k]<lo||p[k]>hi)throw Error(`${k} 각도는 ${lo}~${hi}°입니다.`);return p;}
export function poseAt(station,height,gripper=120){
 if(!PADS[station])throw Error('알 수 없는 작업대');
 let best,err=Infinity;
 for(let lower=30;lower<=170;lower+=.5)for(let upper=10;upper<=160;upper+=.5){
  const p={base:ANGLES[station],lower,upper,gripper},t=tip(p),d=distance(t,{...PADS[station],y:height});
  if(d<err){err=d;best=p;}
 }
 if(err>2)throw Error('도달할 수 없는 높이입니다.');return best;
}
export class World{
 constructor(mission){this.reset(mission);}
 reset(mission){this.mission=mission;this.pose={...START};this.sensor=40;this.held=null;this.events=[];this.elapsed=0;this.steps=0;this.used=new Set();this.cubes=Array.from({length:mission.count||0},(_,i)=>({id:i,color:['red','green','blue'][i%3],defect:i===1,station:'A',x:PADS.A.x,y:PAD_TOP+HALF+(mission.count-1-i)*SIZE,z:PADS.A.z,picked:false,releases:0}));}
 event(type,data={}){this.events.push({type,...data,time:this.elapsed});}
 stack(station,exclude=null){return this.cubes.filter(c=>c.id!==exclude&&c.station===station).sort((a,b)=>b.y-a.y);}
 target(station,mode){
  const stack=this.stack(station,this.held);
  const height=mode==='travel'?PAD_TOP+HALF+SIZE*4:mode==='pick'?(stack[0]?.y??PAD_TOP+HALF):PAD_TOP+HALF+stack.length*SIZE;
  return poseAt(station,height,this.pose.gripper);
 }
 move(p){validPose(p);const before=this.pose;this.pose={...p};if(this.held!==null){Object.assign(this.cubes[this.held],tip(p));}
  for(const k of Object.keys(p))if(Math.abs(before[k]-p[k])>.01)this.event('joint',{joint:k,angle:p[k]});
  if(before.gripper>65&&p.gripper<=65)this.close();
  if(before.gripper<105&&p.gripper>=105)this.open();
 }
 close(){const t=tip(this.pose);const c=this.cubes.filter(c=>c.station!=='held'&&distance(c,t)<5&& !this.cubes.some(o=>o.id!==c.id&&o.station===c.station&&o.y>c.y+2)).sort((a,b)=>distance(a,t)-distance(b,t))[0];
  if(c&&this.held===null){this.held=c.id;c.picked=true;c.station='held';Object.assign(c,t);this.event('pick',{id:c.id,color:c.color});}
 }
 open(){if(this.held===null)return;const c=this.cubes[this.held],t=tip(this.pose);const station=Object.keys(PADS).find(k=>Math.hypot(t.x-PADS[k].x,t.z-PADS[k].z)<9);const floor=station?PAD_TOP+HALF+this.stack(station,c.id).length*SIZE:HALF;
  // Release settles vertically onto the support surface, never hangs in midair.
  c.station=station||'floor';c.x=station?PADS[station].x:t.x;c.z=station?PADS[station].z:t.z;c.y=floor;c.releases++;this.held=null;this.event('release',{id:c.id,station:c.station,color:c.color,drop:Math.max(0,t.y-floor)});
 }
 read(){this.event('read',{value:this.sensor});return this.sensor;}
}
export class Runner{
 constructor(world,{animate=async()=>{},sleep=ms=>new Promise(r=>setTimeout(r,ms)),onStep=()=>{}}={}){this.world=world;this.animate=animate;this.sleep=sleep;this.onStep=onStep;this.token=0;this.running=false;}
 stop(){this.token++;this.running=false;}
 async wait(ms,t){for(let left=ms;left>0&&t===this.token;left-=25){const started=performance.now();await this.sleep(Math.min(25,left));if(t===this.token)this.world.elapsed+=performance.now()-started;}return t===this.token;}
 async run(program){if(this.running)throw Error('이미 실행 중입니다.');const t=++this.token;this.world.inputSensor=this.world.sensor;this.running=true;try{await this.execute(program,t,0);}finally{if(t===this.token)this.running=false;}return t===this.token;}
 async execute(program,t,depth){if(depth>20)throw Error('반복/조건 중첩은 20단계까지 가능합니다.');for(const c of program){if(t!==this.token)return;const w=this.world;if(++w.steps>10000)throw Error('10,000회 실행 한도입니다. 반복 범위를 줄이세요.');w.used.add(c.kind);this.onStep(c.id);
  if(c.kind==='repeat'||c.kind==='forever'){
   const n=c.kind==='forever'?Infinity:c.count;if(c.kind==='repeat'&&(!Number.isInteger(n)||n<1||n>99))throw Error('반복 횟수는 1~99입니다.');
   for(let i=0;i<n&&t===this.token;i++){await this.execute(c.body,t,depth+1);if(!await this.wait(25,t))return;}continue;
  }
  if(c.kind==='if'){w.event('branch',{value:w.sensor,op:c.op,threshold:c.value});const yes=c.op==='le'?w.sensor<=c.value:c.op==='ge'?w.sensor>=c.value:w.sensor===c.value;await this.execute(yes?c.body:c.elseBody,t,depth+1);continue;}
  if(c.kind==='stop'){w.event('stop');this.stop();return;}
  if(c.kind==='wait'){if(!await this.wait(c.ms,t))return;w.event('wait',{ms:c.ms});continue;}
  if(c.kind==='sensor'){w.sensor=c.value;w.event('sensor',{value:c.value});continue;}
  if(c.kind==='read'){w.read();continue;}
  let p;
  if(c.kind==='servo')p={...w.pose,[c.joint]:c.angle};
  else if(c.kind==='grip')p={...w.pose,gripper:c.open?120:50};
  else if(c.kind==='pose')p=Object.fromEntries(Object.keys(START).map(k=>[k,c[k]]));
  else if(c.kind==='station')p=w.target(c.station,c.mode);
  else throw Error('지원하지 않는 블록입니다.');
  validPose(p);const before={...w.pose};
  // Animate the same state used by judging, including attached cargo; cancellation freezes it.
  for(let i=1;i<=16;i++){if(!await this.wait(25,t))return;const f=i/16;w.move(Object.fromEntries(Object.keys(p).map(k=>[k,before[k]+(p[k]-before[k])*f])));await this.animate(w);}
  w.event('command',{kind:c.kind});
 }
 }
}
export function transport(from,to){return [{kind:'grip',open:true},{kind:'station',station:from,mode:'travel'},{kind:'station',station:from,mode:'pick'},{kind:'grip',open:false},{kind:'station',station:from,mode:'travel'},{kind:'station',station:to,mode:'travel'},{kind:'station',station:to,mode:'place'},{kind:'grip',open:true},{kind:'station',station:to,mode:'travel'}];}
