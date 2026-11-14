/** Group 57 single-session study. Paste into a NEW standalone Google Apps Script project. */
const G57_VERSION='g57-signal-2.4';
const G57_LEGACY_VERSION='g57-signal-2.2';
const G57_HEADERS={
 Sessions:['received_at','participant_id','session_id','status','trial_start_row','trial_count','stage_start_row','stage_count','receipt','summary_json','consent_json','device_json','actual_duration_s','predicted_duration_s','time_difference_s','study_version'],
 Trials:['participant_id','session_id','phase','trial_number','stage_number','regularity','expected_probability','cue','condition','planned_delay_ms','actual_delay_ms','rt_ms','anticipations','max_frame_gap_ms','interrupted','quality','recorded_at','input_type','response_mode','viewport_width','viewport_height','planned_fixation_ms'],
 Stages:['participant_id','session_id','stage_number','regularity','expected_probability','actual_duration_s','felt_duration_s','felt_actual_ratio','predictability','interrupted','timing_issue','estimated_at','predicted_duration_s','time_difference_s']
};
function property_(key){const v=PropertiesService.getScriptProperties().getProperty(key);if(!v)throw new Error('Missing script property: '+key);return v;}
function formItem_(form,title,kind){const found=form.getItems().find(i=>i.getTitle()===title);if(found)return found['as'+kind+'Item']();return form['add'+kind+'Item']().setTitle(title);}
function choice_(form,title,choices,required=true){return formItem_(form,title,'MultipleChoice').setChoiceValues(choices).setRequired(required);}
function scale_(form,title,low,high){return formItem_(form,title,'Scale').setBounds(1,7).setLabels(low,high).setRequired(true);}
function linkResponses_(form,book){let destination=null;try{destination=form.getDestinationId();}catch(error){if(!String(error.message).includes('no response destination'))throw error;}if(destination!==book.getId())form.setDestination(FormApp.DestinationType.SPREADSHEET,book.getId());}
function setupStudy(){
 const props=PropertiesService.getScriptProperties();
 ['WEBSITE_URL','RESEARCHER_CONTACT','STUDY_SHARED_SECRET'].forEach(property_);
 if(property_('STUDY_SHARED_SECRET').length<32)throw new Error('Use a random shared secret of at least 32 characters.');
 let id=props.getProperty('SPREADSHEET_ID');if(!id){const created=SpreadsheetApp.create('Group 57 Single Session Study Results');id=created.getId();props.setProperty('SPREADSHEET_ID',id);}
 const book=SpreadsheetApp.openById(id);
 Object.keys(G57_HEADERS).forEach(name=>{let sheet=book.getSheetByName(name);if(!sheet)sheet=book.insertSheet(name);sheet.getRange(1,1,1,G57_HEADERS[name].length).setValues([G57_HEADERS[name]]);sheet.setFrozenRows(1);});
 let formId=props.getProperty('SURVEY_FORM_ID');if(!formId){const created=FormApp.create('Group 57 Time Perception Study Follow Up',false);formId=created.getId();props.setProperty('SURVEY_FORM_ID',formId);}
 const form=FormApp.openById(formId);
 form.setDescription('Complete this once after Catch the Signal. This takes about 1 minute. Your code links these answers to the task. Do not enter your name, email or other identifying details. Participation is voluntary. You may leave before submitting this Form. Submitted responses cannot be withdrawn. Research team: '+property_('RESEARCHER_CONTACT')+'.');
 form.setCollectEmail(false).setAllowResponseEdits(false).setLimitOneResponsePerUser(false).setPublishingSummary(false).setShowLinkToRespondAgain(false).setShuffleQuestions(false);
 const code=formItem_(form,'Participant code','Text').setHelpText('Already filled in by the game. Please keep it unchanged.').setRequired(true);
 code.setValidation(FormApp.createTextValidation().requireTextMatchesPattern('^G57-[A-F0-9]{8}$').setHelpText('Use the study code shown by the game.').build());
 props.setProperty('CODE_ITEM_ID',String(code.getId()));
 scale_(form,'S1 How much attention did you pay to time passing during the game','None','All my attention');
 scale_(form,'S2 What was your overall mood during the game','Very unpleasant','Very pleasant');
 choice_(form,'S3 Did you look at a clock or deliberately count to judge duration',['Neither','Looked at a clock','Deliberately counted','Both','Not sure']);
 choice_(form,'S4 Were you interrupted or distracted during the game',['No','Yes','Not sure']);
 choice_(form,'S5 What did you use to respond',['Touchscreen on phone or tablet','Physical keyboard','Mouse or trackpad','Stylus or pen','Mixed response methods','Other or not sure']);
 formItem_(form,'S6 What do you think the study was investigating','ParagraphText').setRequired(false).setHelpText('Optional.');
 formItem_(form,'S7 Anything else we should know about this attempt','ParagraphText').setRequired(false).setHelpText('Optional. Mention timing problems or interruptions. No identifying details.');
 form.setConfirmationMessage('Thank you. Your participation is complete. The study examines whether predictability relates to felt duration. This is a behavioural pilot and cannot establish a neural mechanism. There are no follow-up visits.');
 linkResponses_(form,book);
 const prefilled=form.createResponse().withItemResponse(code.createResponse('G57-00000000')).toPrefilledUrl();props.setProperty('SURVEY_PREFILL_URL',prefilled);
 if(!props.getProperty('STUDY_OPEN'))props.setProperty('STUDY_OPEN','false');
 const info=book.getSheetByName('Setup')||book.insertSheet('Setup');
 info.getRange(1,1,6,2).setValues([['Resource','Link or instruction'],['Task website',property_('WEBSITE_URL')],['Form editor',form.getEditUrl()],['Form respondent URL',form.getPublishedUrl()],['Results',book.getUrl()],['Next step','Review and publish the Form; deploy this script as a web app; then set STUDY_OPEN to true.']]);info.autoResizeColumns(1,2);
 console.log('Setup ready. Open the Results spreadsheet Setup tab: '+book.getUrl());
}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
function doPost(e){
 try{
  const raw=String(e?.postData?.contents||'');if(raw.length>120000)throw new Error('invalid_payload');
  const envelope=JSON.parse(raw);if(typeof envelope.payload!=='string'||typeof envelope.signature!=='string')throw new Error('invalid_payload');
  const bytes=Utilities.computeHmacSha256Signature(envelope.payload,property_('STUDY_SHARED_SECRET'),Utilities.Charset.UTF_8);
  const expected=bytes.map(n=>('0'+((n+256)%256).toString(16)).slice(-2)).join('');
  if(expected.length!==envelope.signature.length)throw new Error('invalid_signature');let mismatch=0;for(let i=0;i<expected.length;i++)mismatch|=expected.charCodeAt(i)^envelope.signature.charCodeAt(i);if(mismatch)throw new Error('invalid_signature');
  const request=JSON.parse(envelope.payload);if(!Number.isFinite(request.at)||Math.abs(Date.now()-request.at)>300000)throw new Error('expired_request');
  if(property_('STUDY_OPEN')!=='true')throw new Error('study_closed');
  if(request.action==='config')return json_({ok:true,survey_form:property_('SURVEY_PREFILL_URL'),researcher_contact:property_('RESEARCHER_CONTACT'),supervisor_contact:PropertiesService.getScriptProperties().getProperty('SUPERVISOR_CONTACT')||'',retention:PropertiesService.getScriptProperties().getProperty('RETENTION')||'',withdrawal_policy:'No withdrawal after submission',study_dates:PropertiesService.getScriptProperties().getProperty('STUDY_DATES')||''});
  if(request.action==='task')return json_(saveTask_(request.data));
  throw new Error('invalid_payload');
 }catch(error){const allowed=['invalid_payload','consent_required','already_completed','study_closed'];return json_({ok:false,error:allowed.includes(String(error.message))?String(error.message):'request_failed'});}
}
function validNumber_(v,min,max){return typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;}
function validDate_(v){return typeof v==='string'&&Number.isFinite(Date.parse(v));}
function validateTask_(d){
 if(!d||![G57_VERSION,'g57-signal-2.3',G57_LEGACY_VERSION].includes(d.version)||!/^G57-[A-F0-9]{8}$/.test(d.participant_id)||!/^[-a-f0-9]{36}$/.test(d.session_id)||!validDate_(d.completed_at))throw new Error('invalid_payload');
 if(!d.consent?.accepted||!d.consent?.adult_student||d.consent.version!==d.version||!validDate_(d.consent.at))throw new Error('consent_required');
 const stageCount=d.version===G57_LEGACY_VERSION?4:3,mainCount=stageCount*10;
 if(!Array.isArray(d.trials)||d.trials.length!==mainCount+8||!Array.isArray(d.stages)||d.stages.length!==stageCount)throw new Error('invalid_payload');
 const practice=d.trials.filter(r=>r.phase==='practice'),main=d.trials.filter(r=>r.phase==='main');if(practice.length!==8||main.length!==mainCount)throw new Error('invalid_payload');
 for(const list of [practice,main]){const expected=list===practice?8:mainCount;if(new Set(list.map(r=>r.trial_number)).size!==expected||list.some(r=>!Number.isInteger(r.trial_number)||r.trial_number<1||r.trial_number>expected))throw new Error('invalid_payload');}
 for(const r of d.trials){
  if(!(d.version===G57_VERSION?['A','B','C','D']:['A','B']).includes(r.cue)||![600,1200].includes(r.planned_delay_ms)||!['expected','unexpected'].includes(r.condition)||typeof r.interrupted!=='boolean'||!Number.isInteger(r.anticipations)||r.anticipations<0||r.anticipations>100||!validNumber_(r.max_frame_gap_ms,0,300000)||!validDate_(r.recorded_at))throw new Error('invalid_payload');
  if(!['pointer','keyboard'].includes(r.response_mode)||!validNumber_(r.viewport_width,1,20000)||!validNumber_(r.viewport_height,1,20000)||!(r.input_type===null||['touch','mouse','pen','keyboard'].includes(r.input_type)))throw new Error('invalid_payload');
  if(r.rt_ms!==null&&(r.input_type===null||(r.response_mode==='keyboard')!==(r.input_type==='keyboard')))throw new Error('invalid_payload');
  const shouldMatch=(['A','C'].includes(r.cue)?600:1200)===r.planned_delay_ms;if((r.condition==='expected')!==shouldMatch)throw new Error('invalid_payload');
  if(d.version===G57_VERSION&&!validNumber_(r.fixation_ms,350,1050))throw new Error('invalid_payload');
  if(r.rt_ms!==null&&!validNumber_(r.rt_ms,0,5000))throw new Error('invalid_payload');if(r.actual_delay_ms!==null&&!validNumber_(r.actual_delay_ms,0,300000))throw new Error('invalid_payload');
 }
 const names=[];for(let stage=1;stage<=stageCount;stage++){
  const list=main.filter(r=>r.stage_number===stage),rating=d.stages.filter(r=>r.stage_number===stage);if(list.length!==10||rating.length!==1)throw new Error('invalid_payload');const s=rating[0];
  if(!['more_regular','less_regular'].includes(s.regularity)||typeof s.interrupted!=='boolean'||typeof s.timing_issue!=='boolean'||!validNumber_(s.felt_duration_s,1,180)||!Number.isInteger(s.predictability)||s.predictability<1||s.predictability>7||!validDate_(s.estimated_at))throw new Error('invalid_payload');
  if(s.actual_duration_s!==null&&!validNumber_(s.actual_duration_s,0,3600))throw new Error('invalid_payload');const prob=s.regularity==='more_regular'?.8:.6;if(s.expected_probability!==prob||list.some(r=>r.regularity!==s.regularity||r.expected_probability!==prob))throw new Error('invalid_payload');
  for(const delay of [600,1200]){const at=list.filter(r=>r.planned_delay_ms===delay);if(at.length!==5||at.filter(r=>r.condition==='expected').length!==(prob===.8?4:3))throw new Error('invalid_payload');}
  if(list.some(r=>Math.ceil(r.trial_number/10)!==stage))throw new Error('invalid_payload');names.push(s.regularity);
 }
 const moreCount=names.filter(x=>x==='more_regular').length;if(stageCount===4?moreCount!==2:![1,2].includes(moreCount))throw new Error('invalid_payload');
 const p=practice;for(const delay of [600,1200]){const at=p.filter(r=>r.planned_delay_ms===delay);if(at.length!==4||at.filter(r=>r.condition==='expected').length!==3)throw new Error('invalid_payload');}
}
function quality_(r){if(r.interrupted)return 'interrupted';if(r.anticipations)return 'anticipation';if(r.rt_ms===null)return 'miss';if(r.rt_ms<100)return 'too_fast';if(r.rt_ms>1000)return 'too_slow';if(r.max_frame_gap_ms>50)return 'frame_gap';return 'valid';}
function median_(values){if(!values.length)return null;const a=values.slice().sort((x,y)=>x-y),n=a.length;return n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2;}
function summary_(rows){
 const total=rows.filter(r=>r.phase==='main').length;const main=rows.filter(r=>r.phase==='main'&&quality_(r)==='valid'),counts={},medians={},differences=[];
 [600,1200].forEach(delay=>{['expected','unexpected'].forEach(condition=>{const values=main.filter(r=>r.planned_delay_ms===delay&&r.condition===condition).map(r=>r.rt_ms),key=condition+'_'+delay;counts[key]=values.length;medians[key]=median_(values);});differences.push(medians['unexpected_'+delay]===null||medians['expected_'+delay]===null?null:medians['unexpected_'+delay]-medians['expected_'+delay]);});
 const input_counts={};main.forEach(r=>{if(r.input_type)input_counts[r.input_type]=(input_counts[r.input_type]||0)+1;});const mixed_input=Object.keys(input_counts).length>1;const enough=!mixed_input&&Object.keys(counts).every(key=>counts[key]>=(key.indexOf('unexpected')===0?(total===40?5:3):(total===40?11:8)));return {valid_main:main.length,total_main:total,counts,medians,input_counts,mixed_input,sufficient:enough,surprise_cost_ms:enough&&!differences.includes(null)?(differences[0]+differences[1])/2:null};
}
function saveTask_(data){
 validateTask_(data);const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const book=SpreadsheetApp.openById(property_('SPREADSHEET_ID')),sessions=book.getSheetByName('Sessions'),trialSheet=book.getSheetByName('Trials'),stageSheet=book.getSheetByName('Stages');
  const existing=sessions.getLastRow()>1?sessions.getRange(2,1,sessions.getLastRow()-1,12).getValues():[];
  const found=existing.findIndex(r=>r[2]===data.session_id);if(found>=0&&existing[found][1]!==data.participant_id)throw new Error('invalid_payload');
  if(found>=0&&existing[found][3]==='complete'){const savedStages=stageSheet.getRange(Number(existing[found][6]),1,Number(existing[found][7]),14).getValues().map(r=>({stage_number:r[2],actual_duration_s:typeof r[5]==='number'?r[5]:null,felt_duration_s:r[6],interrupted:r[9],timing_issue:r[10]}));return {ok:true,receipt:existing[found][8],duplicate:true,comparison:durationSummary_(savedStages)};}
  if(existing.some(r=>r[1]===data.participant_id&&r[2]!==data.session_id))throw new Error('already_completed');
  const summary=summary_(data.trials),comparison=durationSummary_(data.stages);let sessionRow,trialStart,stageStart,receipt;
  if(found>=0){sessionRow=found+2;trialStart=Number(existing[found][4]);stageStart=Number(existing[found][6]);receipt=existing[found][8];}
  else{sessionRow=sessions.getLastRow()+1;trialStart=Math.max(trialSheet.getLastRow()+1,...existing.map(r=>Number(r[4])+Number(r[5])));stageStart=Math.max(stageSheet.getLastRow()+1,...existing.map(r=>Number(r[6])+Number(r[7])));receipt=Utilities.getUuid();sessions.getRange(sessionRow,1,1,16).setValues([[new Date().toISOString(),data.participant_id,data.session_id,'writing',trialStart,data.trials.length,stageStart,data.stages.length,receipt,JSON.stringify(summary),JSON.stringify(data.consent),JSON.stringify(data.device||{}),comparison.actual_duration_s??'',comparison.predicted_duration_s,comparison.time_difference_s??'',data.version]]);SpreadsheetApp.flush();}
  const trials=data.trials.map(r=>[data.participant_id,data.session_id,r.phase,r.trial_number,r.stage_number,r.regularity,r.expected_probability,r.cue,r.condition,r.planned_delay_ms,r.actual_delay_ms,r.rt_ms,r.anticipations,r.max_frame_gap_ms,r.interrupted,quality_(r),r.recorded_at,r.input_type,r.response_mode,r.viewport_width,r.viewport_height,r.fixation_ms??'']);
  const stages=data.stages.map(s=>[data.participant_id,data.session_id,s.stage_number,s.regularity,s.expected_probability,s.actual_duration_s,s.felt_duration_s,s.actual_duration_s>0?s.felt_duration_s/s.actual_duration_s:'',s.predictability,s.interrupted||data.trials.some(r=>r.phase==='main'&&r.stage_number===s.stage_number&&r.interrupted),s.timing_issue||data.trials.some(r=>r.phase==='main'&&r.stage_number===s.stage_number&&r.max_frame_gap_ms>50),s.estimated_at,s.felt_duration_s,s.actual_duration_s===null?'':s.felt_duration_s-s.actual_duration_s]);
  if(trialSheet.getMaxRows()<trialStart+data.trials.length-1)trialSheet.insertRowsAfter(trialSheet.getMaxRows(),trialStart+data.trials.length-1-trialSheet.getMaxRows());if(stageSheet.getMaxRows()<stageStart+data.stages.length-1)stageSheet.insertRowsAfter(stageSheet.getMaxRows(),stageStart+data.stages.length-1-stageSheet.getMaxRows());trialSheet.getRange(trialStart,1,data.trials.length,22).setValues(trials);stageSheet.getRange(stageStart,1,data.stages.length,14).setValues(stages);SpreadsheetApp.flush();sessions.getRange(sessionRow,13,1,4).setValues([[comparison.actual_duration_s??'',comparison.predicted_duration_s,comparison.time_difference_s??'',data.version]]);sessions.getRange(sessionRow,4).setValue('complete');SpreadsheetApp.flush();return {ok:true,receipt,comparison};
 }finally{lock.releaseLock();}
}

