import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {seedData,saveAppointment,cancelAppointment,sortedAppointments,createClient,createService,conflict,availableTimes,shiftDay,dayOffset,latestForClient,setHours,addClosure,withinOpeningHours,openingBlocks,weekday} from '../dist/assets/js/booking/model.js';
const mk=()=>seedData('2026-11-23');
const booking=(changes={})=>({clientId:'c1',serviceId:'s1',professionalId:'p1',day:'2026-11-25',time:'10:00',channel:'telefono',...changes});
test('La demo se inicia con una agenda unificada de cuatro canales',()=>{
 const db=mk();assert.equal(db.appointments.filter(a=>a.status==='confirmada').length,5);
 assert.deepEqual(new Set(db.appointments.map(a=>a.channel)),new Set(['telefono','whatsapp','local','online']));
});
test('Se guarda una cita manual sin email ni registro',()=>{
 const db=mk();const before=db.appointments.length;const result=saveAppointment(db,booking());
 assert.equal(result.ok,true);assert.equal(db.appointments.length,before+1);assert.equal(result.appointment.channel,'telefono');
});
test('No permite solapar dos citas del mismo profesional ni aunque vengan de canales distintos',()=>{
 const db=mk();assert.equal(saveAppointment(db,booking()).ok,true);
 const result=saveAppointment(db,booking({time:'10:20',serviceId:'s2',channel:'whatsapp'}));
 assert.equal(result.ok,false);assert.match(result.message,/ya tiene una cita/);
});
test('Permite dos profesionales al mismo tiempo',()=>{
 const db=mk();assert.equal(saveAppointment(db,booking()).ok,true);
 assert.equal(saveAppointment(db,booking({professionalId:'p2',channel:'online'})).ok,true);
});
test('Calcula la duración y respeta citas adyacentes',()=>{
 const db=mk();assert.equal(saveAppointment(db,booking()).ok,true);
 assert.equal(saveAppointment(db,booking({time:'10:30'})).ok,true);
 assert.equal(conflict(db,booking({time:'10:25'})),true);
 assert.equal(conflict(db,booking({time:'11:00'})),false);
});
test('Editar una cita excluye su propio hueco y comprueba otros',()=>{
 const db=mk();const first=saveAppointment(db,booking()).appointment;
 assert.ok(first);assert.equal(saveAppointment(db,booking({time:'10:05'}),first.id).ok,true);
 assert.equal(saveAppointment(db,booking({time:'10:30'})).ok,false);
});
test('Cancelar libera el hueco y no borra el registro',()=>{
 const db=mk();const first=saveAppointment(db,booking()).appointment;assert.ok(first);
 assert.equal(cancelAppointment(db,first.id),true);
 assert.equal(saveAppointment(db,booking({channel:'online'})).ok,true);
 assert.equal(db.appointments.find(a=>a.id===first.id).status,'cancelada');
});
test('Los clientes pueden repetirse con su servicio habitual',()=>{
 const db=mk(),client=createClient(db,'Cliente de prueba','local');
 const result=saveAppointment(db,booking({clientId:client.id,serviceId:'s3'}));
 assert.equal(result.ok,true);assert.equal(latestForClient(db,client.id).serviceId,'s3');
});
test('La edición de servicios cambia la comprobación de duración',()=>{
 const db=mk();const service=createService(db,'Tratamiento de prueba',90,25);
 assert.equal(saveAppointment(db,booking({serviceId:service.id,time:'20:00'})).ok,false);
 assert.equal(saveAppointment(db,booking({serviceId:service.id,time:'18:00'})).ok,true);
});
test('La disponibilidad online y la manual comparten datos y conflictos',()=>{
 const db=mk();const slot='10:00';
 assert.ok(availableTimes(db,'2026-11-25','p1','s1').includes(slot));
 saveAppointment(db,booking());
 assert.ok(!availableTimes(db,'2026-11-25','p1','s1').includes(slot));
 assert.ok(!availableTimes(db,'2026-11-25','p1','s1').includes('10:00'));
});
test('Las fechas se desplazan sin depender de la zona horaria UTC',()=>{
 assert.equal(shiftDay('2026-12-31',1),'2027-01-01');
 assert.match(dayOffset(0),/^\d{4}-\d{2}-\d{2}$/);
});
test('La web pública solo carga la nueva interfaz de citas',()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 assert.match(html,/Unespacio · Agenda de citas/);
 assert.match(html,/booking.css/);
 assert.doesNotMatch(html,/Aula|alumno|enseñanza|refined.css|studio.css/i);
 const boot=readFileSync(new URL('../dist/assets/js/main.js',import.meta.url),'utf8');
 assert.match(boot,/booking\/app\.js/);
});

test('Horarios partidos: no acepta citas durante el descanso de mediodía',()=>{
 const db=mk();assert.equal(weekday('2026-11-25'),3);
 assert.equal(withinOpeningHours(db,'2026-11-25','13:30',30,'p1'),true);
 assert.equal(withinOpeningHours(db,'2026-11-25','14:30',30,'p1'),false);
 assert.equal(saveAppointment(db,booking({time:'14:30'})).ok,false);
});
test('Modificar horario cambia la lista de huecos disponibles',()=>{
 const db=mk();const day='2026-11-25';
 assert.ok(availableTimes(db,day,'p1','s1').includes('11:00'));
 const result=setHours(db,3,[{open:'10:00',close:'12:00'}]);
 assert.equal(result.ok,true);
 assert.equal(availableTimes(db,day,'p1','s1').includes('09:00'),false);
 assert.ok(availableTimes(db,day,'p1','s1').includes('11:00'));
 assert.equal(setHours(db,3,[{open:'10:00',close:'13:00'},{open:'12:00',close:'14:00'}]).ok,false);
});
test('Vacaciones del negocio y ausencias individuales bloquean nuevas citas',()=>{
 const db=mk();const day='2026-11-25';
 assert.equal(addClosure(db,day,'Día festivo','p1').ok,true);
 assert.equal(saveAppointment(db,booking()).ok,false);
 assert.equal(saveAppointment(db,booking({professionalId:'p2'})).ok,true);
 assert.equal(addClosure(db,'2026-11-26','Cerrado').ok,true);
 assert.equal(availableTimes(db,'2026-11-26','p2','s1').length,0);
});
