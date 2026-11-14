import test from 'node:test';import assert from 'node:assert/strict';import {createHmac} from 'node:crypto';
import submit from '../api/submit.js';import config from '../api/config.js';
function response(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;}};}
test('Vercel proxy signs server-to-Google requests without putting the secret in the payload',async()=>{
 const oldFetch=globalThis.fetch,oldURL=process.env.GOOGLE_SCRIPT_URL,oldSecret=process.env.STUDY_SHARED_SECRET;
 const secret='test-only-shared-secret-which-is-long-enough';process.env.GOOGLE_SCRIPT_URL='https://script.google.com/macros/s/test-deployment/exec';process.env.STUDY_SHARED_SECRET=secret;let called=0;
 globalThis.fetch=async(url,options)=>{called++;assert.equal(url,process.env.GOOGLE_SCRIPT_URL);const sent=JSON.parse(options.body);assert.equal(sent.signature,createHmac('sha256',secret).update(sent.payload).digest('hex'));assert.ok(!sent.payload.includes(secret));return {ok:true,json:async()=>({ok:true,receipt:'test-receipt'})};};
 try{
  const req={method:'POST',headers:{'content-type':'application/json',host:'study.vercel.app',origin:'https://study.vercel.app'},body:{participant_id:'G57-ABCDEF12'}};let res=response();await submit(req,res);assert.equal(res.statusCode,200);assert.equal(res.body.receipt,'test-receipt');assert.equal(called,1);
  res=response();await submit({...req,headers:{...req.headers,origin:'https://unrelated.example'}},res);assert.equal(res.statusCode,403);assert.equal(called,1);
  res=response();await submit({...req,method:'GET'},res);assert.equal(res.statusCode,405);
  res=response();await submit({...req,headers:{...req.headers,'content-type':'text/plain'}},res);assert.equal(res.statusCode,415);
  delete process.env.GOOGLE_SCRIPT_URL;res=response();await config({method:'GET'},res);assert.equal(res.statusCode,503);assert.equal(res.body.ok,false);
 }finally{globalThis.fetch=oldFetch;if(oldURL===undefined)delete process.env.GOOGLE_SCRIPT_URL;else process.env.GOOGLE_SCRIPT_URL=oldURL;if(oldSecret===undefined)delete process.env.STUDY_SHARED_SECRET;else process.env.STUDY_SHARED_SECRET=oldSecret;}
});
