import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,sep,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {database,transaction} from './db.mjs';
import {assert,validSlug,validDay,validUUID,nonEmpty,validPhone,minute,hhmm,validateHours,weekday} from './domain.mjs';
import {register,login,authenticate,requireCSRF,logout,cookieHeader,sessionCSRF} from './auth.mjs';
import {businessBySlug,publicInfo,freeSlots,businessData,agenda,saveManual,cancel,confirmRequest,requestPublic,dbConflict} from './booking.mjs';

const PORT=Number(process.env.API_PORT||4174),HOST=process.env.API_HOST||'127.0.0.1';
const ROOT=resolve(fileURLToPath(new URL('../dist',import.meta.url)));
const ORIGIN=process.env.APP_ORIGIN||'http://127.0.0.1:'+PORT;
const limits=new Map();
function throttle(key,max,windowMs){
 const now=Date.now();const hits=(limits.get(key)||[]).filter(x=>x>now-windowMs);
 assert(hits.length<max,'Demasiados intentos. Prueba más tarde.',429);
 hits.push(now);limits.set(key,hits);
 if(limits.size>15000){for(const [k,v] of limits){if(v[v.length-1]<now-windowMs)limits.delete(k)}}
}
function response(res,status,data,extra={}){
 const body=JSON.stringify(data);
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'",...extra});
 res.end(body);
}
async function bodyJSON(req){
 let size=0,body='';
 for await(const chunk of req){
  size+=chunk.length;
  assert(size<=16384,'El formulario es demasiado grande',413);
  body+=chunk.toString('utf8');
 }
 let parsed;try{parsed=JSON.parse(body||'{}')}catch{throw Object.assign(new Error('JSON incorrecto'),{status:400})}
 assert(parsed&&typeof parsed==='object'&&!Array.isArray(parsed),'Se espera un objeto JSON');
 return parsed;
}
function originCheck(req){
 const origin=req.headers.origin;
 if(process.env.NODE_ENV==='production')assert(process.env.APP_ORIGIN&&ORIGIN.startsWith('https://'),'APP_ORIGIN debe ser HTTPS para producción',503);
 if(origin)assert(origin===ORIGIN,'Origen de la solicitud no autorizado',403);
 const site=req.headers['sec-fetch-site'];
 if(site)assert(['same-origin','none'].includes(site),'No se permiten peticiones de otro sitio',403);
}
const errorResponse=(res,error)=>{
 const status=Number(error?.status)||((error?.code==='23505'||error?.code==='23P01')?409:500);
 if(status>=500)console.error('Error API:',error);
 response(res,status,{error:status>=500?'No se pudo completar la operación.':error.message});
};
const owner=s=>assert(s.role==='owner','Solo la persona responsable puede realizar esta acción',403);
const checkedUUID=id=>{assert(validUUID(id),'Identificador no válido');return id};
const trim=(v,min=2,max=100)=>{assert(nonEmpty(v,min,max),'Nombre o texto incorrecto');return v.trim()};
const clientIP=req=>req.socket.remoteAddress||'desconocida';
const pathSegments=url=>url.pathname.split('/').filter(Boolean);

