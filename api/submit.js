import {bridge,headers} from '../lib/bridge.js';
export default async function handler(req,res){
  headers(res);if(req.method!=='POST')return res.status(405).json({ok:false,error:'method_not_allowed'});
  if(!String(req.headers['content-type']||'').startsWith('application/json'))return res.status(415).json({ok:false,error:'unsupported_type'});
  const origin=req.headers.origin,host=req.headers['x-forwarded-host']||req.headers.host;
  if(origin&&origin!==`https://${host}`&&!(host?.startsWith('localhost:')&&origin===`http://${host}`))return res.status(403).json({ok:false,error:'origin_mismatch'});
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
    if(!body||JSON.stringify(body).length>100000)return res.status(400).json({ok:false,error:'invalid_payload'});
    const result=await bridge('task',body);res.status(200).json(result);
  }catch(error){const known=['invalid_payload','consent_required','already_completed'];const name=String(error.message);res.status(known.includes(name)?400:503).json({ok:false,error:known.includes(name)?name:'Could not confirm saving. Your completed task is kept on this device. Please retry.'});}
}
