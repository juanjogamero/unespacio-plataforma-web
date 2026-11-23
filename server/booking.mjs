import {database,transaction} from './db.mjs';
import {assert,validDay,validUUID,nonEmpty,validPhone,minute,hhmm,localDate,daysFrom,weekday,validateWindow,isAvailableWindow,SOURCES} from './domain.mjs';

const rows=async(db,sql,params)=> (await db.query(sql,params)).rows;
const one=async(db,sql,params)=> (await db.query(sql,params)).rows[0]??null;
export function dbConflict(error){
 if(error?.code==='23P01')return Object.assign(new Error('Ese profesional acaba de recibir otra cita en ese horario'),{status:409});
 if(error?.code==='23505')return Object.assign(new Error('Ese registro ya existe'),{status:409});
 if(error?.code==='23503')return Object.assign(new Error('Referencia desconocida o de otro negocio'),{status:400});
 if(error?.code==='23514')return Object.assign(new Error('El dato no cumple las restricciones'),{status:400});
 return error;
}
export async function businessBySlug(slug){
 return one(database(),'SELECT id,slug,name,timezone,public_booking_enabled,privacy_url FROM businesses WHERE slug=$1',[slug]);
}
export async function publicInfo(slug){
 const business=await businessBySlug(slug);
 assert(business&&business.public_booking_enabled&&business.privacy_url,'La reserva online no está disponible para este negocio',404);
 const [services,professionals]=await Promise.all([
  rows(database(),'SELECT id,name,minutes,price_cents FROM services WHERE business_id=$1 AND active=true ORDER BY name',[business.id]),
  rows(database(),'SELECT id,name FROM professionals WHERE business_id=$1 AND active=true ORDER BY name',[business.id])
 ]);
 return {business:{name:business.name,slug:business.slug,timezone:business.timezone,privacyUrl:business.privacy_url},services,professionals};
}
export async function businessData(id){
 const [services,professionals,customers,hours,closures]=await Promise.all([
  rows(database(),'SELECT id,name,minutes,price_cents,active FROM services WHERE business_id=$1 ORDER BY name',[id]),
  rows(database(),'SELECT id,name,active FROM professionals WHERE business_id=$1 ORDER BY name',[id]),
  rows(database(),'SELECT id,name,phone,preference FROM customers WHERE business_id=$1 ORDER BY name LIMIT 500',[id]),
  rows(database(),'SELECT weekday,slot,open_min,close_min FROM business_hours WHERE business_id=$1 ORDER BY weekday,slot',[id]),
  rows(database(),"SELECT id,day::text,professional_id,reason FROM closures WHERE business_id=$1 AND day >= current_date ORDER BY day LIMIT 120",[id])
 ]);
 return {services,professionals,customers,hours,closures};
}
export async function agenda(businessId,day){
 assert(validDay(day),'Selecciona una fecha válida');
 return rows(database(),"SELECT a.id,a.day::text,a.start_min,a.end_min,a.source,a.status,c.id AS customer_id,c.name AS customer_name,p.id AS professional_id,p.name AS professional_name,s.id AS service_id,s.name AS service_name,s.price_cents FROM appointments a JOIN customers c ON c.id=a.customer_id AND c.business_id=a.business_id JOIN professionals p ON p.id=a.professional_id AND p.business_id=a.business_id JOIN services s ON s.id=a.service_id AND s.business_id=a.business_id WHERE a.business_id=$1 AND a.day=$2::date ORDER BY a.start_min",[businessId,day]);
}
async function windowRules(db,businessId,professionalId,serviceId,day,time,excludeId=null){
 assert(validUUID(professionalId)&&validUUID(serviceId),'Profesional o servicio incorrecto');
 const service=await one(db,'SELECT id,minutes,active FROM services WHERE business_id=$1 AND id=$2',[businessId,serviceId]);
 const professional=await one(db,'SELECT id,active FROM professionals WHERE business_id=$1 AND id=$2',[businessId,professionalId]);
 assert(service?.active&&professional?.active,'El servicio o profesional no está disponible',400);
 const {start,end}=validateWindow(day,time,service.minutes);
 const hours=await rows(db,'SELECT weekday,open_min,close_min FROM business_hours WHERE business_id=$1 AND weekday=$2',[businessId,weekday(day)]);
 const closures=await rows(db,'SELECT day::text,professional_id FROM closures WHERE business_id=$1 AND day=$2::date AND (professional_id IS NULL OR professional_id=$3)',[businessId,day,professionalId]);
 // La constraint EXCLUDE en PostgreSQL es la garantía transaccional contra carreras.
 const busy=await rows(db,"SELECT id,day::text,professional_id,start_min,end_min,status FROM appointments WHERE business_id=$1 AND day=$2::date AND professional_id=$3 AND status='confirmada' AND ($4::uuid IS NULL OR id<>$4::uuid)",[businessId,day,professionalId,excludeId]);
 assert(isAvailableWindow(hours,closures,busy,{day,professionalId,start,end}),'El horario está cerrado, bloqueado u ocupado',409);
 return {start,end};
}
export async function freeSlots(business,professionalId,serviceId,day){
 assert(validDay(day),'Fecha incorrecta');
 assert(validUUID(professionalId)&&validUUID(serviceId),'Profesional o servicio incorrecto');
 const today=localDate(business.timezone);
 assert(day>=today&&day<=daysFrom(today,45),'Selecciona un día de los próximos 45 días');
 const db=database();
 const service=await one(db,'SELECT minutes FROM services WHERE business_id=$1 AND id=$2 AND active=true',[business.id,serviceId]);
 const professional=await one(db,'SELECT id FROM professionals WHERE business_id=$1 AND id=$2 AND active=true',[business.id,professionalId]);
 assert(service&&professional,'Servicio o profesional no disponible',404);
 const [hours,closures,busy]=await Promise.all([
  rows(db,'SELECT weekday,open_min,close_min FROM business_hours WHERE business_id=$1 AND weekday=$2',[business.id,weekday(day)]),
  rows(db,'SELECT day::text,professional_id FROM closures WHERE business_id=$1 AND day=$2::date AND (professional_id IS NULL OR professional_id=$3)',[business.id,day,professionalId]),
  rows(db,"SELECT day::text,professional_id,start_min,end_min,status FROM appointments WHERE business_id=$1 AND day=$2::date AND professional_id=$3 AND status='confirmada'",[business.id,day,professionalId])
 ]);
 const times=[];
 for(const h of hours)for(let start=Math.ceil(h.open_min/15)*15;start+service.minutes<=h.close_min;start+=15){
  if(isAvailableWindow(hours,closures,busy,{day,professionalId,start,end:start+service.minutes}))times.push(hhmm(start));
 }
 return times;
}
export async function saveManual(businessId,input,editingId=null){
 assert(validUUID(input.professionalId)&&validUUID(input.serviceId),'Servicio o profesional incorrecto');
 assert(SOURCES.has(input.channel)&&input.channel!=='online','Selecciona teléfono, WhatsApp o en persona');
 assert(validDay(input.day),'Fecha incorrecta');
 if(input.clientId)assert(validUUID(input.clientId),'Cliente incorrecto');
 else assert(nonEmpty(input.clientName,2,100),'Escribe el nombre del cliente');
 if(editingId)assert(validUUID(editingId),'Cita incorrecta');
 try{return await transaction(async db=>{
  const {start,end}=await windowRules(db,businessId,input.professionalId,input.serviceId,input.day,input.time,editingId);
  let customerId=input.clientId;
  if(customerId){
   const owned=await one(db,'SELECT id FROM customers WHERE business_id=$1 AND id=$2',[businessId,customerId]);
   assert(Boolean(owned),'Cliente de otro negocio o inexistente',404);
  }else{
   const c=await one(db,'INSERT INTO customers(business_id,name,phone,preference) VALUES($1,$2,$3,$4) RETURNING id',[businessId,input.clientName.trim(),input.phone||null,input.channel]);customerId=c.id;
  }
  if(editingId){
   const edited=await one(db,"UPDATE appointments SET customer_id=$3,service_id=$4,professional_id=$5,day=$6::date,start_min=$7,end_min=$8,source=$9 WHERE business_id=$1 AND id=$2 AND status='confirmada' RETURNING id",[businessId,editingId,customerId,input.serviceId,input.professionalId,input.day,start,end,input.channel]);
   assert(edited,'No se encuentra esa cita en este negocio',404);
   return {id:edited.id,status:'confirmada'};
  }
  const added=await one(db,"INSERT INTO appointments(business_id,customer_id,professional_id,service_id,day,start_min,end_min,source,status) VALUES($1,$2,$3,$4,$5::date,$6,$7,$8,'confirmada') RETURNING id",[businessId,customerId,input.professionalId,input.serviceId,input.day,start,end,input.channel]);
  return {id:added.id,status:'confirmada'};
 })}catch(e){throw dbConflict(e)}
}
export async function cancel(businessId,id){
 assert(validUUID(id),'Cita incorrecta');
 const changed=await one(database(),"UPDATE appointments SET status='cancelada' WHERE business_id=$1 AND id=$2 AND status IN ('confirmada','pendiente') RETURNING id",[businessId,id]);
 assert(changed,'No se encuentra esa cita activa',404);return {id:changed.id,status:'cancelada'};
}
export async function confirmRequest(businessId,id){
 assert(validUUID(id),'Cita incorrecta');
 try{return await transaction(async db=>{
  const appointment=await one(db,"SELECT a.id,a.day::text,a.start_min,a.service_id,a.professional_id FROM appointments a WHERE a.business_id=$1 AND a.id=$2 AND a.status='pendiente' FOR UPDATE",[businessId,id]);
  assert(appointment,'La solicitud ya no está pendiente',404);
  const time=hhmm(appointment.start_min);
  await windowRules(db,businessId,appointment.professional_id,appointment.service_id,appointment.day,time,id);
  const updated=await one(db,"UPDATE appointments SET status='confirmada' WHERE business_id=$1 AND id=$2 RETURNING id",[businessId,id]);
  return {id:updated.id,status:'confirmada'};
 })}catch(e){throw dbConflict(e)}
}
export async function requestPublic(slug,input){
 const business=await businessBySlug(slug);
 assert(business?.public_booking_enabled&&business.privacy_url,'La reserva pública no está habilitada',404);
 assert(!input.website,'Solicitud no válida',400);
 assert(input.acceptedPrivacy===true,'Debes aceptar la información de privacidad para solicitar una cita');
 assert(nonEmpty(input.name,2,100)&&validPhone(input.phone),'Escribe tu nombre y un teléfono válido');
 const today=localDate(business.timezone);
 assert(validDay(input.day)&&input.day>=today&&input.day<=daysFrom(today,45),'Selecciona una fecha próxima');
 assert(validUUID(input.professionalId)&&validUUID(input.serviceId),'Servicio o profesional incorrecto');
 try{return await transaction(async db=>{
  const {start,end}=await windowRules(db,business.id,input.professionalId,input.serviceId,input.day,input.time);
  const client=await one(db,"INSERT INTO customers(business_id,name,phone,preference) VALUES($1,$2,$3,'online') RETURNING id",[business.id,input.name.trim(),input.phone.trim()]);
  const request=await one(db,"INSERT INTO appointments(business_id,customer_id,professional_id,service_id,day,start_min,end_min,source,status) VALUES($1,$2,$3,$4,$5::date,$6,$7,'online','pendiente') RETURNING id",[business.id,client.id,input.professionalId,input.serviceId,input.day,start,end]);
  return {requestId:request.id,status:'pendiente',message:'Solicitud recibida; el negocio debe confirmarla antes de que la cita esté reservada.'};
 })}catch(e){throw dbConflict(e)}
}
