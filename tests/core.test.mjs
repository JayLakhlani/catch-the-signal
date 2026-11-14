import test from 'node:test';import assert from 'node:assert/strict';
import {makeTrials,makeStages,quality,summary,durationSummary} from '../public/core.js';
test('three stages with both timing patterns match event counts and delays while varying predictability',()=>{
 for(let repeat=0;repeat<30;repeat++){
  const stages=makeStages();assert.equal(stages.length,3);assert.ok([1,2].includes(stages.filter(s=>s[0].regularity==='more_regular').length));
  for(const [index,stage]of stages.entries()){
   assert.equal(stage.length,10);assert.ok(stage.every(r=>r.stage_number===index+1));
   assert.equal(stage.filter(r=>['A','C'].includes(r.cue)).length,5);assert.equal(stage.filter(r=>['B','D'].includes(r.cue)).length,5);
   for(const delay of [600,1200]){const at=stage.filter(r=>r.planned_delay_ms===delay);assert.equal(at.length,5);assert.equal(at.filter(r=>r.condition==='expected').length,stage[0].regularity==='more_regular'?4:3);}
  }
 }
});
test('practice has eight trials, and main has thirty',()=>{assert.equal(makeTrials('practice').length,8);assert.equal(makeTrials().length,30);});
test('quality flags precede scoring and missing scores remain missing',()=>{
 const base={input_type:'keyboard',rt_ms:250,anticipations:0,interrupted:false,max_frame_gap_ms:17};assert.equal(quality(base),'valid');assert.equal(quality({...base,rt_ms:null}),'miss');assert.equal(quality({...base,interrupted:true}),'interrupted');assert.equal(quality({...base,anticipations:1}),'anticipation');assert.equal(quality({...base,max_frame_gap_ms:70}),'frame_gap');assert.equal(quality({...base,rt_ms:1100}),'too_slow');
 const rows=makeTrials().map(r=>({...r,...base,rt_ms:r.condition==='expected'?250:290}));assert.equal(summary(rows).surprise_cost_ms,40);assert.ok([4,5].includes(summary(rows).counts.unexpected_600));assert.equal(summary(rows.slice(0,10)).surprise_cost_ms,null);assert.equal(summary([]).surprise_cost_ms,null);
});

test('duration comparisons keep the sign, sum matched stage windows and preserve missing times',()=>{
 const report=durationSummary([{stage_number:1,actual_duration_s:20,felt_duration_s:25},{stage_number:2,actual_duration_s:30,felt_duration_s:24},{stage_number:3,actual_duration_s:10,felt_duration_s:10}]);
 assert.deepEqual(report.stages.map(s=>s.time_difference_s),[5,-6,0]);assert.equal(report.actual_duration_s,60);assert.equal(report.predicted_duration_s,59);assert.equal(report.time_difference_s,-1);
 const missing=durationSummary([{stage_number:1,actual_duration_s:null,felt_duration_s:25,interrupted:true}]);assert.equal(missing.actual_duration_s,null);assert.equal(missing.time_difference_s,null);assert.equal(missing.stages[0].interrupted,true);
});
test('third stage can use either pattern while keeping one stage of each',()=>{for(const random of [()=>.25,()=>.75]){const stages=makeStages(random);assert.equal(stages.length,3);assert.ok(stages.some(s=>s[0].regularity==='more_regular'));assert.ok(stages.some(s=>s[0].regularity==='less_regular'));}});

test('stage durations vary independently of timing condition and all four cues appear',()=>{for(let i=0;i<30;i++){const blocks=makeStages();const totals=blocks.map(b=>b.slice(1).reduce((n,r)=>n+r.fixation_ms,0)).sort((a,b)=>a-b);assert.ok(totals[1]-totals[0]>1500);assert.ok(totals[2]-totals[1]>1500);for(const b of blocks){assert.deepEqual([...new Set(b.map(r=>r.cue))].sort(),['A','B','C','D']);for(const r of b)assert.equal(r.condition==='expected',(['A','C'].includes(r.cue)?600:1200)===r.planned_delay_ms);}}});
