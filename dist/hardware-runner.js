import {validPose,START} from './core.js';
export function physicalPreflight(program,usb,depth=0){if(depth>20)throw Error('반복·조건 중첩은 20단계까지입니다.');for(const c of program){
 if(c.kind==='sensor')throw Error('실물 실행에서는 가상 센서값 설정 블록을 제거하세요.');
 if(c.kind==='servo'){if(!Object.hasOwn(START,c.joint))throw Error('알 수 없는 관절입니다.');validPose({...START,[c.joint]:c.angle});}
 else if(c.kind==='pose')validPose(c);
 else if(c.kind==='station'&&!usb.teach.has(c.station+':'+c.mode))throw Error(`${c.station} 작업대 ${c.mode==='travel'?'운반':c.mode==='pick'?'집기':'놓기'} 높이를 실물에서 먼저 저장하세요.`);
 else if(c.kind==='repeat'&&(!Number.isInteger(c.count)||c.count<1||c.count>99))throw Error('반복 횟수는 1~99입니다.');
 else if(c.kind==='wait'&&(!Number.isFinite(c.ms)||c.ms<0||c.ms>30000))throw Error('대기는 0~30초입니다.');
 if(c.body)physicalPreflight(c.body,usb,depth+1);if(c.elseBody)physicalPreflight(c.elseBody,usb,depth+1);
 if(!['servo','grip','pose','station','repeat','forever','if','wait','read','stop','sensor'].includes(c.kind))throw Error('지원하지 않는 실물 블록입니다.');
}}
export class PhysicalRunner{
 constructor(usb,{onPose=()=>{},onStep=()=>{},onSensor=()=>{},wait=ms=>new Promise(r=>setTimeout(r,ms))}={}){Object.assign(this,{usb,onPose,onStep,onSensor,wait});this.token=0;this.running=false;}
 cancel(){this.token++;}
 async run(program){if(this.running)throw Error('실물 실행 중입니다.');if(!this.usb.ready)throw Error('USB 연결과 초기화를 먼저 완료하세요.');physicalPreflight(program,this.usb);const t=++this.token;this.steps=0;this.running=true;try{await this.execute(program,t,0);}finally{this.running=false;}return t===this.token;}
 async execute(program,t,depth){for(const c of program){if(t!==this.token)return;if(!this.usb.ready)throw Error('실물 연결 중단');if(++this.steps>10000)throw Error('실물 실행 10,000회 한도');this.onStep(c.id);
  if(c.kind==='repeat'||c.kind==='forever'){for(let i=0,n=c.kind==='forever'?Infinity:c.count;i<n&&t===this.token;i++){await this.execute(c.body,t,depth+1);await this.wait(25);}continue;}
  if(c.kind==='if'){const value=this.usb.sensor();this.onSensor(value);const yes=c.op==='le'?value<=c.value:c.op==='ge'?value>=c.value:value===c.value;await this.execute(yes?c.body:c.elseBody,t,depth+1);continue;}
  if(c.kind==='read'){this.onSensor(this.usb.sensor());continue;}
  if(c.kind==='stop'){this.cancel();await this.usb.emergency();return;}
  if(c.kind==='wait'){for(let left=c.ms;left>0&&t===this.token;left-=25)await this.wait(Math.min(25,left));continue;}
  let pose;if(c.kind==='servo')pose={...this.usb.pose,[c.joint]:c.angle};else if(c.kind==='grip')pose={...this.usb.pose,gripper:c.open?120:50};else if(c.kind==='pose')pose=Object.fromEntries(Object.keys(START).map(k=>[k,c[k]]));else if(c.kind==='station')pose={...this.usb.teach.get(c.station+':'+c.mode),gripper:this.usb.pose.gripper};
  await this.usb.moveTo(pose,{onPose:this.onPose});
 }}
}
