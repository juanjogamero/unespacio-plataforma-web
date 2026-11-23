export const SOURCES=new Set(['telefono','whatsapp','local','online']);
export function assert(condition,message,status=400){
 if(!condition){const e=new Error(message);e.status=status;throw e}
}
export function nonEmpty(value,min=2,max=100){return typeof value==='string'&&value.trim().length>=min&&value.trim().length<=max}
export function validSlug(value){return typeof value==='string'&&/^[a-z0-9][a-z0-9-]{2,49}$/.test(value)}
export function validEmail(value){return typeof value==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)&&value.length<=254}
export function validUUID(value){return typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)}
export function validPhone(value){return typeof value==='string'&&/^\+?[0-9()\s-]{8,30}$/.test(value)&&value.replace(/\D/g,'').length>=9}
export function validDay(day){
 if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day))return false;
 const d=new Date(day+'T12:00:00.000Z');return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===day;
}
export function minute(time){
 if(typeof time!=='string'||!/^\d{2}:\d{2}$/.test(time))return NaN;
 const h=Number(time.slice(0,2)),m=Number(time.slice(3));
 return h<24&&m<60?h*60+m:NaN;
}
export function hhmm(minutes){return String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0')}
export function localDate(timezone='Europe/Madrid',now=new Date()){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const get=x=>parts.find(p=>p.type===x)?.value;
 return get('year')+'-'+get('month')+'-'+get('day');
}
export function daysFrom(day,delta){
 const d=new Date(day+'T12:00:00.000Z');d.setUTCDate(d.getUTCDate()+delta);return d.toISOString().slice(0,10);
}
export function weekday(day){
 assert(validDay(day),'Fecha no válida');
 return new Date(day+'T12:00:00.000Z').getUTCDay();
}
export function validateWindow(day,time,duration){
 assert(validDay(day),'Fecha no válida');
 const start=minute(time);
 assert(Number.isInteger(start)&&start%5===0,'Hora no válida o fuera de los intervalos de 5 minutos');
 assert(Number.isInteger(duration)&&duration>=10&&duration<=240,'Duración del servicio incorrecta');
 assert(start+duration<=1440,'El servicio terminaría después de medianoche');
 return {start,end:start+duration};
}
export function validateHours(rows){
 assert(Array.isArray(rows)&&rows.length<=21,'Horario semanal incorrecto');
 const grouped=new Map();
 for(const row of rows){
  assert(Number.isInteger(row.weekday)&&row.weekday>=0&&row.weekday<=6,'Día incorrecto');
  assert(Number.isInteger(row.slot)&&row.slot>=1&&row.slot<=3,'Turno incorrecto');
  const open=minute(row.open),close=minute(row.close);
  assert(Number.isInteger(open)&&Number.isInteger(close)&&close>open&&close-open>=15,'Horas de apertura incorrectas');
  const items=grouped.get(row.weekday)||[];items.push({slot:row.slot,open,close});grouped.set(row.weekday,items);
 }
 for(const items of grouped.values()){
  items.sort((a,b)=>a.open-b.open);
  for(let i=1;i<items.length;i++)assert(items[i].open>=items[i-1].close,'Los turnos no pueden solaparse');
  assert(new Set(items.map(i=>i.slot)).size===items.length,'Turno duplicado');
 }
 return rows.map(r=>({weekday:r.weekday,slot:r.slot,open:minute(r.open),close:minute(r.close)}));
}
export function isAvailableWindow(hours,closures,appointments,{day,professionalId,start,end}){
 const open=hours.some(h=>h.weekday===weekday(day)&&start>=h.open_min&&end<=h.close_min);
 if(!open)return false;
 if(closures.some(c=>String(c.day).slice(0,10)===day&&(!c.professional_id||String(c.professional_id)===professionalId)))return false;
 if(appointments.some(a=>String(a.day).slice(0,10)===day&&String(a.professional_id)===professionalId&&a.status==='confirmada'&&start<a.end_min&&end>a.start_min))return false;
 return true;
}
