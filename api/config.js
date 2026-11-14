import {bridge,headers} from '../lib/bridge.js';
export default async function handler(req,res){headers(res);if(req.method!=='GET')return res.status(405).json({ok:false,error:'method_not_allowed'});try{res.status(200).json(await bridge('config'));}catch{res.status(503).json({ok:false,error:'Study setup is not complete. Please ask the researcher before participating.'});}}
