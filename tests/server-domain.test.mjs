import test from 'node:test';
import assert from 'node:assert/strict';
import {validSlug,validEmail,validDay,minute,hhmm,daysFrom,weekday,validateWindow,validateHours,isAvailableWindow} from '../server/domain.mjs';
test('La API rechaza slugs, fechas y horas incorrectas',()=>{
 assert.equal(validSlug('barberia-centro'),true);
 assert.equal(validSlug('../../otro'),false);
 assert.equal(validEmail('profesional@example.es'),true);
 assert.equal(validEmail('a@b c'),false);
 assert.equal(validDay('2027-02-29'),false);
 assert.equal(validDay('2028-02-29'),true);
 assert.ok(Number.isNaN(minute('26:10')));
 assert.equal(hhmm(minute('09:45')),'09:45');
 assert.equal(daysFrom('2026-12-31',1),'2027-01-01');
 assert.equal(weekday('2026-11-23'),1);
});
test('Valida turnos partidos y bloquea solapamientos',()=>{
 const good=[{weekday:1,slot:1,open:'09:00',close:'14:00'},{weekday:1,slot:2,open:'16:00',close:'20:00'}];
 assert.equal(validateHours(good).length,2);
 assert.throws(()=>validateHours([...good,{weekday:1,slot:3,open:'13:00',close:'14:30'}]),/solaparse/);
 assert.throws(()=>validateHours([{weekday:2,slot:1,open:'11:00',close:'10:00'}]),/incorrectas/);
 assert.deepEqual(validateWindow('2026-11-23','11:00',30),{start:660,end:690});
});
test('La disponibilidad respeta turnos, cierres y citas confirmadas',()=>{
 const hour=[{weekday:1,open_min:540,close_min:840}];
 const props={day:'2026-11-23',professionalId:'prof',start:600,end:630};
 assert.equal(isAvailableWindow(hour,[],[],props),true);
 assert.equal(isAvailableWindow(hour,[],[],{...props,start:830,end:860}),false);
 assert.equal(isAvailableWindow(hour,[{day:'2026-11-23',professional_id:null}],[],props),false);
 const appt={day:'2026-11-23',professional_id:'prof',start_min:615,end_min:645,status:'confirmada'};
 assert.equal(isAvailableWindow(hour,[],[appt],props),false);
 assert.equal(isAvailableWindow(hour,[],[{...appt,status:'pendiente'}],props),true);
});
