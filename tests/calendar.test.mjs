import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarChoose,calendarMove,calendarMoveMonth,calendarSetView,calendarResetForTests,calendarEvents,calendarWidget,calendarPage,calendarSelectedDate} from '../dist/assets/js/ui/calendar.js';
const context={
 session:{userId:'lucia',role:'student'},
 students:[],groups:[],topics:[],materials:[],submissions:[],notices:[],
 assignments:[{id:'a1',dueDate:'2026-11-25',title:'Ejercicios',subject:'Matemáticas'}],
 lessons:[{id:'l1',studentId:'lucia',subject:'Inglés',start:'2026-11-24T17:00:00',end:'2026-11-24T18:00:00'}]
};
test('Calendario organiza las sesiones y los plazos reales y permite navegar al evento',()=>{
 calendarResetForTests('2026-11-24');
 const events=calendarEvents(context);
 assert.equal(events.length,2);assert.equal(events[0].key,'2026-11-24');
 const html=calendarWidget(context,true);
 assert.match(html,/2026-11-24/);assert.match(html,/is-selected/);assert.match(html,/Inglés/);
 assert.match(html,/href="#\/agenda\?dia=2026-11-24"/);
 assert.match(html,/data-action="calendar-prev-month"/);
});
test('Cambia de mes, de semana y de día sin crear registros falsos',()=>{
 calendarResetForTests('2026-11-24');calendarMove(1);
 assert.equal(calendarSelectedDate(),'2026-12-24');
 calendarSetView('week');calendarMove(-1);assert.equal(calendarSelectedDate(),'2026-12-17');
 calendarMoveMonth(-1);assert.equal(calendarSelectedDate(),'2026-11-17');
 calendarChoose('2026-11-25');assert.equal(calendarSelectedDate(),'2026-11-25');
 const html=calendarWidget(context);
 assert.match(html,/Ejercicios/);assert.match(html,/Mes/);assert.match(html,/Semana/);
 assert.match(calendarPage(context),/Próximos eventos|PRÓXIMOS EVENTOS/);
 calendarSetView('month');
});
test('Fecha inválida se ignora y títulos maliciosos se escapan',()=>{
 calendarResetForTests('2026-11-24');calendarChoose('2026-02-30');assert.equal(calendarSelectedDate(),'2026-11-24');
 const hostile={...context,assignments:[{...context.assignments[0],title:'<img src=x onerror=alert(1)>'}]};
 const html=calendarPage(hostile);assert.doesNotMatch(html,/<img src=x/);assert.match(html,/&lt;img src=x/);
});
