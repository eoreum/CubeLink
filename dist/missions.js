export const STAGES=['로봇팔 조종사','큐브 운송센터','스마트팩토리','최종 챌린지','추가 도전'];
const titles=['베이스 좌우 회전','하완 들어 올리기','상완 각도 조절','그리퍼 열고 닫기','목표 자세 만들기','4개 관절 연속 동작','큐브 집기 기본','지정 위치로 옮기기','3색 큐브 분류','큐브 탑 쌓기','팔레트 정리하기','미니 물류센터','초음파 거리 확인','거리별 동작 선택','장애물 감지 후 정지','3회 반복 운반','조건에 따른 분류','자동 물류라인','제한시간 큐브 운반','최소 블록으로 해결','순서대로 큐브 배치','불량품 분리하기','스마트 창고 완성','나만의 로봇팔 미션','역방향 회수 작전','30블록 물류 마스터'];
const goals=[
 '베이스를 60° → 120° → 90° 순서로 움직이세요.',
 '하완을 80°로 내린 뒤 60°로 들어 올리세요.',
 '상완을 110° → 130°로 조절하세요.',
 '열린 집게를 닫고 다시 여세요.',
 '베이스 110°, 하완 75°, 상완 110°를 만들고 1초 기다리세요.',
 '베이스 60° → 하완 80° → 상완 110° → 집게 닫기 순서로 움직이세요.',
 'A의 빨간 큐브를 집어 작업대보다 높게 들어 올리세요.',
 'A의 큐브를 B로 운반하고 집게를 열어 놓으세요.',
 '빨강은 B, 초록은 C, 파랑은 D에 분류하세요.',
 'A의 큐브 3개를 B에 옮겨 3층 탑을 만드세요.',
 'B·C·D 팔레트에 큐브를 하나씩 배치하세요.',
 'A → B 검수(1초) → C 출고 순서로 큐브를 옮기세요.',
 '초음파 읽기 블록으로 가상 거리값을 2번 확인하세요.',
 '거리가 20cm 이하면 집게 닫기, 초과하면 열기를 선택하세요. 10·35cm 두 입력을 검사합니다.',
 '거리 10cm인 장애물을 읽고 조건 안에서 실행 정지 블록으로 멈추세요. 관절은 움직이지 마세요.',
 '횟수 반복 블록으로 A의 큐브 3개를 B로 운반하세요.',
 '20cm 이하면 A → B, 초과하면 A → C로 운반하세요. 10·35cm 두 입력을 검사합니다.',
 '센서 읽기·조건·반복을 사용해 빨강 B, 초록 C, 파랑 D로 자동 분류하세요.',
 '실행 시간 35초 안에 A의 큐브 1개를 B로 옮기세요.',
 '시작 블록 포함 12개 이하 블록으로 A → B 운반을 완성하세요.',
 '빨강 → 초록 → 파랑 순서로 B → C → D에 내려놓으세요.',
 '초록 큐브(불량)를 C로, 빨강·파랑(정상)을 B로 분리하세요.',
 '3색 큐브를 B·C·D에 정리한 뒤 베이스 90°·하완 60°·상완 130°로 복귀하세요.',
 '직접 정한 목표 작업대로 큐브 1개를 운반하고 1초 기다리세요. 목표는 아래에서 선택하세요.',
 'A → D로 옮긴 큐브를 다시 집어 B로 회수하세요.',
 '시작 블록 포함 30개 이하로 3색 분류를 해결하세요.'
];
const counts=[0,0,0,0,0,0,1,1,3,3,3,1,0,0,0,3,1,3,1,1,3,3,3,1,1,3];
export const missions=titles.map((title,i)=>({id:i+1,title,stage:i<24?Math.floor(i/6):4,difficulty:1+Math.min(4,Math.floor(i/6)),minutes:i<6?2:i<12?4:i<18?4:5,count:counts[i],goal:goals[i],initial:'가상 시작 자세 90° / 60° / 130° / 120°'+(counts[i]?` · A 작업대에 큐브 ${counts[i]}개 (위에서 빨강·초록·파랑)`:' · 큐브 없음'),hints:i<6?['관절 이름과 각도 범위를 확인하세요.','동작 블록을 시작하기 아래에 순서대로 연결하세요.','목표 각도를 순서대로 입력하고, 실행 뒤 판정을 확인하세요.']:['A는 입고, B·C·D는 목적지입니다. 작업대 이동 블록의 높이를 확인하세요.','집게 열기 → A 이동(집기 높이) → 닫기 → 운반 높이 순서를 생각해 보세요.','목적지의 놓기 높이까지 내린 뒤 집게를 여세요. 반복·조건이 필요한 미션은 해당 블록 안에 동작을 넣으세요.']}));
const near=(a,b)=>Math.abs(a-b)<1;
const joints=w=>w.events.filter(e=>e.type==='joint');
function sequence(w,targets){let p=0;for(const e of joints(w)){if(targets[p]&&e.joint===targets[p][0]&&near(e.angle,targets[p][1]))p++;}return p===targets.length;}
const placed=(w,targets)=>w.held===null&&w.cubes.length===targets.length&&w.cubes.every((c,i)=>c.picked&&c.releases>0&&c.station===targets[i]);
const sorted=w=>placed(w,['B','C','D']);
export function judge(w,{blocks=999,customTarget='B'}={}){
 const id=w.mission.id, e=w.events, has=t=>w.used.has(t), pose=w.pose;
 let pass=false;
 switch(id){
 case 1:pass=sequence(w,[['base',60],['base',120],['base',90]]);break;
 case 2:pass=sequence(w,[['lower',80],['lower',60]]);break;
 case 3:pass=sequence(w,[['upper',110],['upper',130]]);break;
 case 4:pass=sequence(w,[['gripper',50],['gripper',120]]);break;
 case 5:pass=near(pose.base,110)&&near(pose.lower,75)&&near(pose.upper,110)&&e.some(x=>x.type==='wait'&&x.ms>=1000);break;
 case 6:pass=sequence(w,[['base',60],['lower',80],['upper',110],['gripper',50]]);break;
 case 7:pass=w.held===0&&w.cubes[0].picked&&w.cubes[0].y>80;break;
 case 8:case 19:case 20:pass=placed(w,['B'])&&(id!==19||w.elapsed<=35000)&&(id!==20||blocks<=12);break;
 case 9:case 11:case 21:case 23:case 26:pass=sorted(w);if(id===21){pass&&=e.filter(x=>x.type==='release').map(x=>x.id).join(',')==='0,1,2';}if(id===23)pass&&=near(pose.base,90)&&near(pose.lower,60)&&near(pose.upper,130);if(id===26)pass&&=blocks<=30;break;
 case 10:case 16:pass=placed(w,['B','B','B'])&&(id!==16||has('repeat'));break;
 case 12:{const releases=e.filter(x=>x.type==='release');pass=placed(w,['C'])&&releases[0]?.station==='B'&&e.some(x=>x.type==='wait'&&x.ms>=1000&&x.time>releases[0].time&&x.time<releases[1]?.time);break;}
 case 13:pass=e.filter(x=>x.type==='read').length>=2;break;
 case 14:pass=has('if')&&near(pose.gripper,(w.inputSensor??w.sensor)<=20?50:120);break;
 case 15:pass=has('if')&&has('read')&&e.some(x=>x.type==='stop')&&!joints(w).some(x=>x.joint!=='gripper');break;
 case 17:pass=has('if')&&placed(w,[(w.inputSensor??w.sensor)<=20?'B':'C']);break;
 case 18:pass=sorted(w)&&['read','if','repeat'].every(has);break;
 case 22:pass=placed(w,['B','C','B']);break;
 case 24:pass=placed(w,[customTarget])&&e.some(x=>x.type==='wait'&&x.ms>=1000);break;
 case 25:pass=placed(w,['B'])&&e.some(x=>x.type==='release'&&x.station==='D')&&e.filter(x=>x.type==='pick').length>=2;break;
 }
 return {pass,message:pass?'미션 성공! 실제 동작 결과가 목표와 일치합니다.':`아직 목표에 도달하지 않았어요. ${w.mission.goal}`,score:pass?100:0};
}
export function trials(m){return [14,17].includes(m.id)?[10,35]:[m.id===15?10:40];}
