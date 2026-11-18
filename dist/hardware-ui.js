import {CubeLinkUSB,hardwareStatus,INITIALIZED} from './hardware.js';
import {PhysicalRunner} from './hardware-runner.js';
import {LIMITS} from './core.js';
export function mountHardware({program,highlight,lock,status,beginPhysical,onPose,onSensor}){
 const $=id=>document.getElementById(id);let busy=false,physical=false;const lines=[];
 const usb=new CubeLinkUSB({onChange:()=>{render();if(!usb.ready&&physicalRunner?.running)physicalRunner.cancel();},onLine:line=>{lines.push(line);if(lines.length>80)lines.shift();$('hw-log').textContent=lines.join('\n');}});
 const physicalRunner=new PhysicalRunner(usb,{onStep:highlight,onPose,onSensor});
 function render(){const state=usb.state,connected=state!=='disconnected';$('hw-status').textContent=usb.message||'USB 연결 전';$('hw-state').textContent=({disconnected:'연결 전',opening:'포트 선택',verifying:'펌웨어 확인',verified:'초기화 전',recovery:'자세 확인 필요',initializing:'초기화 중',ready:'실물 준비 완료',stopping:'모터 해제 중',parking:'저장 종료 중',fault:'연결 오류'})[state];
  $('hw-connect').disabled=connected||busy||!usb.serial;$('hw-init').disabled=busy||!['verified','recovery'].includes(state)||!$('hw-confirm').checked;$('hw-disconnect').disabled=!connected||busy;$('hw-park').disabled=!usb.ready||busy;$('hw-manual').disabled=!usb.ready||busy;$('hw-teach').disabled=!usb.ready||busy;$('real-run').disabled=!usb.ready||busy||!$('hw-trial').checked;$('hw-emergency').disabled=!usb.identity||!usb.writer;
  $('hw-distance').textContent=usb.distance===null?'미수신':usb.distance+' cm'+(Date.now()-usb.distanceAt>1500?' (오래된 값)':'');$('hw-pose').textContent=Object.values(usb.pose).join('° / ')+'°';$('hw-taught').textContent=[...usb.teach.keys()].join(', ')||'저장한 작업대 위치 없음';
  if(!['initializing','verified','recovery'].includes(state))$('hw-confirm').checked=false;
 }
 function setBusy(value){busy=value;lock(value);render();}
 async function action(fn){if(busy)return;setBusy(true);try{await fn();}catch(e){status(e.message);$('hw-status').textContent=e.message;}finally{setBusy(false);}}
 $('hardware').textContent='USB 실물 연결';$('hardware').onclick=()=>{$('hardware-dialog').showModal();render();};
 $('hw-connect').onclick=()=>action(()=>usb.connect());$('hw-init').onclick=()=>action(async()=>{await usb.initialize($('hw-confirm').checked);onPose({...usb.pose});status('실물 초기화 완료 · 첫 동작은 한 관절씩 점검하세요.');});
 $('hw-confirm').onchange=render;$('hw-trial').onchange=render;$('hw-disconnect').onclick=()=>action(async()=>{await usb.close();status('USB 연결을 해제했습니다.');});$('hw-park').onclick=()=>action(async()=>{await usb.park();onPose({...usb.pose});status('저장자세 이동·모터 해제 완료');});
 $('hw-emergency').onclick=async()=>{physicalRunner.cancel();try{await usb.emergency();status('모터 해제 확인 · 팔을 받치고 저장자세를 다시 맞추세요.');}catch(e){status(e.message);}render();};
 function range(){const k=$('hw-joint').value,[lo,hi]=LIMITS[k];$('hw-angle').min=lo;$('hw-angle').max=hi;$('hw-angle').value=usb.pose[k];$('hw-range').textContent=lo+'~'+hi+'°';}range();$('hw-joint').onchange=range;
 $('hw-manual').onclick=()=>action(async()=>{physical=true;try{beginPhysical();await usb.moveTo({...usb.pose,[$('hw-joint').value]:Number($('hw-angle').value)},{onPose});status('선택한 관절의 명령 전송 완료 · 실제 방향을 확인하세요.');}finally{physical=false;}});
 $('hw-teach').onclick=()=>{try{usb.record($('hw-station').value,$('hw-level').value);status('현재 명령 자세를 작업대 위치로 저장했습니다.');}catch(e){status(e.message);}render();};
 $('real-run').onclick=()=>action(async()=>{if(!$('hw-trial').checked)throw Error('실물 시험판 안내를 먼저 확인하세요.');const p=program();physical=true;beginPhysical();status('실물 실행 중 · 큐브 성공 여부는 관찰로 확인하세요.');try{const done=await physicalRunner.run(p);status(done?'실물 명령 전송 완료 · 가상 점수를 자동 부여하지 않습니다.':'실물 실행을 정지했습니다.');}catch(e){await usb.emergency().catch(()=>{});throw e;}finally{physical=false;highlight(null);}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&physicalRunner.running){physicalRunner.cancel();usb.emergency().catch(()=>{});}});
 window.addEventListener('beforeunload',e=>{if(usb.ready||physicalRunner.running){e.preventDefault();e.returnValue='';}});
 $('hw-notice').textContent=hardwareStatus.reason+(usb.serial?'':' 이 브라우저에서는 USB 시리얼을 사용할 수 없습니다. PC Chrome/Edge로 열어주세요.');render();
 return {usb,lock(value){busy=value;render();},isPhysical:()=>physical||['initializing','parking'].includes(usb.state),stop:async()=>{physicalRunner.cancel();await usb.emergency();},hasMotor:()=>usb.ready,INITIALIZED};
}
