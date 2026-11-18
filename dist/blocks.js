const B=window.Blockly;
const num=(name,value,min,max)=>({type:'field_number',name,value,min,max,precision:.5});
const drop=(name,options)=>({type:'field_dropdown',name,options});
const statement=(type,message0,args0,colour=225,extra={})=>({type,message0,args0,previousStatement:null,nextStatement:null,colour,...extra});
B.defineBlocksWithJsonArray([
 {type:'ms_start',message0:'▶ 시작하기',nextStatement:null,colour:43},
 statement('ms_servo','%1 각도 %2 °',[drop('JOINT',[['베이스','base'],['하완','lower'],['상완','upper'],['그리퍼','gripper']]),num('ANGLE',90,10,170)]),
 statement('ms_grip','그리퍼 %1',[drop('OPEN',[['열기','yes'],['닫기','no']])]),
 statement('ms_pose','자세 · 베이스 %1 하완 %2 상완 %3 집게 %4',[num('base',90,10,170),num('lower',60,30,170),num('upper',130,10,160),num('gripper',120,50,120)]),
 statement('ms_station','%1 작업대로 이동 · %2',[drop('STATION',[['A 입고','A'],['B 빨강','B'],['C 초록 / 불량','C'],['D 파랑','D']]),drop('MODE',[['운반 높이','travel'],['집기 높이','pick'],['놓기 높이','place']])]),
 statement('ms_wait','%1 초 기다리기',[num('SECONDS',1,0,30)],175),
 statement('ms_repeat','%1 회 반복',[num('COUNT',3,1,99)],165,{message1:'%1',args1:[{type:'input_statement',name:'DO'}]}),
 statement('ms_forever','계속 반복',[],165,{message1:'%1',args1:[{type:'input_statement',name:'DO'}]}),
 statement('ms_if','만약 거리 %1 %2 cm',[drop('OP',[['≤','le'],['≥','ge'],['=','eq']]),num('VALUE',20,2,80)],285,{message1:'실행 %1',args1:[{type:'input_statement',name:'DO'}],message2:'그렇지 않으면 %1',args2:[{type:'input_statement',name:'ELSE'}]}),
 statement('ms_read','초음파 거리 읽기',[],38),
 statement('ms_sensor','가상 센서값 %1 cm 설정',[num('VALUE',10,2,80)],38),
 statement('ms_stop','■ 실행 정지',[],355)
]);
const toolbox={kind:'categoryToolbox',contents:[['동작',225,['servo','grip','pose','station']],['제어',175,['wait','stop']],['반복',165,['repeat','forever']],['조건',285,['if']],['센서',38,['read','sensor']]].map(([name,colour,types])=>({kind:'category',name,colour,contents:types.map(t=>({kind:'block',type:'ms_'+t}))}))};
// Native Blockly number editor supports touch keyboards; no prompt() dialog.
const original=B.FieldNumber.prototype.showEditor_;
B.FieldNumber.prototype.showEditor_=function(...args){const result=original.apply(this,args);setTimeout(()=>{const input=document.querySelector('.blocklyHtmlInput');if(input){input.setAttribute('inputmode','decimal');input.setAttribute('autocomplete','off');}},0);return result;};
export function createEditor(host,onChange){
 const workspace=B.inject(host,{toolbox,media:'./media/',renderer:'zelos',trashcan:true,scrollbars:true,sounds:false,grid:{spacing:22,length:2,colour:'#d6dfe9',snap:true},zoom:{controls:true,wheel:true,startScale:.85,minScale:.45,maxScale:1.5},move:{drag:true,wheel:true,scrollbars:true}});
 const observer=new ResizeObserver(()=>B.svgResize(workspace));observer.observe(host);
 workspace.addChangeListener(e=>{if(!e.isUiEvent)onChange();});
 function root(){return workspace.getBlocksByType('ms_start',false)[0];}
 function save(){return B.Xml.domToText(B.Xml.workspaceToDom(workspace));}
 function load(xml){workspace.clear();if(xml){B.Xml.domToWorkspace(B.utils.xml.textToDom(xml),workspace);}if(!root()){const r=workspace.newBlock('ms_start');r.initSvg();r.render();r.moveBy(25,25);}root().setDeletable(false);B.svgResize(workspace);}
 function insert(type){const block=workspace.newBlock('ms_'+type);block.initSvg();block.render();let tail=root();while(tail.getNextBlock())tail=tail.getNextBlock();tail.nextConnection.connect(block.previousConnection);workspace.centerOnBlock(block.id);}
 function parseChain(block,depth=0){if(depth>20)throw Error('블록 중첩이 너무 깊어요.');const out=[];while(block){if(!block.isEnabled()){block=block.getNextBlock();continue;}const type=block.type.replace('ms_',''),field=k=>block.getFieldValue(k),number=k=>Number(field(k));let c={kind:type,id:block.id};
  if(type==='servo')Object.assign(c,{joint:field('JOINT'),angle:number('ANGLE')});
  else if(type==='grip')c.open=field('OPEN')==='yes';
  else if(type==='pose')for(const k of ['base','lower','upper','gripper'])c[k]=number(k);
  else if(type==='station')Object.assign(c,{station:field('STATION'),mode:field('MODE')});
  else if(type==='wait')c.ms=number('SECONDS')*1000;
  else if(type==='repeat'||type==='forever'){c.count=number('COUNT');c.body=parseChain(block.getInputTargetBlock('DO'),depth+1);}
  else if(type==='if')Object.assign(c,{op:field('OP'),value:number('VALUE'),body:parseChain(block.getInputTargetBlock('DO'),depth+1),elseBody:parseChain(block.getInputTargetBlock('ELSE'),depth+1)});
  else if(type==='sensor')c.value=number('VALUE');
  else if(!['read','stop'].includes(type))throw Error('지원하지 않는 블록입니다.');
  out.push(c);block=block.getNextBlock();}return out;}
 function program(){if(workspace.getTopBlocks().length!==1)throw Error('떨어진 블록이 있어요. 모든 블록을 시작하기 아래에 연결하세요.');const p=parseChain(root().getNextBlock());if(!p.length)throw Error('시작하기 아래에 동작 블록을 연결하세요.');return p;}
 return {workspace,save,load,insert,program,count:()=>workspace.getAllBlocks(false).length,highlight:id=>workspace.highlightBlock(id),lock:locked=>{host.style.pointerEvents=locked?'none':'';host.setAttribute('aria-busy',String(locked));},dispose(){observer.disconnect();workspace.dispose();}};
}
