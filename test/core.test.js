import test from 'node:test';import assert from 'node:assert/strict';
import {World,Runner,START,STORAGE,LIMITS,tip,PAD_TOP,SIZE,PADS,transport,validPose,distance} from '../dist/core.js';
import {missions,judge,trials} from '../dist/missions.js';
const servo=(joint,angle)=>({kind:'servo',joint,angle}),grip=open=>({kind:'grip',open}),wait={kind:'wait',ms:1000},read={kind:'read'},stop={kind:'stop'};
const branch=(body,elseBody=[])=>({kind:'if',op:'le',value:20,body,elseBody});
const repeat=(body,count=3)=>({kind:'repeat',body,count});
const sort=[...transport('A','B'),...transport('A','C'),...transport('A','D')];
const programs={
 1:[60,120,90].map(x=>servo('base',x)),2:[80,60].map(x=>servo('lower',x)),3:[110,130].map(x=>servo('upper',x)),4:[grip(false),grip(true)],
 5:[{kind:'pose',base:110,lower:75,upper:110,gripper:120},wait],6:[servo('base',60),servo('lower',80),servo('upper',110),grip(false)],
 7:transport('A','B').slice(0,5),8:transport('A','B'),9:sort,10:[repeat(transport('A','B'))],11:sort,
 12:[...transport('A','B'),wait,...transport('B','C')],13:[read,read],14:[branch([grip(false)],[grip(true)])],
 15:[read,branch([stop])],16:[repeat(transport('A','B'))],17:[branch(transport('A','B'),transport('A','C'))],
 18:[{kind:'sensor',value:10},read,branch([repeat(sort,1)])],19:transport('A','B'),20:transport('A','B'),21:sort,
 22:[...transport('A','B'),...transport('A','C'),...transport('A','B')],23:[...sort,{kind:'pose',...START}],
 24:[...transport('A','B'),wait],25:[...transport('A','D'),...transport('D','B')],26:sort
};
for(const m of missions)test(`mission ${m.id}: positive & empty negative; ${trials(m).length} sensor case(s)`,async()=>{
 assert.equal(judge(new World(m),{blocks:1}).pass,false,'empty workspace must not pass');
 for(const sensor of trials(m)){const w=new World(m);w.sensor=sensor;const r=new Runner(w,{sleep:async()=>{}});await r.run(programs[m.id]);assert.equal(judge(w,{blocks:m.id===20?10:28}).pass,true,JSON.stringify({id:m.id,pose:w.pose,cubes:w.cubes,events:w.events.filter(e=>e.type!=='joint')}));}
});
test('limits reject all axes beyond safe range; storage differs from simulation start',()=>{assert.notDeepEqual(START,STORAGE);for(const [joint,[lo,hi]]of Object.entries(LIMITS)){assert.throws(()=>validPose({...START,[joint]:lo-1}));assert.throws(()=>validPose({...START,[joint]:hi+1}));assert.throws(()=>validPose({...START,[joint]:NaN}));}});
test('cargo needs actual proximity, closed gripper and correct destination',async()=>{const w=new World(missions[7]);w.move({...START,gripper:50});assert.equal(w.held,null);w.move({...START,gripper:120});await new Runner(w,{sleep:async()=>{}}).run(transport('A','C'));assert.equal(judge(w).pass,false);assert.equal(w.cubes[0].station,'C');assert.equal(w.cubes[0].y,PAD_TOP+SIZE/2);});
test('stack contact surfaces are contiguous, with no suspended cube',async()=>{const w=new World(missions[9]);await new Runner(w,{sleep:async()=>{}}).run(programs[10]);const ys=w.cubes.map(c=>c.y).sort((a,b)=>a-b);assert.deepEqual(ys,[0,1,2].map(i=>PAD_TOP+SIZE/2+i*SIZE));});
test('mid-motion stop freezes state and a new run is isolated',async()=>{const w=new World(missions[0]);let frames=0;const r=new Runner(w,{sleep:async()=>{},animate:async()=>{if(++frames===5)r.stop();}});await r.run([servo('base',120)]);assert.ok(w.pose.base>90&&w.pose.base<120);const frozen={...w.pose};await Promise.resolve();assert.deepEqual(w.pose,frozen);r.animate=async()=>{};await r.run([servo('base',60)]);assert.equal(w.pose.base,60);});
test('forever empty body remains cancellable and waits cancel without scoring',async()=>{let ticks=0;const w=new World(missions[0]);const r=new Runner(w,{sleep:async()=>{if(++ticks===10)r.stop();}});await r.run([{kind:'forever',body:[]}]);assert.equal(r.running,false);assert.ok(ticks<=10);assert.equal(judge(w).pass,false);});
test('block limit and deadline do not accept inefficient or late solutions',async()=>{for(const id of [19,20]){const w=new World(missions[id-1]);await new Runner(w,{sleep:async()=>{}}).run(programs[id]);if(id===19)w.elapsed=35001;assert.equal(judge(w,{blocks:13}).pass,false);}});
test('wrong sensor branch rejected for each case',async()=>{const m=missions[16];for(const sensor of [10,35]){const w=new World(m);w.sensor=sensor;await new Runner(w,{sleep:async()=>{}}).run(transport('A',sensor===10?'C':'B'));assert.equal(judge(w).pass,false);}});
test('pick is only permitted for the top of a stack',()=>{const w=new World(missions[8]);w.move({...w.target('A','pick'),gripper:120});w.move({...w.pose,gripper:50});assert.equal(w.held,0);assert.ok(distance(w.cubes[0],tip(w.pose))<1);});
test('overriding sensor cannot replace the original condition test input',async()=>{const w=new World(missions[13]);w.sensor=35;await new Runner(w,{sleep:async()=>{}}).run([{kind:'sensor',value:10},branch([grip(false)],[grip(true)])]);assert.equal(judge(w).pass,false);});
