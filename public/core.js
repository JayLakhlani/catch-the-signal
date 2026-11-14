export const VERSION='g57-signal-2.4';
export const PLAN={practice:8,main:30,block:10,stages:3,responseWindow:1000};
export const shuffle=(input,random=Math.random)=>{const a=[...input];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function makeBlock(regularity,stage_number,random=Math.random){
  const expectedCount=regularity==='more_regular'?4:3,out=[];
  for(const delay of [600,1200])for(const expected of [true,false])for(let i=0;i<(expected?expectedCount:5-expectedCount);i++){
    const expectedCue=delay===600?'A':'B';out.push({phase:'main',stage_number,regularity,expected_probability:expectedCount/5,cue:expected?expectedCue:(expectedCue==='A'?'B':'A'),condition:expected?'expected':'unexpected',planned_delay_ms:delay});
  }return shuffle(out,random);
}
function variedCues(rows,random){const pools={early:shuffle(['A','C','A','C','A'],random),late:shuffle(['B','D','B','D','B'],random)};return rows.map(r=>({...r,cue:pools[r.cue==='A'?'early':'late'].pop()}));}
export function makeStages(random=Math.random){const bases=shuffle([350,650,950],random);return shuffle(['more_regular','less_regular',random()<.5?'more_regular':'less_regular'],random).map((r,i)=>variedCues(makeBlock(r,i+1,random),random).map(t=>({...t,fixation_ms:bases[i]+Math.floor(random()*101)})));}
export function makeTrials(phase='main',random=Math.random){
  if(phase==='main')return makeStages(random).flat();
  const out=[];for(const delay of [600,1200])for(const expected of [true,false])for(let i=0;i<(expected?3:1);i++){const c=delay===600?'A':'B';out.push({phase:'practice',stage_number:0,regularity:'practice',expected_probability:.75,cue:expected?c:(c==='A'?'B':'A'),condition:expected?'expected':'unexpected',planned_delay_ms:delay});}return variedCues(shuffle(out,random),random).map(r=>({...r,fixation_ms:450}));
}
export function median(a){const s=[...a].sort((x,y)=>x-y),n=s.length;return n?(n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2):null;}
export function quality(row){
  if(row.interrupted)return 'interrupted';if(row.anticipations)return 'anticipation';if(row.rt_ms===null)return 'miss';
  if(row.rt_ms<100)return 'too_fast';if(row.rt_ms>PLAN.responseWindow)return 'too_slow';if(row.max_frame_gap_ms>50)return 'frame_gap';return 'valid';
}
export function summary(rows){
  const main=rows.filter(r=>r.phase==='main'&&quality(r)==='valid'),counts={},medians={},diff=[];
  for(const delay of [600,1200]){
    for(const condition of ['expected','unexpected']){const key=condition+'_'+delay;const values=main.filter(r=>r.planned_delay_ms===delay&&r.condition===condition).map(r=>r.rt_ms);counts[key]=values.length;medians[key]=median(values);}
    diff.push(medians['unexpected_'+delay]===null||medians['expected_'+delay]===null?null:medians['unexpected_'+delay]-medians['expected_'+delay]);
  }
  const input_counts={};for(const row of main)if(row.input_type)input_counts[row.input_type]=(input_counts[row.input_type]||0)+1;
  const mixed_input=Object.keys(input_counts).length>1;
  const sufficient=!mixed_input&&Object.entries(counts).every(([key,n])=>n>=(key.startsWith('unexpected')?3:8));
  return {valid_main:main.length,total_main:rows.filter(r=>r.phase==='main').length,counts,medians,input_counts,mixed_input,sufficient,surprise_cost_ms:sufficient&&!diff.includes(null)?(diff[0]+diff[1])/2:null};
}
export function durationSummary(stages){
  const reports=stages.map(s=>{const actual=Number.isFinite(s.actual_duration_s)?s.actual_duration_s:null;return {stage_number:s.stage_number,actual_duration_s:actual,predicted_duration_s:s.felt_duration_s,time_difference_s:actual===null?null:s.felt_duration_s-actual,interrupted:!!s.interrupted,timing_issue:!!s.timing_issue};});
  const available=reports.length>0&&reports.every(s=>s.actual_duration_s!==null);
  const actual=available?reports.reduce((n,s)=>n+s.actual_duration_s,0):null;
  const predicted=reports.reduce((n,s)=>n+s.predicted_duration_s,0);
  return {stages:reports,actual_duration_s:actual,predicted_duration_s:predicted,time_difference_s:actual===null?null:predicted-actual};
}
