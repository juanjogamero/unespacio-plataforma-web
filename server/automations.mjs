import {DateTime} from 'luxon';
import {database,transaction} from './db.mjs';
import {assert,validUUID,validDay,validEmail,weekday,minute,hhmm,isAvailableWindow,localDate,daysFrom} from './domain.mjs';

const rows=async(db,q,p)=>(await db.query(q,p)).rows;
const one=async(db,q,p)=>(await db.query(q,p)).rows[0]??null;
const defaults={ownerAlertsEnabled:false,remindersEnabled:false,dailySummaryEnabled:false,waitlistEnabled:false,summaryHour:18};
const convert=r=>r?{ownerAlertsEnabled:r.owner_alerts_enabled,remindersEnabled:r.reminders_enabled,dailySummaryEnabled:r.daily_summary_enabled,waitlistEnabled:r.waitlist_enabled,summaryHour:r.summary_hour}:{...defaults};
export async function getAutomations(businessId,db=database()){
 return convert(await one(db,'SELECT * FROM automation_settings WHERE business_id=$1',[businessId]));
}
export async function putAutomations(businessId,input){
 for(const k of ['ownerAlertsEnabled','remindersEnabled','dailySummaryEnabled','waitlistEnabled'])assert(typeof input[k]==='boolean','Opción incorrecta: '+k);
 const hour=Number(input.summaryHour);
 assert(Number.isInteger(hour)&&hour>=7&&hour<=21,'El resumen debe programarse entre 07:00 y 21:00');
 await transaction(async db=>{
  await db.query('INSERT INTO automation_settings (business_id,owner_alerts_enabled,reminders_enabled,daily_summary_enabled,waitlist_enabled,summary_hour) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (business_id) DO UPDATE SET owner_alerts_enabled=$2,reminders_enabled=$3,daily_summary_enabled=$4,waitlist_enabled=$5,summary_hour=$6',
   [businessId,input.ownerAlertsEnabled,input.remindersEnabled,input.dailySummaryEnabled,input.waitlistEnabled,hour]);
  for(const [kind,enabled] of [['owner_request',input.ownerAlertsEnabled],['reminder',input.remindersEnabled],['daily_summary',input.dailySummaryEnabled],['waitlist_open',input.waitlistEnabled]]){
   if(!enabled)await db.query("UPDATE notification_queue SET status='cancelled' WHERE business_id=$1 AND kind=$2 AND status='queued'",[businessId,kind]);
  }
 });
 return getAutomations(businessId);
}
export async function listWaitlist(businessId){
 return rows(database(),"SELECT w.id,w.day::text,w.from_min,w.to_min,w.status,w.notify_consent,c.name AS customer_name,c.id AS customer_id,s.name AS service_name,s.id AS service_id,p.name AS professional_name,p.id AS professional_id FROM waitlist_entries w JOIN customers c ON c.business_id=w.business_id AND c.id=w.customer_id JOIN services s ON s.business_id=w.business_id AND s.id=w.service_id JOIN professionals p ON p.business_id=w.business_id AND p.id=w.professional_id WHERE w.business_id=$1 AND w.status='active' ORDER BY w.day,w.created_at LIMIT 250",[businessId]);
}
export async function addWaitlist(businessId,input){
 for(const k of ['customerId','serviceId','professionalId'])assert(validUUID(input[k]),'Selecciona cliente, servicio y profesional');
 assert(validDay(input.day),'Fecha incorrecta');
 const from=minute(input.from),to=minute(input.to);
 assert(Number.isInteger(from)&&Number.isInteger(to)&&to>from&&to<=1440,'Franja horaria incorrecta');
 assert(typeof input.notifyConsent==='boolean','Indica si el cliente autoriza avisos por email');
 return transaction(async db=>{
  const customer=await one(db,'SELECT email FROM customers WHERE business_id=$1 AND id=$2',[businessId,input.customerId]);
  assert(customer,'Cliente desconocido',404);
  if(input.notifyConsent)assert(validEmail(customer.email),'El cliente necesita un email válido para recibir avisos');
  const service=await one(db,'SELECT id FROM services WHERE business_id=$1 AND id=$2 AND active=true',[businessId,input.serviceId]);
  const professional=await one(db,'SELECT id FROM professionals WHERE business_id=$1 AND id=$2 AND active=true',[businessId,input.professionalId]);
  assert(service&&professional,'Servicio o profesional no disponible');
  const result=await one(db,'INSERT INTO waitlist_entries(business_id,customer_id,service_id,professional_id,day,from_min,to_min,notify_consent) VALUES($1,$2,$3,$4,$5::date,$6,$7,$8) RETURNING id',[businessId,input.customerId,input.serviceId,input.professionalId,input.day,from,to,input.notifyConsent]);
  return {id:result.id,status:'active'};
 });
}
export async function closeWaitlist(businessId,id){
 assert(validUUID(id),'Entrada incorrecta');
 const result=await database().query("UPDATE waitlist_entries SET status='closed' WHERE business_id=$1 AND id=$2 AND status='active' RETURNING id",[businessId,id]);
 assert(result.rowCount,'Entrada de espera desconocida',404);
 await database().query("UPDATE notification_queue SET status='cancelled' WHERE business_id=$1 AND waitlist_id=$2 AND status='queued'",[businessId,id]);
 return {ok:true};
}
async function enqueue(db,{businessId,eventKey,kind,email,subject,body,dueAt,appointmentId=null,waitlistId=null}){
 if(!validEmail(email))return false;
 const result=await db.query('INSERT INTO notification_queue (business_id,event_key,kind,recipient_email,subject,body,due_at,appointment_id,waitlist_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (business_id,event_key) DO NOTHING',
 [businessId,eventKey,kind,email,subject.slice(0,200),body,dueAt,appointmentId,waitlistId]);
 return result.rowCount===1;
}
export async function queueOwnerRequest(db,businessId,appointmentId){
 const enabled=await one(db,'SELECT owner_alerts_enabled FROM automation_settings WHERE business_id=$1',[businessId]);
 if(!enabled?.owner_alerts_enabled)return 0;
 const a=await one(db,"SELECT a.day::text,a.start_min,b.name AS business_name,c.name AS customer_name,s.name AS service_name,p.name AS professional_name FROM appointments a JOIN businesses b ON b.id=a.business_id JOIN customers c ON c.business_id=a.business_id AND c.id=a.customer_id JOIN services s ON s.business_id=a.business_id AND s.id=a.service_id JOIN professionals p ON p.business_id=a.business_id AND p.id=a.professional_id WHERE a.business_id=$1 AND a.id=$2 AND a.status='pendiente'",[businessId,appointmentId]);
 if(!a)return 0;
 const owners=await rows(db,"SELECT DISTINCT u.email FROM users u JOIN memberships m ON m.user_id=u.id WHERE m.business_id=$1 AND m.role='owner'",[businessId]);
 let count=0;
 for(const o of owners){
  const body='Se ha recibido una solicitud pendiente de confirmar.\nCliente: '+a.customer_name+'\nServicio: '+a.service_name+'\nProfesional: '+a.professional_name+'\nFecha y hora: '+a.day+' '+hhmm(a.start_min)+'\n\nEntra en Unespacio para confirmar o rechazarla. Este correo no confirma la cita.';
  if(await enqueue(db,{businessId,eventKey:'request:'+appointmentId+':'+o.email,kind:'owner_request',email:o.email,subject:'Nueva solicitud · '+a.business_name,body,dueAt:new Date(),appointmentId}))count++;
 }
 return count;
}
function asZoned(day,startMin,timezone){return DateTime.fromISO(day+'T'+hhmm(startMin),{zone:timezone})}
export async function scheduleReminders(now=new Date(),db=database()){
 const businesses=await rows(db,'SELECT b.id,b.name,b.timezone FROM businesses b JOIN automation_settings st ON st.business_id=b.id WHERE st.reminders_enabled=true',[]);
 let count=0;
 for(const b of businesses){
  const today=localDate(b.timezone,now),end=daysFrom(today,3);
  const appointments=await rows(db,"SELECT a.id,a.day::text,a.start_min,c.email,c.name AS customer_name,s.name AS service_name,p.name AS professional_name FROM appointments a JOIN customers c ON c.business_id=a.business_id AND c.id=a.customer_id JOIN services s ON s.business_id=a.business_id AND s.id=a.service_id JOIN professionals p ON p.business_id=a.business_id AND p.id=a.professional_id WHERE a.business_id=$1 AND a.status='confirmada' AND a.day BETWEEN $2::date AND $3::date AND c.reminder_consent=true AND c.email IS NOT NULL",[b.id,today,end]);
  for(const a of appointments){
   const start=asZoned(a.day,a.start_min,b.timezone);
   if(!start.isValid||!validEmail(a.email)||start.toMillis()-now.getTime()<2*3600000)continue;
   const body='Hola, '+a.customer_name+'.\n\nTe recordamos tu cita en '+b.name+' el '+a.day+' a las '+hhmm(a.start_min)+'.\nServicio: '+a.service_name+'\nProfesional: '+a.professional_name+'\n\nSi necesitas cambiarla, contacta con el establecimiento. Este recordatorio no es publicidad.';
   if(await enqueue(db,{businessId:b.id,eventKey:'reminder:'+a.id+':'+a.day+':'+a.start_min,kind:'reminder',email:a.email,subject:'Recordatorio de tu cita · '+b.name,body,dueAt:start.minus({hours:24}).toJSDate(),appointmentId:a.id}))count++;
  }
 }
 return count;
}
export async function scheduleDigests(now=new Date(),db=database()){
 const accounts=await rows(db,"SELECT b.id,b.name,b.timezone,st.summary_hour,u.email FROM businesses b JOIN automation_settings st ON st.business_id=b.id JOIN memberships m ON m.business_id=b.id AND m.role='owner' JOIN users u ON u.id=m.user_id WHERE st.daily_summary_enabled=true",[]);
 let count=0;
 for(const b of accounts){
  const local=DateTime.fromJSDate(now,{zone:b.timezone});
  if(!local.isValid)continue;
  const due=local.startOf('day').plus({hours:b.summary_hour});
  const day=due.toISODate();
  if(await enqueue(db,{businessId:b.id,eventKey:'digest:'+day+':'+b.email,kind:'daily_summary',email:b.email,subject:'Agenda de mañana · '+b.name,body:'El resumen se genera con los datos actuales en el momento del envío.',dueAt:due.toJSDate()}))count++;
 }
 return count;
}
export async function queueWaitlistForCancellation(db,businessId,cancelled){
 const setting=await one(db,'SELECT waitlist_enabled FROM automation_settings WHERE business_id=$1',[businessId]);
 if(!setting?.waitlist_enabled)return 0;
 const list=await rows(db,"SELECT w.id,w.from_min,w.to_min,w.professional_id,w.day::text,c.name AS customer_name,c.email,s.minutes AS duration,b.name AS business_name FROM waitlist_entries w JOIN customers c ON c.business_id=w.business_id AND c.id=w.customer_id JOIN services s ON s.business_id=w.business_id AND s.id=w.service_id JOIN businesses b ON b.id=w.business_id WHERE w.business_id=$1 AND w.day=$2::date AND w.professional_id=$3 AND w.status='active' AND w.notify_consent=true ORDER BY w.created_at LIMIT 25",[businessId,cancelled.day,cancelled.professional_id]);
 const hours=await rows(db,'SELECT weekday,open_min,close_min FROM business_hours WHERE business_id=$1 AND weekday=$2',[businessId,weekday(cancelled.day)]);
 const closures=await rows(db,'SELECT day::text,professional_id FROM closures WHERE business_id=$1 AND day=$2::date',[businessId,cancelled.day]);
 const occupied=await rows(db,"SELECT day::text,professional_id,start_min,end_min,status FROM appointments WHERE business_id=$1 AND day=$2::date AND professional_id=$3 AND status='confirmada'",[businessId,cancelled.day,cancelled.professional_id]);
 for(const w of list){
  if(!validEmail(w.email))continue;
  const firstMinute=Math.ceil(Math.max(w.from_min,cancelled.start_min)/15)*15;
  const limit=Math.min(w.to_min,cancelled.end_min);
  for(let m=firstMinute;m+w.duration<=limit;m+=15){
   if(!isAvailableWindow(hours,closures,occupied,{day:cancelled.day,professionalId:w.professional_id,start:m,end:m+w.duration}))continue;
   const body='Hola, '+w.customer_name+'.\n\nPuede haber un hueco disponible en '+w.business_name+' el '+cancelled.day+' a las '+hhmm(m)+'.\n\nSi te interesa, responde o llama al establecimiento para comprobar si sigue libre. ESTE AVISO NO CONFIRMA UNA CITA.';
   if(await enqueue(db,{businessId,eventKey:'waitlist:'+cancelled.id+':'+w.id,kind:'waitlist_open',email:w.email,subject:'Hueco disponible · '+w.business_name,body,dueAt:new Date(),waitlistId:w.id}))return 1;
  }
 }
 return 0;
}
async function isEligible(db,job){
 if(job.kind==='owner_request'){
  const row=await one(db,"SELECT a.status,st.owner_alerts_enabled FROM appointments a JOIN automation_settings st ON st.business_id=a.business_id WHERE a.business_id=$1 AND a.id=$2",[job.business_id,job.appointment_id]);
  return row?.status==='pendiente'&&row.owner_alerts_enabled===true;
 }
 if(job.kind==='daily_summary'){
  const st=await one(db,'SELECT daily_summary_enabled FROM automation_settings WHERE business_id=$1',[job.business_id]);
  return st?.daily_summary_enabled===true;
 }
 if(job.kind==='reminder'){
  const a=await one(db,"SELECT a.id,a.status,a.day::text,a.start_min,b.timezone,c.email,c.reminder_consent,st.reminders_enabled FROM appointments a JOIN businesses b ON b.id=a.business_id JOIN customers c ON c.business_id=a.business_id AND c.id=a.customer_id JOIN automation_settings st ON st.business_id=a.business_id WHERE a.business_id=$1 AND a.id=$2",[job.business_id,job.appointment_id]);
  if(!a||a.status!=='confirmada'||!a.reminders_enabled||!a.reminder_consent||a.email!==job.recipient_email||job.event_key!=='reminder:'+a.id+':'+a.day+':'+a.start_min)return false;
  const dt=asZoned(a.day,a.start_min,a.timezone);
  return dt.isValid&&dt.toMillis()>Date.now()+30*60000;
 }
 if(job.kind==='waitlist_open'){
  const w=await one(db,"SELECT w.status,w.notify_consent,w.day::text,w.professional_id,w.from_min,w.to_min,c.email,st.waitlist_enabled,s.minutes FROM waitlist_entries w JOIN customers c ON c.business_id=w.business_id AND c.id=w.customer_id JOIN automation_settings st ON st.business_id=w.business_id JOIN services s ON s.business_id=w.business_id AND s.id=w.service_id WHERE w.business_id=$1 AND w.id=$2",[job.business_id,job.waitlist_id]);
  if(!w||w.status!=='active'||!w.notify_consent||!w.waitlist_enabled||w.email!==job.recipient_email)return false;
  const cancelledId=job.event_key.split(':')[1];
  if(!validUUID(cancelledId))return false;
  const cancelled=await one(db,"SELECT id,day::text,start_min,end_min,professional_id FROM appointments WHERE business_id=$1 AND id=$2 AND status='cancelada'",[job.business_id,cancelledId]);
  if(!cancelled||cancelled.day!==w.day||String(cancelled.professional_id)!==String(w.professional_id))return false;
  const hours=await rows(db,'SELECT weekday,open_min,close_min FROM business_hours WHERE business_id=$1 AND weekday=$2',[job.business_id,weekday(w.day)]);
  const closures=await rows(db,'SELECT day::text,professional_id FROM closures WHERE business_id=$1 AND day=$2::date',[job.business_id,w.day]);
  const occupied=await rows(db,"SELECT day::text,professional_id,start_min,end_min,status FROM appointments WHERE business_id=$1 AND day=$2::date AND professional_id=$3 AND status='confirmada'",[job.business_id,w.day,w.professional_id]);
  const firstMinute=Math.ceil(Math.max(w.from_min,cancelled.start_min)/15)*15;
  const limit=Math.min(w.to_min,cancelled.end_min);
  for(let m=firstMinute;m+w.minutes<=limit;m+=15){
   if(isAvailableWindow(hours,closures,occupied,{day:w.day,professionalId:w.professional_id,start:m,end:m+w.minutes}))return true;
  }
  return false;
 }
 return false;
}
async function freshDigest(db,job){
 const matched=job.event_key.match(/^digest:(\d{4}-\d{2}-\d{2}):/);
 if(!matched)return null;
 const tomorrow=daysFrom(matched[1],1);
 const names=await rows(db,"SELECT a.start_min,c.name AS customer_name,s.name AS service_name,p.name AS professional_name FROM appointments a JOIN customers c ON c.business_id=a.business_id AND c.id=a.customer_id JOIN services s ON s.business_id=a.business_id AND s.id=a.service_id JOIN professionals p ON p.business_id=a.business_id AND p.id=a.professional_id WHERE a.business_id=$1 AND a.day=$2::date AND a.status='confirmada' ORDER BY a.start_min",[job.business_id,tomorrow]);
 return 'Agenda de mañana ('+tomorrow+')\n\n'+(names.length?names.map(a=>hhmm(a.start_min)+' · '+a.customer_name+' · '+a.service_name+' · '+a.professional_name).join('\n'):'No hay citas confirmadas.')+'\n\nResumen automático de Unespacio.';
}
export async function processQueue(send,{db=database(),max=10}={}){
 const claimed=await rows(db,"UPDATE notification_queue SET status='sending',locked_at=now(),attempts=attempts+1 WHERE id IN (SELECT id FROM notification_queue WHERE ((status IN ('queued','failed') AND attempts<3 AND due_at<=now()) OR (status='sending' AND locked_at<now()-interval '15 minutes' AND attempts<3)) ORDER BY due_at FOR UPDATE SKIP LOCKED LIMIT $1) RETURNING *",[max]);
 let sent=0,skipped=0,failed=0;
 for(const job of claimed){
  try{
   if(!await isEligible(db,job)){await db.query("UPDATE notification_queue SET status='cancelled',locked_at=NULL WHERE id=$1",[job.id]);skipped++;continue}
   const body=job.kind==='daily_summary'?(await freshDigest(db,job))??job.body:job.body;
   await send({to:job.recipient_email,subject:job.subject,text:body});
   await db.query("UPDATE notification_queue SET status='sent',sent_at=now(),locked_at=NULL,last_error=NULL WHERE id=$1",[job.id]);
   if(job.kind==='waitlist_open')await db.query("UPDATE waitlist_entries SET status='notified' WHERE id=$1 AND business_id=$2 AND status='active'",[job.waitlist_id,job.business_id]);
   sent++;
  }catch{
   await db.query("UPDATE notification_queue SET status=CASE WHEN attempts>=3 THEN 'failed' ELSE 'queued' END,locked_at=NULL,due_at=now()+interval '15 minutes',last_error='Error de entrega' WHERE id=$1",[job.id]);failed++;
  }
 }
 return {claimed:claimed.length,sent,skipped,failed};
}
