// Browser QA inputs, deliberately separate from the student-facing app.
import fs from 'node:fs';import path from 'node:path';import {transport,START} from '../dist/core.js';
const target=path.resolve(process.argv[2]||'../../work/mission-v2/fixtures');fs.mkdirSync(target,{recursive:true});
const fields=o=>Object.entries(o).map(([k,v])=>`<field name="${k}">${v}</field>`).join('');
function chain(list){if(!list.length)return '';const [c,...rest]=list;let f={},inside='';switch(c.kind){case 'servo':f={JOINT:c.joint,ANGLE:c.angle};break;case 'grip':f={OPEN:c.open?'yes':'no'};break;case 'station':f={STATION:c.station,MODE:c.mode};break;case 'wait':f={SECONDS:c.ms/1000};break;case 'sensor':f={VALUE:c.value};break;case 'repeat':case 'forever':f={COUNT:c.count||3};inside=`<statement name="DO">${chain(c.body)}</statement>`;break;case 'if':f={OP:'le',VALUE:20};inside=`<statement name="DO">${chain(c.body)}</statement><statement name="ELSE">${chain(c.elseBody||[])}</statement>`;break;case 'pose':f={...START};break;}
return `<block type="ms_${c.kind}">${fields(f)}${inside}${rest.length?`<next>${chain(rest)}</next>`:''}</block>`;}
const fixtures={
 'mission1':{id:1,commands:[60,120,90].map(angle=>({kind:'servo',joint:'base',angle}))},
 'mission8':{id:8,commands:transport('A','B')},
 'mission9':{id:9,commands:['B','C','D'].flatMap(s=>transport('A',s))},
 'mission14':{id:14,commands:[{kind:'if',body:[{kind:'grip',open:false}],elseBody:[{kind:'grip',open:true}]}]},
 'mission16':{id:16,commands:[{kind:'repeat',count:3,body:transport('A','B')}]},
 'forever':{id:1,commands:[{kind:'forever',body:[{kind:'servo',joint:'base',angle:120},{kind:'servo',joint:'base',angle:60}]}]},
 'invalid':{id:1,commands:[{kind:'servo',joint:'lower',angle:10}]}
};
for(const [name,{id,commands}]of Object.entries(fixtures)){const xml=`<xml xmlns="https://developers.google.com/blockly/xml"><block type="ms_start" x="25" y="25"><next>${chain(commands)}</next></block></xml>`;fs.writeFileSync(path.join(target,name+'.json'),JSON.stringify({format:'CubeLinkMission2',mission:id,xml}));}console.log('Created '+Object.keys(fixtures).length+' browser fixtures in '+target);
