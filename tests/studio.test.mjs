import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {teacherDashboard,classesPage,classPage,studentList,adminHome} from '../dist/assets/js/ui/views.js';
const snap={session:{userId:'nora',role:'academy-teacher',name:'Nora Reyes',initials:'NR',workspaceId:'c1',workspaceName:'Academia'},students:[{id:'s1',name:'Alumno',level:'ESO',initials:'AL',subjects:['Inglés']}],groups:[{id:'g1',name:'Inglés · 1.º ESO',subject:'Inglés',level:'1.º ESO',color:'blue',studentIds:['s1'],teacherId:'nora',description:'Clase de refuerzo'}],topics:[{id:'t1',groupId:'g1',order:1,title:'Gramática',description:'Oraciones'}],lessons:[{id:'l1',groupId:'g1',subject:'Inglés',start:'2027-11-24T17:00:00',end:'2027-11-24T18:00:00'}],assignments:[{id:'a1',groupId:'g1',topicId:'t1',title:'Actividad',dueDate:'2027-11-25',instructions:'Instrucciones'}],materials:[{id:'m1',groupId:'g1',topicId:'t1',title:'Guía',description:'PDF',kind:'text'}],submissions:[],notices:[]};
test('Dashboard docente deja de repetir tarjetas genéricas e integra calendario interactivo',()=>{
 const html=teacherDashboard(snap);assert.match(html,/work-home-layout/);assert.match(html,/work-calendar-compact/);assert.match(html,/work-classes-grid/);assert.match(html,/Preparar sesión/);
});
test('Las clases mantienen acciones principales y navegación a sesiones',()=>{
 const html=classesPage(snap);assert.match(html,/work-class-identity/);assert.match(html,/Inglés/);assert.match(html,/href="#\/clases\/g1"/);assert.match(html,/\/clases\/g1\?tab=sesiones/);
});
test('Los temas tienen navegación contextual y acceso a crear materiales y tareas',()=>{
 const html=classPage(snap,'g1',new URLSearchParams());assert.match(html,/work-topic-layout/);assert.match(html,/Gramática/);assert.match(html,/Añadir material/);assert.match(html,/Crear actividad/);assert.match(html,/data-action="new-topic"/);
});
test('La compilación referencia el sistema visual nuevo',()=>{
 const css=readFileSync(new URL('../dist/assets/css/studio.css',import.meta.url),'utf8');
 assert.match(css,/\.work-calendar-cell/);assert.match(css,/\.work-topic-layout/);
});

test('Profesor particular trabaja por alumno y no por grupos obligatorios',()=>{
 const html=studentList(snap);assert.match(html,/work-private-home/);assert.match(html,/work-private-student/);assert.match(html,/Nuevo alumno/);assert.match(html,/work-calendar-compact/);
});
test('La administración dispone de grupos y calendario sin crear módulos nuevos',()=>{
 const html=adminHome(snap);assert.match(html,/work-admin-home/);assert.match(html,/Nuevo grupo/);assert.match(html,/work-class/);assert.match(html,/work-calendar-compact/);
});

test('Inicio docente es una vista de trabajo compacta con accesos claros',()=>{const html=teacherDashboard(snap);assert.match(html,/ua-campus-home/);assert.match(html,/ua-next-lesson/);assert.match(html,/ua-review-list/);assert.match(html,/Entrar en clase/);assert.doesNotMatch(html,/work-lesson-feature/);});
test('Cabecera de clase permite programar sesiones y no utiliza un banner de promoción',()=>{const html=classPage(snap,'g1',new URLSearchParams());assert.match(html,/ua-course-heading/);assert.match(html,/Nueva sesión/);assert.doesNotMatch(html,/class="course-hero/);});
