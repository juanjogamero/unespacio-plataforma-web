/** Comprueba y captura el sitio PUBLICADO. Nunca genera pantallas HTML aisladas. */
import {spawn,execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const ROOT_URL='https://juanjogamero.github.io/unespacio-plataforma-web/';
const RELEASE='0.8.1';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const retry=async (fn,attempts=24)=>{
 let last;for(let n=0;n<attempts;n++){try{const val=await fn();if(val)return val;}catch(e){last=e;}await sleep(4500);}throw last||new Error('La versión publicada no está disponible');};
const html=await retry(async()=>{
 const response=await fetch(ROOT_URL+'?release='+RELEASE+'&_='+Date.now(),{cache:'no-store'});
 if(!response.ok)throw new Error('GitHub Pages devuelve HTTP '+response.status);
 const body=await response.text();
 if(!body.includes('name="unespacio-release" content="'+RELEASE+'"'))return null;
 if(!body.includes('refined.css?v='+RELEASE))throw new Error('El HTML no referencia la hoja de estilos nueva');
 return body;
},30);
console.log('Publicación verificada: versión '+RELEASE+', '+html.length+' caracteres HTML');
const asset=await fetch(ROOT_URL+'assets/css/refined.css?v='+RELEASE);
if(!asset.ok||(await asset.text()).indexOf('.work-topic-workspace')<0)throw new Error('El recurso CSS publicado no coincide con la versión nueva');
const binary=process.env.CHROME_BIN||'/usr/bin/google-chrome';
try{execFileSync(binary,['--version'],{stdio:'pipe'});}catch{throw new Error('Chrome no está disponible en el runner');}
const profile=mkdtempSync(join(tmpdir(),'unespacio-live-chrome-'));
const port=19227;
const child=spawn(binary,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let ws;
try{
 const target=await retry(async()=>{const r=await fetch('http://127.0.0.1:'+port+'/json');if(!r.ok)return null;return (await r.json()).find(p=>p.type==='page')?.webSocketDebuggerUrl||null;},8);
 ws=new WebSocket(target);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 let id=1;const pending=new Map();
 ws.addEventListener('message',event=>{
  let payload;try{payload=JSON.parse(event.data)}catch{return;}
  if(typeof payload.id!=='number')return;
  const p=pending.get(payload.id);if(!p)return;
  pending.delete(payload.id);if(payload.error)p.reject(new Error(JSON.stringify(payload.error)));else p.resolve(payload.result);
 });
 const command=(method,params={})=>new Promise((resolve,reject)=>{const num=id++;pending.set(num,{resolve,reject});ws.send(JSON.stringify({id:num,method,params}));});
 const js=async expression=>{
  const out=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(out.exceptionDetails)throw new Error(out.exceptionDetails.text||'Error JavaScript al evaluar '+expression.slice(0,60));
  return out.result?.value;
 };
 const wait=async expression=>{for(let i=0;i<90;i++){if(await js(expression))return;await sleep(300);}throw new Error('No se encontró en el sitio publicado: '+expression);};
 const viewport=async(width,height)=>{
  await command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600,screenWidth:width,screenHeight:height});
 };
 const picture=async(name)=>{
  const overflow=await js('document.documentElement.scrollWidth-window.innerWidth');
  if(overflow>3)throw new Error('Desbordamiento horizontal en '+name+': '+overflow+'px');
  const cssLoaded=await js("Array.from(document.styleSheets).some(s=>String(s.href||'').includes('refined.css?v=0.8.1'))");
  if(!cssLoaded)throw new Error('La vista '+name+' no ha cargado CSS 0.7');
  const shot=await command('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,fromSurface:true});
  mkdirSync('qa/screenshots',{recursive:true});
  writeFileSync('qa/screenshots/'+name+'.png',Buffer.from(shot.data,'base64'));
  console.log('Captura real verificada:',name,'desbordamiento=',overflow);
 };
 await command('Page.enable');await command('Runtime.enable');
 await viewport(1440,980);
 await command('Page.navigate',{url:ROOT_URL+'?release='+RELEASE});
 await wait("Boolean(document.querySelector('form[data-form=\"development-login\"]'))");
 await js("document.querySelector('#workspace-account').value='academy-teacher';document.querySelector('form[data-form=\"development-login\"]').requestSubmit();true");
 await wait("Boolean(document.querySelector('.work-home'))");
 await sleep(550);
 await picture('docente-1440');
 await js("location.hash='#/clases/g1?tema=t2';true");
 await wait("Boolean(document.querySelector('.work-topic-workspace'))");
 await sleep(300);
 await picture('clase-1440');
 await viewport(390,844);await sleep(450);await picture('clase-390');
 await js("sessionStorage.removeItem('unespacio.dev.session.v1');location.hash='';location.reload();true");
 await wait("Boolean(document.querySelector('form[data-form=\"development-login\"]'))");
 await js("document.querySelector('#workspace-account').value='student';document.querySelector('form[data-form=\"development-login\"]').requestSubmit();true");
 await wait("Boolean(document.querySelector('.study-home'))");
 await sleep(400);
 await picture('alumno-390');
 await viewport(1440,980);await sleep(400);await picture('alumno-1440');
 // Prueba de trabajo real: crear ocho sesiones semanales y confirmar la persistencia local.
 await js("sessionStorage.removeItem('unespacio.dev.session.v1');location.hash='';location.reload();true");
 await wait("Boolean(document.querySelector('form[data-form=\"development-login\"]'))");
 await js("document.querySelector('#workspace-account').value='academy-teacher';document.querySelector('form[data-form=\"development-login\"]').requestSubmit();true");
 await wait("Boolean(document.querySelector('.work-home'))");
 await js("location.hash='#/clases/g1?tab=sesiones';true");
 await wait("Boolean(document.querySelector('button[data-action=\"new-lesson\"][data-id=\"g1\"]'))");
 await js("document.querySelector('button[data-action=\"new-lesson\"][data-id=\"g1\"]').click();true");
 await wait("Boolean(document.querySelector('form[data-form=\"lesson\"]'))");
 const e2eCreated=await js("(()=>{const form=document.querySelector('form[data-form=\"lesson\"]');form.querySelector('[name=\"subject\"]').value='Sesión de prueba semanal';form.querySelector('[name=\"start\"]').value='2028-04-04T17:00';form.querySelector('[name=\"end\"]').value='2028-04-04T18:00';form.querySelector('[name=\"recurring\"]').checked=true;form.requestSubmit();return true})()");
 if(!e2eCreated)throw new Error('No se pudo completar el formulario de recurrencia');
 await wait("(()=>{const raw=localStorage.getItem('unespacio.dev.data.v1');if(!raw)return false;const data=JSON.parse(raw);return data.lessons.filter(l=>l.subject==='Sesión de prueba semanal').length===8})()");
 const created=await js("JSON.parse(localStorage.getItem('unespacio.dev.data.v1')).lessons.filter(l=>l.subject==='Sesión de prueba semanal').map(l=>l.start)");
 if(created.length!==8)throw new Error('La agenda no ha conservado ocho sesiones recurrentes');
 console.log('Prueba funcional correcta: ocho sesiones semanales guardadas y recuperables.');
 console.log('Verificación del despliegue completa.');
}finally{
 if(ws&&ws.readyState===WebSocket.OPEN)ws.close();
 child.kill('SIGTERM');
 await sleep(400);
 rmSync(profile,{recursive:true,force:true});
}
