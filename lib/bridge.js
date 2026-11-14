import {createHmac} from 'node:crypto';
export async function bridge(action,data={}){
  const url=process.env.GOOGLE_SCRIPT_URL,secret=process.env.STUDY_SHARED_SECRET;
  if(!url||!secret||(secret.length<32||secret.startsWith('REPLACE_')))throw new Error('not_configured');
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url))throw new Error('not_configured');
  const payload=JSON.stringify({action,data,at:Date.now()});const signature=createHmac('sha256',secret).update(payload).digest('hex');
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({payload,signature}),redirect:'follow',signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error('upstream_failed');const result=await response.json();if(!result.ok)throw new Error(result.error||'upstream_failed');return result;
}
export function headers(res){res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');}
