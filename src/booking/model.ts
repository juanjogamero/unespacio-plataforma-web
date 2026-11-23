export type Channel='telefono'|'whatsapp'|'local'|'online';
export type Preference=Channel;
export type AppointmentStatus='confirmada'|'cancelada';
export interface Service {id:string;name:string;minutes:number;price:number}
export interface Professional {id:string;name:string;initials:string}
export interface Client {id:string;name:string;phone:string;preference:Preference}
export interface Appointment {id:string;clientId:string;serviceId:string;professionalId:string;day:string;time:string;channel:Channel;status:AppointmentStatus}
export interface DemoData {services:Service[];professionals:Professional[];clients:Client[];appointments:Appointment[]}
export interface BookingInput {clientId:string;serviceId:string;professionalId:string;day:string;time:string;channel:Channel}
export const CHANNEL_LABEL:Record<Channel,string>={telefono:'Teléfono',whatsapp:'WhatsApp',local:'En el local',online:'Online'};
export const STORAGE_KEY='unespacio.citas.demo.v1';
const two=(n:number)=>String(n).padStart(2,'0');
export function localISO(d:Date):string{return d.getFullYear()+'-'+two(d.getMonth()+1)+'-'+two(d.getDate())}
export function dayOffset(days=0,base=new Date()):string{const d=new Date(base.getFullYear(),base.getMonth(),base.getDate()+days);return localISO(d)}
export function shiftDay(day:string,days:number):string{const d=parseDay(day);d.setDate(d.getDate()+days);return localISO(d)}
export function parseDay(day:string):Date{const [y,m,d]=day.split('-').map(Number);return new Date(y||2026,(m||1)-1,d||1)}
export function formatDay(day:string,options?:Intl.DateTimeFormatOptions):string{return new Intl.DateTimeFormat('es-ES',options??{weekday:'long',day:'numeric',month:'long'}).format(parseDay(day))}
export function timeMinutes(time:string):number{const [h,m]=time.split(':').map(Number);return (h||0)*60+(m||0)}
export function minutesTime(minutes:number):string{return two(Math.floor(minutes/60))+':'+two(minutes%60)}
export function uid():string{return typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():'d'+Date.now().toString(36)+Math.random().toString(36).slice(2)}
export function seedData(today=dayOffset()):DemoData{
 const services:Service[]=[{id:'s1',name:'Corte de pelo',minutes:30,price:14},{id:'s2',name:'Arreglo de barba',minutes:20,price:9},{id:'s3',name:'Corte y barba',minutes:50,price:20},{id:'s4',name:'Peinado',minutes:45,price:17}];
 const professionals:Professional[]=[{id:'p1',name:'Manolo',initials:'MA'},{id:'p2',name:'Lucía',initials:'LU'}];
 const clients:Client[]=[{id:'c1',name:'Antonio García',phone:'',preference:'telefono'},{id:'c2',name:'Carmen Ruiz',phone:'',preference:'whatsapp'},{id:'c3',name:'Rafael López',phone:'',preference:'local'},{id:'c4',name:'Isabel Martín',phone:'',preference:'online'}];
 const appointments:Appointment[]=[
  {id:'a1',clientId:'c1',serviceId:'s1',professionalId:'p1',day:today,time:'09:30',channel:'telefono',status:'confirmada'},
  {id:'a2',clientId:'c2',serviceId:'s3',professionalId:'p2',day:today,time:'11:00',channel:'whatsapp',status:'confirmada'},
  {id:'a3',clientId:'c3',serviceId:'s2',professionalId:'p1',day:today,time:'12:00',channel:'local',status:'confirmada'},
  {id:'a4',clientId:'c4',serviceId:'s4',professionalId:'p2',day:shiftDay(today,1),time:'10:30',channel:'online',status:'confirmada'},
  {id:'a5',clientId:'c1',serviceId:'s1',professionalId:'p1',day:shiftDay(today,-21),time:'11:30',channel:'telefono',status:'confirmada'}
 ];
 return {services,professionals,clients,appointments};
}
function isData(v:unknown):v is DemoData{
 if(!v||typeof v!=='object')return false;
 const x=v as Record<string,unknown>;
 return ['services','professionals','clients','appointments'].every(k=>Array.isArray(x[k]));
}
export function loadDemo():DemoData{
 try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){const data:unknown=JSON.parse(raw);if(isData(data))return data}}catch{}
 return seedData();
}
export function persistDemo(db:DemoData):boolean{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(db));return true}catch{return false}}
export function resetDemo():DemoData{try{localStorage.removeItem(STORAGE_KEY)}catch{}return seedData()}
export function confirmed(db:DemoData):Appointment[]{return db.appointments.filter(a=>a.status==='confirmada')}
export function sortedAppointments(db:DemoData,day?:string):Appointment[]{
 return confirmed(db).filter(a=>!day||a.day===day).sort((a,b)=>(a.day+a.time).localeCompare(b.day+b.time));
}
export function conflict(db:DemoData,input:BookingInput,excludeId?:string):boolean{
 const service=db.services.find(s=>s.id===input.serviceId);if(!service)return true;
 const from=timeMinutes(input.time),to=from+service.minutes;
 return confirmed(db).some(a=>{
  if(a.id===excludeId||a.day!==input.day||a.professionalId!==input.professionalId)return false;
  const other=db.services.find(s=>s.id===a.serviceId);if(!other)return false;
  const otherFrom=timeMinutes(a.time),otherTo=otherFrom+other.minutes;
  return from<otherTo&&to>otherFrom;
 });
}
export function saveAppointment(db:DemoData,input:BookingInput,editingId?:string):{ok:boolean;message:string;appointment?:Appointment}{
 if(!db.clients.some(c=>c.id===input.clientId))return {ok:false,message:'Selecciona un cliente.'};
 const service=db.services.find(s=>s.id===input.serviceId);
 if(!service)return {ok:false,message:'Selecciona un servicio.'};
 if(!db.professionals.some(p=>p.id===input.professionalId))return {ok:false,message:'Selecciona un profesional.'};
 if(!/^\d{4}-\d{2}-\d{2}$/.test(input.day)||!Number.isFinite(parseDay(input.day).getTime())||localISO(parseDay(input.day))!==input.day)return {ok:false,message:'Selecciona una fecha válida.'};
 if(!/^\d{2}:\d{2}$/.test(input.time))return {ok:false,message:'Selecciona una hora válida.'};
 const start=timeMinutes(input.time),end=start+service.minutes;
 if(start<8*60||end>21*60||start%5!==0)return {ok:false,message:'Elige un horario entre las 08:00 y las 21:00 que permita completar el servicio.'};
 if(!Object.keys(CHANNEL_LABEL).includes(input.channel))return {ok:false,message:'Selecciona el canal de reserva.'};
 if(conflict(db,input,editingId))return {ok:false,message:'Ese profesional ya tiene una cita en ese horario. Prueba con otra hora.'};
 const previous=editingId?db.appointments.find(a=>a.id===editingId&&a.status==='confirmada'):undefined;
 if(editingId&&!previous)return {ok:false,message:'No se ha encontrado la cita que quieres modificar.'};
 const appointment:Appointment={...input,id:previous?.id??uid(),status:'confirmada'};
 if(previous)Object.assign(previous,appointment);else db.appointments.push(appointment);
 return {ok:true,message:previous?'Cita actualizada.':'Cita guardada.',appointment};
}
export function cancelAppointment(db:DemoData,id:string):boolean{
 const appointment=db.appointments.find(a=>a.id===id&&a.status==='confirmada');
 if(!appointment)return false;appointment.status='cancelada';return true;
}
export function createClient(db:DemoData,name:string,preference:Preference='telefono',phone=''):Client{
 const client:Client={id:uid(),name:name.trim(),phone:phone.trim(),preference};
 db.clients.push(client);return client;
}
export function createService(db:DemoData,name:string,minutes:number,price:number):Service{
 const service:Service={id:uid(),name:name.trim(),minutes,price};db.services.push(service);return service;
}
export function availableTimes(db:DemoData,day:string,professionalId:string,serviceId:string):string[]{
 const times:string[]=[];
 const first=8*60,last=21*60;
 for(let m=first;m<last;m+=30){const time=minutesTime(m);if(!conflict(db,{clientId:'',serviceId,professionalId,day,time,channel:'online'})&&m+(db.services.find(s=>s.id===serviceId)?.minutes??999)<=last)times.push(time)}
 return times;
}
export function latestForClient(db:DemoData,clientId:string):Appointment|undefined{
 return sortedAppointments(db).filter(a=>a.clientId===clientId).sort((a,b)=>(b.day+b.time).localeCompare(a.day+a.time))[0];
}
