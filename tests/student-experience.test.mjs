import test from 'node:test';
import assert from 'node:assert/strict';
import {studentHome,studentTasksPage,studentSubjectsPage,studentAgendaPage} from '../dist/assets/js/ui/student.js';
import {pageView} from '../dist/assets/js/ui/views.js';
const snapshot={
 session:{userId:'lucia',name:'Lucía Martín',initials:'LM',role:'student',workspaceId:'p1',workspaceName:'Espacio de aprendizaje'},
 students:[{id:'lucia',workspaceId:'p1',name:'Lucía Martín',initials:'LM',level:'2.º ESO',subjects:['Matemáticas','Inglés']}],
 groups:[],topics:[],
 materials:[{id:'m1',studentId:'lucia',subject:'Matemáticas',kind:'text',title:'Apuntes de ecuaciones',description:'Repaso',content:'Despejar x'}],
 assignments:[{id:'a1',studentId:'lucia',subject:'Matemáticas',title:'Ejercicios 4 y 5',dueDate:'2027-11-24',instructions:'Resolver ejercicios',createdBy:'daniel',maxScore:10},{id:'a2',studentId:'lucia',subject:'Inglés',title:'Vocabulario de la unidad',dueDate:'2027-11-26',instructions:'Lista de palabras',createdBy:'daniel',maxScore:10}],
 submissions:[{id:'sb1',assignmentId:'a2',studentId:'lucia',text:'Respuesta',status:'submitted',submittedAt:'2026-11-20T12:00:00'}],
 lessons:[{id:'l1',studentId:'lucia',subject:'Matemáticas',start:'2027-11-24T17:00:00',end:'2027-11-24T18:00:00'}],
 notices:[]
};
test('Inicio del alumno tiene jerarquía propia y acciones navegables',()=>{
 const x=studentHome(snapshot);
 assert.match(x,/study-feature/);assert.match(x,/Tus actividades/);assert.match(x,/Tus materias|Mis materias/);
 assert.match(x,/href="#\/actividades\/a1"/);assert.match(x,/href="#\/agenda"/);
 assert.match(x,/href="#\/materias\?materia=Matem%C3%A1ticas"/);
});
test('Las materias separan materiales y tareas reales por contexto',()=>{
 const math=studentSubjectsPage(snapshot,'Matemáticas');
 assert.match(math,/Apuntes de ecuaciones/);assert.match(math,/Ejercicios 4 y 5/);
 assert.doesNotMatch(math,/Vocabulario de la unidad/);
 const wrong=studentSubjectsPage(snapshot,'Francés');
 assert.match(wrong,/Mis materias/);assert.doesNotMatch(wrong,/Apuntes de ecuaciones/);
});
test('Mis tareas distingue pendientes de enviadas',()=>{
 const x=studentTasksPage(snapshot);
 assert.match(x,/Para entregar/);assert.match(x,/Entregadas y corregidas/);
 assert.match(x,/Ejercicios 4 y 5/);assert.match(x,/Vocabulario de la unidad/);
 assert.match(x,/Entregada/);
});
test('La agenda usa sesiones reales, no estadísticas inventadas',()=>{
 const x=studentAgendaPage(snapshot);
 assert.match(x,/Calendario/);assert.match(x,/Seleccionar día/);assert.match(x,/data-action="calendar-prev"/);assert.match(x,/Matemáticas/);assert.match(x,/17:00/);
 assert.doesNotMatch(x,/leaderboard|gemas|puntos ganados/i);
});
test('La ruta de materias solo existe en perfil alumno',()=>{
 const x=pageView(snapshot,'/materias',new URLSearchParams('materia=Matem%C3%A1ticas'));
 assert.match(x,/Apuntes de ecuaciones/);
 assert.match(pageView({...snapshot,session:{...snapshot.session,role:'academy-teacher'}},'/materias',new URLSearchParams()),/No encontramos esta página/);
});
test('Los títulos introducidos por usuarios se escapan en la interfaz',()=>{
 const attacked={...snapshot,assignments:[{...snapshot.assignments[0],title:'<img src=x onerror=alert(1)>'}]};
 const x=studentHome(attacked);
 assert.doesNotMatch(x,/<img src=x/);
 assert.match(x,/&lt;img src=x/);
});


test('La planificación y los recursos del alumno tienen estructura compacta y acciones reales',()=>{
 const x=studentHome(snapshot);
 assert.match(x,/work-calendar-compact/);
 assert.match(x,/study-util-library/);
 assert.match(x,/work-calendar-grid/);
 assert.match(x,/data-action="calendar-select"/);
 assert.match(x,/work-calendar-agenda/);
 assert.match(x,/data-action="material" data-id="m1"/);
 assert.match(x,/APUNTE/);
 assert.doesNotMatch(x,/study-agenda-rail|study-resources-rail|Las próximas<br>clases/);
});

test('Las clases del alumno son enlaces a su agenda y los materiales conservan el escape de HTML',()=>{
 const broken={...snapshot,materials:[{...snapshot.materials[0],title:'<svg onload=alert(1)>'}]};
 const x=studentHome(broken);
 assert.match(x,/href="#\/agenda"/);
 assert.doesNotMatch(x,/<svg onload=/);
 assert.match(x,/&lt;svg onload=/);
});

test('Alumno tiene inicio compacto con tareas, materias y agenda',()=>{const html=studentHome(snapshot);assert.match(html,/ua-student-home/);assert.match(html,/ua-student-next/);assert.match(html,/ua-learning-grid/);assert.doesNotMatch(html,/study-feature-visual/);});