async function handleApi(req,res,url){
 const method=req.method||'GET',parts=pathSegments(url),path=url.pathname;
 if(method==='GET'&&path==='/api/v1/health'){
  await database().query('SELECT 1');
  return response(res,200,{ok:true,service:'unespacio-api'});
 }
 if(!['GET','HEAD'].includes(method))originCheck(req);
 if(method==='POST'&&path==='/api/v1/auth/register'){
  assert(process.env.ALLOW_PUBLIC_SIGNUP==='true','El registro público todavía no está habilitado',403);
  throttle('register:'+clientIP(req),3,3600000);
  const out=await register(await bodyJSON(req));
  return response(res,201,{business:out.business,user:out.user,csrfToken:out.csrf},{'Set-Cookie':cookieHeader(out.sid)});
 }
 if(method==='POST'&&path==='/api/v1/auth/login'){
  throttle('login:'+clientIP(req),8,900000);
  const out=await login(await bodyJSON(req));
  return response(res,200,{business:out.business,user:out.user,csrfToken:out.csrf},{'Set-Cookie':cookieHeader(out.sid)});
 }
 if(parts[2]==='public'&&validSlug(parts[3])){
  const slug=parts[3];
  if(method==='GET'&&parts.length===4)return response(res,200,await publicInfo(slug));
  if(method==='GET'&&parts[4]==='availability'&&parts.length===5){
   const business=await businessBySlug(slug);
   assert(business?.public_booking_enabled&&business.privacy_url,'No se admiten reservas online aquí',404);
   const free=await freeSlots(business,url.searchParams.get('professionalId'),url.searchParams.get('serviceId'),url.searchParams.get('day'));
   return response(res,200,{availableTimes:free});
  }
  if(method==='POST'&&parts[4]==='book'&&parts.length===5){
   throttle('public-book:'+clientIP(req)+':'+slug,4,3600000);
   return response(res,202,await requestPublic(slug,await bodyJSON(req)));
  }
 }
 const session=await authenticate(req);
 assert(session,'Necesitas iniciar sesión',401);
 if(method==='GET'&&path==='/api/v1/me'){
  const csrfToken=await sessionCSRF(session);
  return response(res,200,{user:{email:session.email,role:session.role},business:{id:session.business_id,name:session.name,slug:session.slug,timezone:session.timezone,publicBookingEnabled:session.public_booking_enabled,privacyUrl:session.privacy_url},csrfToken});
 }
 if(method==='POST'&&path==='/api/v1/auth/logout'){
  await logout(req,session);return response(res,200,{ok:true},{'Set-Cookie':cookieHeader('',true)});
 }
 if(!['GET','HEAD'].includes(method))requireCSRF(req,session);
 const id=session.business_id;
 if(method==='GET'&&path==='/api/v1/data')return response(res,200,await businessData(id));
 if(method==='GET'&&path==='/api/v1/agenda')return response(res,200,{appointments:await agenda(id,url.searchParams.get('day'))});
 if(method==='POST'&&path==='/api/v1/appointments')return response(res,201,await saveManual(id,await bodyJSON(req)));
 if(parts[2]==='appointments'&&parts[3]&&parts.length===4){
  const appointmentId=checkedUUID(parts[3]);
  if(method==='PATCH')return response(res,200,await saveManual(id,await bodyJSON(req),appointmentId));
 }
 if(parts[2]==='appointments'&&parts[3]&&parts.length===5&&method==='POST'){
  const appointmentId=checkedUUID(parts[3]);
  if(parts[4]==='cancel')return response(res,200,await cancel(id,appointmentId));
  if(parts[4]==='confirm')return response(res,200,await confirmRequest(id,appointmentId));
 }
 if(parts[2]==='clients'&&parts.length===3){
  if(method==='GET')return response(res,200,{clients:(await database().query('SELECT id,name,phone,preference FROM customers WHERE business_id=$1 ORDER BY name LIMIT 1000',[id])).rows});
  if(method==='POST'){
   const b=await bodyJSON(req),name=trim(b.name),phone=b.phone?String(b.phone).trim():null,preference=b.preference||'telefono';
   assert(!phone||validPhone(phone),'Teléfono incorrecto');assert(['telefono','whatsapp','local','online'].includes(preference),'Preferencia incorrecta');
   const row=await database().query('INSERT INTO customers(business_id,name,phone,preference) VALUES($1,$2,$3,$4) RETURNING id',[id,name,phone,preference]);
   return response(res,201,{id:row.rows[0].id});
  }
 }
 if(parts[2]==='clients'&&parts[3]&&parts.length===4&&method==='PATCH'){
  const cid=checkedUUID(parts[3]),b=await bodyJSON(req),name=trim(b.name),phone=b.phone?String(b.phone).trim():null,preference=b.preference||'telefono';
  assert(!phone||validPhone(phone),'Teléfono incorrecto');assert(['telefono','whatsapp','local','online'].includes(preference),'Preferencia incorrecta');
  const row=await database().query('UPDATE customers SET name=$3,phone=$4,preference=$5 WHERE business_id=$1 AND id=$2 RETURNING id',[id,cid,name,phone,preference]);
  assert(row.rowCount,'Cliente no encontrado',404);return response(res,200,{id:cid});
 }
 if(parts[2]==='services'&&parts.length===3){
  if(method==='GET')return response(res,200,{services:(await database().query('SELECT id,name,minutes,price_cents,active FROM services WHERE business_id=$1 ORDER BY name',[id])).rows});
  if(method==='POST'){
   owner(session);const b=await bodyJSON(req),name=trim(b.name),minutes=Number(b.minutes),priceCents=Number(b.priceCents);
   assert(Number.isInteger(minutes)&&minutes>=10&&minutes<=240&&minutes%5===0,'Duración incorrecta');
   assert(Number.isInteger(priceCents)&&priceCents>=0&&priceCents<=999999,'Precio incorrecto');
   const row=await database().query('INSERT INTO services(business_id,name,minutes,price_cents) VALUES($1,$2,$3,$4) RETURNING id',[id,name,minutes,priceCents]);
   return response(res,201,{id:row.rows[0].id});
  }
 }
 if(parts[2]==='professionals'&&parts.length===3){
  if(method==='GET')return response(res,200,{professionals:(await database().query('SELECT id,name,active FROM professionals WHERE business_id=$1 ORDER BY name',[id])).rows});
  if(method==='POST'){
   owner(session);const b=await bodyJSON(req),name=trim(b.name,2,80);
   const row=await database().query('INSERT INTO professionals(business_id,name) VALUES($1,$2) RETURNING id',[id,name]);
   return response(res,201,{id:row.rows[0].id});
  }
 }
 if(path==='/api/v1/hours'&&method==='GET'){
  return response(res,200,{hours:(await database().query('SELECT weekday,slot,open_min,close_min FROM business_hours WHERE business_id=$1 ORDER BY weekday,slot',[id])).rows});
 }
 if(path==='/api/v1/hours'&&method==='PUT'){
  owner(session);const b=await bodyJSON(req);const hours=validateHours(b.hours);
  await transaction(async db=>{
   await db.query('DELETE FROM business_hours WHERE business_id=$1',[id]);
   for(const hour of hours)await db.query('INSERT INTO business_hours(business_id,weekday,slot,open_min,close_min) VALUES($1,$2,$3,$4,$5)',[id,hour.weekday,hour.slot,hour.open,hour.close]);
  });
  return response(res,200,{ok:true,warning:'Las citas existentes no cambian de hora automáticamente.'});
 }
 if(path==='/api/v1/closures'&&method==='POST'){
  owner(session);const b=await bodyJSON(req),professionalId=b.professionalId||null;
  assert(validDay(b.day),'Día incorrecto');if(professionalId)checkedUUID(professionalId);
  const reason=nonEmpty(b.reason,2,120)?b.reason.trim():'Cierre del negocio';
  // No se permiten cierres retroactivos que dejen citas confirmadas olvidadas.
  const blockers=await database().query("SELECT id FROM appointments WHERE business_id=$1 AND day=$2::date AND status='confirmada' AND ($3::uuid IS NULL OR professional_id=$3::uuid) LIMIT 1",[id,b.day,professionalId]);
  assert(blockers.rowCount===0,'Ese día tiene citas confirmadas: muévelas o cancélalas antes de bloquearlo.',409);
  const row=await database().query('INSERT INTO closures(business_id,professional_id,day,reason) VALUES($1,$2,$3::date,$4) RETURNING id',[id,professionalId,b.day,reason]);
  return response(res,201,{id:row.rows[0].id});
 }
 if(parts[2]==='closures'&&parts.length===4&&method==='DELETE'){
  owner(session);const closureId=checkedUUID(parts[3]);
  const result=await database().query('DELETE FROM closures WHERE business_id=$1 AND id=$2',[id,closureId]);
  assert(result.rowCount,'Bloqueo desconocido',404);return response(res,200,{ok:true});
 }
 if(path==='/api/v1/business'&&method==='PATCH'){
  owner(session);const b=await bodyJSON(req);
  const name=trim(b.name,2,100),enabled=b.publicBookingEnabled===true,privacyUrl=b.privacyUrl?String(b.privacyUrl):null;
  assert(!privacyUrl||/^https:\/\/[^<>"\s]{3,500}$/i.test(privacyUrl),'Se necesita una URL de privacidad HTTPS');
  assert(!enabled||privacyUrl,'Para aceptar solicitudes online necesitas una política de privacidad pública');
  await database().query('UPDATE businesses SET name=$2,public_booking_enabled=$3,privacy_url=$4 WHERE id=$1',[id,name,enabled,privacyUrl]);
  return response(res,200,{ok:true});
 }
 return response(res,404,{error:'Ruta no encontrada'});
}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
async function serveStatic(req,res,url){
 if(!['GET','HEAD'].includes(req.method||''))return response(res,405,{error:'Método no permitido'});
 let pathname;
 try{pathname=decodeURIComponent(url.pathname)}catch{return response(res,400,{error:'Ruta incorrecta'})}
 const target=pathname==='/'?join(ROOT,'index.html'):resolve(ROOT,'.'+pathname);
 if(!(target===ROOT||target.startsWith(ROOT+sep)))return response(res,403,{error:'Ruta prohibida'});
 try{
  const info=await stat(target);assert(info.isFile(),'No encontrado',404);
  const bytes=await readFile(target),contentType=mime[extname(target)]||'application/octet-stream';
  res.writeHead(200,{'Content-Type':contentType,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'none';base-uri 'none';form-action 'self';script-src 'self';style-src 'self' https://fonts.googleapis.com;font-src https://fonts.gstatic.com;img-src 'self' data:;connect-src 'self';frame-ancestors 'none'"});
  res.end(req.method==='HEAD'?undefined:bytes);
 }catch(e){return response(res,404,{error:'Archivo no encontrado'})}
}
export function createApp(){
 return createServer(async(req,res)=>{
  try{
   const url=new URL(req.url||'/','http://localhost');
   if(url.pathname.startsWith('/api/v1/'))await handleApi(req,res,url);
   else await serveStatic(req,res,url);
  }catch(error){errorResponse(res,dbConflict(error))}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.env.NODE_ENV==='production')assert(process.env.APP_ORIGIN?.startsWith('https://'),'Se necesita APP_ORIGIN=https://... en producción',503);
 assert(process.env.DATABASE_URL,'Falta configurar DATABASE_URL',503);
 createApp().listen(PORT,HOST,()=>console.log('Unespacio API en '+HOST+':'+PORT));
}