function durationSummary_(stages){
 const reports=stages.map(s=>{const actual=Number.isFinite(s.actual_duration_s)?s.actual_duration_s:null;return {stage_number:s.stage_number,actual_duration_s:actual,predicted_duration_s:s.felt_duration_s,time_difference_s:actual===null?null:s.felt_duration_s-actual,interrupted:!!s.interrupted,timing_issue:!!s.timing_issue};});
 const available=reports.length>0&&reports.every(s=>s.actual_duration_s!==null);
 const actual=available?reports.reduce((n,s)=>n+s.actual_duration_s,0):null,predicted=reports.reduce((n,s)=>n+s.predicted_duration_s,0);
 return {stages:reports,actual_duration_s:actual,predicted_duration_s:predicted,time_difference_s:actual===null?null:predicted-actual};
}
function upgradeStudy(){
 const lock=LockService.getScriptLock();lock.waitLock(20000);try{
 const book=SpreadsheetApp.openById(property_('SPREADSHEET_ID'));
 Object.keys(G57_HEADERS).forEach(name=>{const sheet=book.getSheetByName(name);sheet.getRange(1,1,1,G57_HEADERS[name].length).setValues([G57_HEADERS[name]]);});
 const stages=book.getSheetByName('Stages'),sessions=book.getSheetByName('Sessions');
 const stageRows=stages.getLastRow()>1?stages.getRange(2,1,stages.getLastRow()-1,12).getValues():[];
 if(stageRows.length)stages.getRange(2,13,stageRows.length,2).setValues(stageRows.map(r=>[r[6],typeof r[5]==='number'&&typeof r[6]==='number'?r[6]-r[5]:'']));
 const sessionRows=sessions.getLastRow()>1?sessions.getRange(2,1,sessions.getLastRow()-1,12).getValues():[];
 if(sessionRows.length)sessions.getRange(2,13,sessionRows.length,4).setValues(sessionRows.map(r=>{
  const matched=stageRows.filter(s=>s[0]===r[1]&&s[1]===r[2]);let version='';try{version=JSON.parse(r[10]).version||'';}catch{};
  if(r[3]!=='complete'||matched.length!==Number(r[7]))return ['','','',version];
  const report=durationSummary_(matched.map(s=>({stage_number:s[2],actual_duration_s:typeof s[5]==='number'?s[5]:null,felt_duration_s:s[6]})));
  return [report.actual_duration_s??'',report.predicted_duration_s,report.time_difference_s??'',version];
 }));
 console.log('Results columns updated. Existing responses preserved.');
 }finally{lock.releaseLock();}
}
