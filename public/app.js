import {VERSION,PLAN,makeTrials,quality,durationSummary} from './core.js';
import {createResponseController} from './input.js';
const $=s=>document.querySelector(s),DEMO=document.documentElement.dataset.mode==='demo',KEY=DEMO?'g57-signal-single-v24-demo':'g57-signal-single-v24';
let config=null,storageOK=true,state={participant_id:'G57-'+crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase(),pending:null,saved:false};
try{const prior=localStorage.getItem(KEY);if(prior)state=JSON.parse(prior);localStorage.setItem(KEY,JSON.stringify(state));}catch{storageOK=false;}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));return true;}catch{storageOK=false;return false;}}
function view(id){for(const el of document.querySelectorAll('main>section'))el.hidden=el.id!==id;document.body.classList.toggle('is-playing',id==='play');window.scrollTo({top:0,behavior:'instant'});}
function showComparison(){
 const report=state.comparison;if(!report)return;
 const seconds=value=>value===null?'Unavailable':`${value.toFixed(1)} s`;
 const difference=value=>value===null?'Unavailable':`${value>0?'+':''}${value.toFixed(1)} s`;
 const body=$('#comparisonRows');body.replaceChildren();
 for(const stage of report.stages){const row=document.createElement('tr');for(const text of [`Stage ${stage.stage_number}${stage.interrupted?' *':''}`,seconds(stage.actual_duration_s),seconds(stage.predicted_duration_s),difference(stage.time_difference_s)]){const cell=document.createElement('td');cell.textContent=text;row.append(cell);}body.append(row);}
 $('#totalActual').textContent=seconds(report.actual_duration_s);$('#totalPredicted').textContent=seconds(report.predicted_duration_s);$('#totalDifference').textContent=difference(report.time_difference_s);
 const delta=report.time_difference_s;
 $('#comparisonInterpretation').textContent=delta===null?'Some timing measurements were unavailable.':Math.abs(delta)<.05?'Your total estimate matched the measured time to the nearest tenth of a second.':`Your total estimate was ${Math.abs(delta).toFixed(1)} seconds ${delta>0?'longer':'shorter'} than the measured time.`;
 $('#comparisonWarning').hidden=!report.stages.some(s=>s.interrupted||s.timing_issue);
 $('#timeComparison').hidden=false;
}
function showSurveyStep(){
 if(!config)return;
 $('#finishTitle').textContent='Complete the Google Form';
 $('#saveStatus').textContent='Your activity responses are saved.';
 $('#surveyLink').href=config.survey_form.replaceAll('G57-00000000',state.participant_id);
 $('#afterlinks').hidden=false;
 $('#finishCode').textContent='Your study code · '+state.participant_id;
 showComparison();
 $('#finishTitle').focus();
}
$('#participantCode').textContent='Your study code · '+state.participant_id;$('#demoBanner').hidden=!DEMO;
async function init(){
 if(DEMO){
  $('#connectionStatus').textContent='Demo mode. You can try the activity without sending responses.';
  $('#begin').disabled=false;
  $('#begin').textContent='Try the demo';
  $('#adult').closest('label').hidden=true;
  $('#consent').closest('label').hidden=true;
  $('#welcome details').hidden=true;
  $('#participantCode').hidden=true;
  $('#welcome .participation-notice').innerHTML='<strong>Portfolio demo</strong><p>Try eight practice signals and three short stages, then see how your estimates compare with the measured time.</p>';
  $('#welcome h3').textContent='Try the study activity';
  $('#welcome h3 + p').textContent='Use a touchscreen, mouse or keyboard. The demo runs entirely in your browser.';
  $('#connectionStatus + p').hidden=true;
  $('#demoEnd').textContent='In the research version, this screen also links to the follow-up Google Form.';
  return;
 }
 if(!storageOK){$('#connectionStatus').textContent='Please enable browser storage so the task can recover a failed save.';return;}
 try{const r=await fetch('/api/config',{cache:'no-store'});const c=await r.json();if(!r.ok||!c.ok)throw Error(c.error||'Study unavailable');config=c;
  $('#studyDetails').textContent=[`Research team: ${c.researcher_contact}.`,c.supervisor_contact?`Supervisor: ${c.supervisor_contact}.`:'',c.retention?`Data retention: ${c.retention}.`:'',c.study_dates?`Study dates: ${c.study_dates}.`:'','Submitted responses cannot be withdrawn.'].filter(Boolean).join(' ');
  $('#connectionStatus').textContent='Study ready. Please read the information and consent to begin.';$('#begin').disabled=false;
  if(state.pending){view('finish');if(state.saved)showSurveyStep();else saveTask();}
 }catch(error){$('#connectionStatus').textContent=error.message==='Failed to fetch'?'The study is not available right now. Please ask the researcher.':error.message;$('#connectionStatus').classList.add('error');}
}
$('#begin').onclick=()=>{if(DEMO){view('instructions');return;}if(!$('#adult').checked||!$('#consent').checked){$('#connectionStatus').textContent='Please confirm both statements before starting.';return;}state.consent={accepted:true,adult_student:true,at:new Date().toISOString(),version:VERSION};persist();view('instructions');};
$('#backWelcome').onclick=()=>view('welcome');
let responseMode=(matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0)?'pointer':'keyboard';
let active=false,phase='practice',queue=[],index=0,rows=[],stages=[],session='',mode='idle',raf=0,feedbackTimer=0,trial=null,cueOnset=0,onset=null,lastFrame=0,gap=0,anticipations=0,firstRT=null,firstInput=null,blockStart=null,blockInterrupted=false,blockTimingIssue=false,pendingStage=null,continueAction=null;
function showCheckpoint(label,title,text,button,fn){mode='checkpoint';view('checkpoint');$('#checkpointLabel').textContent=label;$('#checkpointTitle').textContent=title;$('#checkpointText').textContent=text;$('#checkpointNumber').textContent=label==='Paused'?'Ⅱ':'✓';$('#continueTask').textContent=button;continueAction=fn;}
$('#continueTask').onclick=()=>{if(input.held)return;view('play');continueAction?.();};
function beginPhase(p){phase=p;queue=makeTrials(p);index=0;blockStart=null;blockInterrupted=false;blockTimingIssue=false;nextTrial();}
$('#practiceStart').onclick=()=>{active=true;input.setMode(responseMode);rows=[];stages=[];session=crypto.randomUUID();view('play');beginPhase('practice');};
function nextTrial(){
 if(!active)return;if(index===queue.length){if(phase==='practice')showCheckpoint('Warm-up complete','Ready for Stage 1?','The warm-up is complete. Keep this tab visible and respond once while each circle is visible.','Start Stage 1',()=>beginPhase('main'));else complete();return;}
 mode='iti';trial=queue[index];onset=null;firstRT=null;firstInput=null;lastFrame=0;gap=0;anticipations=0;$('#stimulus').className='stimulus';$('#stimulus').textContent='+';$('#feedback').textContent='';$('#phaseLabel').textContent=phase==='practice'?'Warm-up':`Stage ${trial.stage_number} of ${PLAN.stages}`;$('#stageTitle').textContent=phase==='practice'?'Find your rhythm.':'Catch the signal.';$('#progressText').textContent=phase==='practice'?`${index+1} / 8`:`${index%10+1} / 10`;
 for(const [i,el]of [...document.querySelectorAll('.stage-track span')].entries())el.classList.toggle('done',phase==='main'&&i<trial.stage_number-1);
 const started=performance.now();function iti(t){if(!active||mode!=='iti')return;if(t-started>=(trial.fixation_ms??450)&&!input.held){mode='cue';$('#stimulus').textContent=trial.cue;cueOnset=t;lastFrame=t;if(phase==='main'&&blockStart===null)blockStart=t;raf=requestAnimationFrame(tick);}else raf=requestAnimationFrame(iti);}raf=requestAnimationFrame(iti);
}
function tick(t){
 if(!active||!['cue','target'].includes(mode))return;gap=Math.max(gap,t-lastFrame);lastFrame=t;
 if(mode==='cue'&&t-cueOnset>=trial.planned_delay_ms){onset=t;mode='target';$('#stimulus').textContent='';$('#stimulus').className='stimulus target';}
 if(mode==='target'&&t-onset>=PLAN.responseWindow){record(firstRT,false,t);return;}raf=requestAnimationFrame(tick);
}
function record(rt,interrupted,endTime=performance.now()){
 cancelAnimationFrame(raf);const row={...trial,trial_number:index+1,rt_ms:rt===null?null:Math.round(rt),actual_delay_ms:onset===null?null:Math.round(onset-cueOnset),anticipations,max_frame_gap_ms:Math.round(gap),interrupted,input_type:firstInput,response_mode:responseMode,viewport_width:innerWidth,viewport_height:innerHeight,recorded_at:new Date().toISOString()};row.quality=quality(row);rows.push(row);index++;mode='feedback';$('#stimulus').className='stimulus';$('#stimulus').textContent='+';
 if(phase==='main'){blockInterrupted ||= interrupted;blockTimingIssue ||= row.max_frame_gap_ms>50;if(index%PLAN.block===0){pendingStage={stage_number:row.stage_number,regularity:row.regularity,expected_probability:row.expected_probability,actual_duration_s:blockStart===null?null:(endTime-blockStart)/1000,interrupted:blockInterrupted,timing_issue:blockTimingIssue};showRating();return;}}
 if(interrupted){showCheckpoint('Paused','Let’s pause here.','The interrupted signal was flagged. The stage will also be marked as interrupted. Continue with this tab visible.','Resume',nextTrial);return;}
 if(phase==='practice'){$('#feedback').textContent=rt!==null?'Response recorded.':anticipations?'Wait until the circle appears.':responseMode==='pointer'?'Tap the pad once while the circle is visible.':'Press Space once while the circle is visible.';feedbackTimer=setTimeout(nextTrial,550);}else nextTrial();
}
function showRating(){mode='rating';view('rating');$('#ratingStage').textContent=`Stage ${pendingStage.stage_number} of ${PLAN.stages} complete`;$('#ratingForm').reset();$('#submissionNotice').hidden=pendingStage.stage_number!==PLAN.stages;$('#saveRating').textContent=pendingStage.stage_number===PLAN.stages?'Save activity and continue to Form':`Save and start Stage ${pendingStage.stage_number+1}`;$('#ratingTitle').focus();}
$('#ratingForm').onsubmit=e=>{e.preventDefault();if(!pendingStage)return;const estimate=Number($('#feltSeconds').value);stages.push({...pendingStage,felt_duration_s:estimate,predictability:Number($('#regularityRating').value),felt_actual_ratio:pendingStage.actual_duration_s>0?estimate/pendingStage.actual_duration_s:null,estimated_at:new Date().toISOString()});$('#feltSeconds').blur();$('#regularityRating').blur();pendingStage=null;blockStart=null;blockInterrupted=false;blockTimingIssue=false;view('play');nextTrial();};
function pause(){if(!active)return;cancelAnimationFrame(raf);clearTimeout(feedbackTimer);input.reset();if(['iti','cue','target'].includes(mode))record(firstRT,true);else if(mode==='feedback')showCheckpoint('Paused','Take your time.','Continue with this tab visible when you’re ready.','Resume',nextTrial);}
addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function leave(){active=false;cancelAnimationFrame(raf);clearTimeout(feedbackTimer);mode='idle';rows=[];stages=[];view('stopped');}
$('#leave').onclick=leave;$('#leaveCheckpoint').onclick=leave;$('#restart').onclick=()=>view('welcome');
const responding=()=>active&&['iti','cue','target'].includes(mode);
const input=createResponseController({now:()=>performance.now(),onPress:(kind,at)=>{if(mode==='cue')anticipations++;else if(mode==='target'&&firstRT===null){firstRT=at-onset;firstInput=kind;}},onCancel:()=>{if(responding())pause();}});
function setResponseMode(value){
 responseMode=value;
 input.setMode(value);
 const pointer=value==='pointer';
 for(const button of document.querySelectorAll('[data-input-mode]')){
  const selected=button.dataset.inputMode===value;
  button.setAttribute('aria-pressed',String(selected));
  const label=button.dataset.inputMode==='pointer'?'Touch or click':'Keyboard';
  button.textContent=selected?label+' ✓ Selected':label;
 }
 $('#responsePad').hidden=!pointer;
 $('#arenaHint').textContent=pointer?'TAP ONCE WHILE THE CIRCLE IS VISIBLE':'PRESS SPACE ONCE WHILE THE CIRCLE IS VISIBLE';
 $('#responseInstructions').textContent=pointer?'Tap the response pad once while the circle is visible, then lift your finger.':'Press Space once while the circle is visible, then release it.';
 $('#selectedInput').textContent=pointer?'✓ Touch or click ready':'✓ Keyboard ready';
}
for(const button of document.querySelectorAll('[data-input-mode]')){
 button.onclick=()=>{
  setResponseMode(button.dataset.inputMode);
  $('#changeControls').open=false;
  $('#changeControls summary').focus();
 };
}
setResponseMode(responseMode);
addEventListener('keydown',e=>{if(responding()&&input.keyDown(e))e.preventDefault();});
addEventListener('keyup',e=>input.keyUp(e));
const pad=$('#responsePad');
pad.addEventListener('pointerdown',e=>{if(!responding())return;if(input.pointerDown(e)){e.preventDefault();pad.setPointerCapture(e.pointerId);}});
addEventListener('pointerup',e=>input.pointerUp(e));
addEventListener('pointercancel',e=>input.pointerCancel(e));
pad.addEventListener('lostpointercapture',e=>input.pointerCancel(e));
// Rotation changes the viewing conditions. Treat it like another task interruption.
if(screen.orientation?.addEventListener)screen.orientation.addEventListener('change',pause);else addEventListener('orientationchange',pause);

