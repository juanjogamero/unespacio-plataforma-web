import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
const root=resolve(import.meta.dirname,'../dist');const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const securityHeaders={
 'Content-Security-Policy':"default-src 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; font-src 'self'; connect-src 'self'; worker-src 'none'; upgrade-insecure-requests",
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Cache-Control':'no-store'
};
createServer(async(req,res)=>{if(!req.url||!['GET','HEAD'].includes(req.method||'')){res.writeHead(405,securityHeaders).end();return;}let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400,securityHeaders).end();return;}const path=resolve(root,'.'+pathname);if(!(path===root||path.startsWith(root+sep))){res.writeHead(403,securityHeaders).end();return;}let file=pathname==='/'?join(root,'index.html'):path;try{const info=await stat(file);if(!info.isFile())throw new Error('not-file');const suffix=file.slice(file.lastIndexOf('.'));const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[suffix]||'application/octet-stream',...securityHeaders});res.end(req.method==='HEAD'?undefined:bytes);}catch{res.writeHead(404,securityHeaders).end('No encontrado');}}).listen(port,'127.0.0.1',()=>console.log(`Unespacio Aula: http://127.0.0.1:${port}/ (npm run dev)`));
