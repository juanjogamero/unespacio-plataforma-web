/** Verifica el sitio GitHub Pages publicado (sin backend ni datos reales). */
import {spawn,execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const ROOT_URL='https://juanjogamero.github.io/unespacio-plataforma-web/';
const RELEASE='0.10.0';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const retry=async(fn,attempts=24)=>{
 let last;for(let n=0;n<attempts;n++){
  try{const val=await fn();if(val)return val}catch(e){last=e}
  await sleep(3000);
 }
 throw last||new Error('La versión publicada aún no está disponible');
};
const html=await retry(async()=>{
 const response=await fetch(ROOT_URL+'?release='+RELEASE+'&_='+Date.now(),{cache:'no-store'});
 if(!response.ok)throw new Error('GitHub Pages: HTTP '+response.status);
 const body=await response.text();
 if(!body.includes('name="unespacio-release" content="'+RELEASE+'"'))return null;
 if(!body.includes('booking.css?v='+RELEASE))throw new Error('No se referencia el CSS de citas');
 if(!body.includes('Unespacio · Agenda de citas'))throw new Error('Sigue publicado el título anterior');
 return body;
},30);
const asset=await fetch(ROOT_URL+'assets/css/booking.css?v='+RELEASE);
if(!asset.ok||(await asset.text()).indexOf('.agenda-layout')<0)throw new Error('La hoja de estilos no se ha publicado');
console.log('Nueva versión pública verificada: '+RELEASE+'; HTML '+html.length+' caracteres.');
const chrome=process.env.CHROME_BIN||'/usr/bin/google-chrome';
execFileSync(chrome,['--version'],{stdio:'pipe'});
const profile=mkdtempSync(join(tmpdir(),'unespacio-citas-preview-'));
const port=19311;
const child=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let ws;
try{
 const target=await retry(async()=>{const r=await fetch('http://127.0.0.1:'+port+'/json');if(!r.ok)return null;return (await r.json()).find(p=>p.type==='page')?.webSocketDebuggerUrl||null},10);
 ws=new WebSocket(target);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
 let requestId=1;const pending=new Map();
 ws.addEventListener('message',event=>{
  let payload;try{payload=JSON.parse(event.data)}catch{return}
  if(typeof payload.id!=='number')return;
  const p=pending.get(payload.id);if(!p)return;
  pending.delete(payload.id);
  if(payload.error)p.reject(new Error(JSON.stringify(payload.error)));else p.resolve(payload.result);
 });
 const command=(method,params={})=>new Promise((resolve,reject)=>{const id=requestId++;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
 const js=async expression=>{
  const res=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(res.exceptionDetails)throw new Error(res.exceptionDetails.text||'Error de navegador');
  return res.result?.value;
 };
 const wait=async expression=>{for(let i=0;i<70;i++){if(await js(expression))return;await sleep(300)}throw new Error('No se encuentra: '+expression)};
 const viewport=async(width,height)=>command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600,screenWidth:width,screenHeight:height});
 const picture=async name=>{
  const overflow=await js('document.documentElement.scrollWidth-window.innerWidth');
  if(overflow>3)throw new Error('Desbordamiento horizontal ('+name+'): '+overflow+'px');
  const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
  mkdirSync('qa/screenshots',{recursive:true});
  writeFileSync('qa/screenshots/'+name+'.png',Buffer.from(shot.data,'base64'));
  console.log('Captura comprobada: '+name);
 };
 await command('Page.enable');await command('Runtime.enable');
 await viewport(1440,930);
 await command('Page.navigate',{url:ROOT_URL+'?release='+RELEASE});
 await wait("Boolean(document.querySelector('.agenda-layout')&&document.querySelector('.brand'))");
 if(await js("document.body.textContent.includes('Unespacio Aula')"))throw new Error('La demo aún contiene la marca académica');
 await picture('agenda-escritorio');
 await js("document.querySelector('[data-action=\"new\"]').click();true");
 await wait("Boolean(document.querySelector('#booking-form'))");
 await js("(()=>{const f=document.querySelector('#booking-form');f.querySelector('[name=\"clientName\"]').value='Cliente QA ficticio';f.querySelector('[name=\"time\"]').value='16:00';f.requestSubmit();return true})()");
 await wait("Boolean(document.querySelector('.appointment-list')?.textContent.includes('Cliente QA ficticio'))");
 const count=await js("JSON.parse(localStorage.getItem('unespacio.citas.demo.v2')).appointments.filter(a=>a.status==='confirmada'&&a.time==='16:00'&&a.clientId).length");
 if(count<1)throw new Error('La nueva cita no se ha persistido en la demo');
 console.log('Cita manual guardada en la agenda y persistencia local comprobada.');
 await viewport(390,844);await sleep(400);
 await picture('agenda-movil');
 await js("location.hash='#/clientes';true");
 await wait("Boolean(document.querySelector('.client-grid'))");
 await picture('clientes-movil');
 await js("location.hash='#/reservar';true");
 await wait("Boolean(document.querySelector('.online-slots'))");
 await picture('reserva-online-movil');
 console.log('Verificación funcional y responsive completa.');
}finally{
 if(ws&&ws.readyState===WebSocket.OPEN)ws.close();
 child.kill('SIGTERM');await sleep(300);rmSync(profile,{recursive:true,force:true});
}