function complete(){
 active=false;cancelAnimationFrame(raf);mode='idle';state.comparison=durationSummary(stages);persist();view('finish');if(DEMO){showComparison();$('#timeComparison').open=true;$('#finishLabel').textContent='Activity preview';$('#finishTitle').textContent='Game complete.';$('#saveStatus').textContent='Compare your estimates with the measured durations below.';$('#demoEnd').hidden=false;return;}
 state.pending={version:VERSION,participant_id:state.participant_id,session_id:session,consent:state.consent,trials:rows,stages,completed_at:new Date().toISOString(),device:{user_agent:navigator.userAgent,width:innerWidth,height:innerHeight,pixel_ratio:devicePixelRatio,response_mode:responseMode,max_touch_points:navigator.maxTouchPoints||0,orientation:screen.orientation?.type||'unknown'}};state.saved=false;persist();saveTask();
}
async function saveTask(){
 $('#retry').hidden=true;$('#finishTitle').textContent='Saving your responses…';$('#saveStatus').textContent='Please keep this page open for a moment.';
 try{const r=await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state.pending),signal:AbortSignal.timeout(30000)});const result=await r.json();if(!r.ok||!result.ok)throw Error(result.error||'save_failed');state.saved=true;state.receipt=result.receipt;state.comparison=result.comparison||state.comparison;state.pending={participant_id:state.participant_id,session_id:state.pending.session_id,completed_at:state.pending.completed_at};persist();showSurveyStep();}
 catch{$('#finishTitle').textContent='Let’s try saving again.';$('#saveStatus').textContent='We could not confirm the save. Your completed task is kept on this device. Keep this page and use Retry; you do not need to play again or upload a file.';$('#retry').hidden=false;}
}
$('#retry').onclick=saveTask;init();
