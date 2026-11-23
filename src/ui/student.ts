import type {Assignment,Lesson,Material,Snapshot} from '../core/types.js';
import {h,eDate,eTime,assignmentState} from './helpers.js';
import {icon} from './icons.js';
import {calendarWidget,calendarPage} from './calendar.js';

const anchor=(label:string,path:string,cls='study-inline-link')=>`<a class="${cls}" href="#${path}">${h(label)} ${icon('right',16)}</a>`;
const dateLabel=(iso:string)=>h(eDate(iso));
const subjectColor=(name:string,index=0)=>/mate|f[ií]sica|qu[ií]mica|tecnol/i.test(name)?'math':/ingl|lengua|franc|idioma/i.test(name)?'language':index%2?'language':'science';
const studentSubject=(s:Snapshot)=>s.students.find(st=>st.id===s.session.userId);
const upcoming=(s:Snapshot)=>s.lessons.filter(l=>new Date(l.end).getTime()>=Date.now()).sort((a,b)=>a.start.localeCompare(b.start));
const stateOf=(s:Snapshot,x:Assignment)=>assignmentState(s,x,s.session.userId);
const subjects=(s:Snapshot)=>studentSubject(s)?.subjects||[...new Set([...s.assignments.map(x=>x.subject||''),...s.materials.map(m=>m.subject||'')].filter(Boolean))];
const materiaUrl=(sub:string)=>`/materias?materia=${encodeURIComponent(sub)}`;
const metadata=(a:Assignment)=>`<span>${icon('calendar',14)} Entrega ${dateLabel(a.dueDate)}</span>`;

function studyArtwork(){return `<svg class="study-artwork" viewBox="0 0 370 275" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
 <circle cx="182" cy="136" r="111" fill="#284B75"/><circle cx="182" cy="136" r="92" stroke="#7694BC" stroke-opacity=".28" stroke-width="1.5"/>
 <path d="M66 193L169 218L308 189L205 165L66 193Z" fill="#091D36" fill-opacity=".35"/>
 <path d="M81 81C119 73 151 76 184 89V202C149 188 117 182 81 188V81Z" fill="#EAF4FF"/>
 <path d="M184 89C223 76 260 73 292 82V187C249 181 214 190 184 202V89Z" fill="#FFF9EC"/>
 <path d="M184 92V204" stroke="#95A9C5" stroke-width="3"/>
 <path d="M100 111C129 106 151 110 164 114M100 129C126 124 148 128 164 133M100 147C126 144 148 148 164 152M100 165C129 160 148 166 164 170" stroke="#B5CEE9" stroke-width="5" stroke-linecap="round"/>
 <path d="M205 110C226 103 255 100 270 101M205 132C231 123 254 121 270 121M205 153C226 146 248 144 270 144" stroke="#D8D7CF" stroke-width="5" stroke-linecap="round"/>
 <path d="M265 70L286 32L301 41L279 79L265 88V70Z" fill="#FFB087"/><path d="M286 32L301 41L308 28C311 20 299 13 294 19L286 32Z" fill="#FAE8B2"/><path d="M265 88L279 79L265 70V88Z" fill="#203A5A"/>
 <path d="M54 64L73 44M305 208L324 226M124 33L126 14" stroke="#90D6D0" stroke-width="4" stroke-linecap="round"/>
 <circle cx="310" cy="118" r="5" fill="#FFA87A"/><circle cx="62" cy="154" r="5" fill="#8FDCD8"/>
 </svg>`;}

function taskItem(s:Snapshot,a:Assignment,index:number){
 const state=stateOf(s,a);const status=state==='Pendiente'?'pending':state==='Entregada'?'delivered':'graded';
 return `<a class="study-task-item ${status}" href="#/actividades/${h(a.id)}">
 <span class="study-task-index" aria-hidden="true">${String(index+1).padStart(2,'0')}</span>
 <span class="study-task-main"><span class="study-task-subject">${h(a.subject||'Actividad')}</span><strong>${h(a.title)}</strong><small>${metadata(a)}</small></span>
 <span class="study-status ${status}">${status==='pending'?'Por entregar':state}</span><span class="study-task-arrow">${icon('right',18)}</span>
 </a>`;
}
function lessonItem(l:Lesson){const date=new Date(l.start);return `<li class="study-lesson-item"><span class="study-lesson-date"><b>${h(String(date.getDate()).padStart(2,'0'))}</b><small>${h(date.toLocaleDateString('es-ES',{month:'short'}))}</small></span><div class="study-lesson-body"><strong>${h(l.subject)}</strong><span>${h(eTime(l.start))} · ${h(eDate(l.start,true))}</span></div><span class="study-lesson-dot" aria-hidden="true"></span></li>`;}
/** Sesiones del alumno en formato de agenda de trabajo, con enlace real a la agenda. */
function railLessonItem(l:Lesson,index:number){
 const when=new Date(l.start);
 const day=when.toLocaleDateString('es-ES',{weekday:'short'}).replace('.','');
 return `<li class="study-util-session${index===0?' is-next':''}"><a class="study-util-session-link" href="#/agenda" aria-label="${h(l.subject)}, ${h(eDate(l.start,true))}, ${h(eTime(l.start))}"><time class="study-util-date" datetime="${h(l.start)}"><strong>${h(String(when.getDate()).padStart(2,'0'))}</strong><small>${h(when.toLocaleDateString('es-ES',{month:'short'}).replace('.',''))}</small></time><span class="study-util-session-info"><strong>${h(l.subject)}</strong><small>${h(day)} · ${h(eTime(l.start))}–${h(eTime(l.end))}</small></span><span class="study-util-session-arrow">${icon('right',16)}</span></a></li>`;
}
/** La etiqueta se deriva del recurso; no simula archivos ni permite abrir recursos sin permiso. */
function materialType(m:Material){
 if(m.kind==='link')return 'ENLACE';
 if(m.kind==='text')return 'APUNTE';
 const ext=m.fileName?.split('.').at(-1)?.toUpperCase();
 return ['PDF','DOCX','TXT','JPG','JPEG','PNG','WEBP'].includes(ext||'')?ext!:'ARCHIVO';
}
function materialRailItem(m:Material){
 return `<button type="button" data-action="material" data-id="${h(m.id)}" class="study-util-resource"><span class="study-util-resource-symbol">${icon(m.kind==='link'?'link':m.kind==='file'?'file':'book',19)}</span><span class="study-util-resource-copy"><strong>${h(m.title)}</strong><span><small>${h(m.subject||'Material')}</small><em aria-hidden="true">·</em><small class="study-util-type">${h(materialType(m))}</small></span></span><span class="study-util-resource-arrow">${icon('right',15)}</span></button>`;
}
function subjectItem(s:Snapshot,subject:string,index:number){
 const materialCount=s.materials.filter(m=>m.subject===subject).length;
 const taskCount=s.assignments.filter(a=>a.subject===subject).length;
 return `<a href="#${materiaUrl(subject)}" class="study-subject-item ${subjectColor(subject,index)}"><span class="study-subject-serial">0${index+1} / ASIGNATURA</span><div class="study-subject-main"><span class="study-subject-symbol">${icon(subjectColor(subject,index)==='math'?'layers':'book',26)}</span><strong>${h(subject)}</strong></div><span class="study-subject-description">${materialCount} ${materialCount===1?'material':'materiales'} · ${taskCount} ${taskCount===1?'actividad':'actividades'} <span class="study-subject-arrow">${icon('right',18)}</span></span></a>`;
}
export function studentHome(s:Snapshot):string{
 const firstName=s.session.name.split(' ')[0],student=studentSubject(s);
 const tasks=[...s.assignments].sort((a,b)=>a.dueDate.localeCompare(b.dueDate)),pending=tasks.filter(a=>stateOf(s,a)==='Pendiente');
 const focus=pending[0],focusTitle=focus?.title||'Todo al día';
 const focusDetail=focus?`${focus.subject||'Actividad'} · Entrega ${eDate(focus.dueDate)}`:'No tienes actividades pendientes de entrega.';
 return `<div class="study-home ua-student-home">
  <header class="ua-page-heading"><div><span class="ua-page-context">Mi aprendizaje · ${h(student?.level||'')}</span><h1>Hola, ${h(firstName)}</h1><p>Aquí tienes tus clases, tareas y materiales en un mismo lugar.</p></div><a class="ua-link-control" href="#/agenda">${icon('calendar',18)} Mi agenda</a></header>
  <section class="study-feature ua-student-next" aria-labelledby="study-feature-title"><div class="ua-student-next-icon" aria-hidden="true">${icon('tasks',22)}</div>
   <div class="study-feature-content"><span class="ua-next-eyebrow">${focus?'Tienes una tarea pendiente':'Tu aprendizaje'}</span><h2 id="study-feature-title">${h(focusTitle)}</h2><p>${h(focusDetail)}</p></div>
   <a class="study-feature-cta ua-primary-action" href="#${focus?`/actividades/${encodeURIComponent(focus.id)}`:'/materias'}">${focus?'Abrir actividad':'Ver mis materias'} ${icon('arrow',17)}</a>
  </section>
  <div class="study-main-grid ua-learning-grid"><div class="study-main-column">
   <section class="study-section ua-content-section" aria-labelledby="study-tasks-title"><div class="study-section-heading ua-section-heading"><div><h2 id="study-tasks-title">Tus actividades <span class="ua-count">${pending.length} pendientes</span></h2><p>Revisa lo que tienes que entregar.</p></div>${anchor('Ver todas','/tareas')}</div>
    <div class="study-task-list">${tasks.length?tasks.slice(0,4).map((a,i)=>taskItem(s,a,i)).join(''):`<div class="study-zero">${icon('check',22)}<div><strong>Todo al día</strong><p>No tienes actividades asignadas por ahora.</p></div></div>`}</div>
   </section>
   <section class="study-section ua-content-section" aria-labelledby="study-subject-title"><div class="study-section-heading ua-section-heading"><div><h2 id="study-subject-title">Mis materias</h2><p>Accede a los contenidos de cada asignatura.</p></div>${anchor('Ver materias','/materias')}</div>
    <div class="study-subject-grid ua-student-subjects">${subjects(s).map((sub,i)=>subjectItem(s,sub,i)).join('')||'<p class="ua-empty-line">Todavía no tienes materias asignadas.</p>'}</div>
   </section>
  </div><aside class="study-side-column ua-learning-aside" aria-label="Agenda y materiales">
   ${calendarWidget(s,true)}
   <section class="study-util-block study-util-library" aria-labelledby="study-materials-title"><div class="study-util-head"><div><h2 id="study-materials-title">Materiales recientes</h2></div><span class="study-util-counter">${s.materials.length}</span></div>
    <p class="study-util-subtitle">Apuntes, documentos y enlaces para estudiar.</p><div class="study-util-resources">${s.materials.length?s.materials.slice(0,4).map(materialRailItem).join(''):'<p class="study-util-empty">Tus materiales aparecerán aquí.</p>'}</div>${anchor('Ver todas mis materias','/materias','study-util-footer')}
   </section>
  </aside></div></div>`;
}
export function studentTasksPage(s:Snapshot):string{
 const sorted=[...s.assignments].sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
 const pending=sorted.filter(a=>stateOf(s,a)==='Pendiente');const done=sorted.filter(a=>stateOf(s,a)!=='Pendiente');
 return `<div class="study-home study-subpage"><header class="study-home-header"><div><span class="study-overline">MI ACTIVIDAD</span><h1>Mis tareas<span class="study-wave">.</span></h1><p>Lo que tienes por hacer y todo lo que ya has entregado.</p></div>${anchor('Volver al inicio','/inicio')}</header><div class="study-subpage-layout"><div><section class="study-section"><div class="study-section-heading"><div><span class="study-overline">POR HACER</span><h2>Para entregar <span class="study-heading-count">${pending.length}</span></h2></div></div><div class="study-task-list">${pending.length?pending.map((a,i)=>taskItem(s,a,i)).join(''):`<div class="study-zero">${icon('check',22)}<div><strong>¡Todo al día!</strong><p>No tienes tareas sin entregar.</p></div></div>`}</div></section><section class="study-section"><div class="study-section-heading"><div><span class="study-overline">HISTORIAL</span><h2>Entregadas y corregidas</h2></div></div><div class="study-task-list">${done.length?done.map((a,i)=>taskItem(s,a,i)).join(''):'<p class="study-muted">Aquí aparecerán tus entregas.</p>'}</div></section></div><aside class="study-sidebar-note"><span class="study-overline">TU ORGANIZACIÓN</span><h3>Todo en orden, sin perder el hilo.</h3><p>Abre una tarea para leer las instrucciones, adjuntar una respuesta o consultar la devolución de tu profesor.</p>${anchor('Consultar agenda','/agenda')}</aside></div></div>`;
}
export function studentSubjectsPage(s:Snapshot,selected=''):string{
 const list=subjects(s);const valid=list.includes(selected)?selected:'';
 const mats=valid?s.materials.filter(m=>m.subject===valid):[];
 const tasks=valid?s.assignments.filter(a=>a.subject===valid):[];
 const lessons=valid?s.lessons.filter(l=>l.subject===valid):[];
 return `<div class="study-home study-subpage"><header class="study-home-header"><div><span class="study-overline">TU APRENDIZAJE</span><h1>${valid?h(valid):'Mis materias'}<span class="study-wave">.</span></h1><p>${valid?'Consulta los recursos, tareas y clases de esta materia.':'Elige una asignatura para continuar aprendiendo.'}</p></div>${valid?anchor('Todas mis materias','/materias'):anchor('Ir al inicio','/inicio')}</header>${!valid?`<div class="study-subject-grid study-subject-overview">${list.map((sub,i)=>subjectItem(s,sub,i)).join('')||'<div class="study-zero">Todavía no tienes materias asignadas.</div>'}</div>`:
 `<div class="study-subpage-layout"><div><section class="study-section"><div class="study-section-heading"><div><span class="study-overline">CONTENIDO DE LA MATERIA</span><h2>Materiales</h2></div></div><div class="study-resource-collection">${mats.length?mats.map(m=>`<button type="button" class="study-resource-row" data-action="material" data-id="${h(m.id)}"><span class="study-resource-mark">${icon(m.kind==='link'?'link':m.kind==='file'?'file':'book',23)}</span><span><strong>${h(m.title)}</strong><small>${h(m.description||'Material de estudio')}</small></span>${icon('right',18)}</button>`).join(''):`<div class="study-zero">Sin materiales publicados todavía.</div>`}</div></section><section class="study-section"><div class="study-section-heading"><div><span class="study-overline">TRABAJO DEL CURSO</span><h2>Actividades</h2></div></div><div class="study-task-list">${tasks.length?tasks.map((a,i)=>taskItem(s,a,i)).join(''):'<div class="study-zero">No hay actividades en esta materia.</div>'}</div></section></div><aside class="study-sidebar-note"><span class="study-overline">PRÓXIMAS SESIONES</span><h3>${h(valid)}</h3><ol class="study-lesson-list">${lessons.length?[...lessons].sort((a,b)=>a.start.localeCompare(b.start)).slice(0,4).map(lessonItem).join(''):'<li class="study-rail-empty">No hay clases programadas.</li>'}</ol>${anchor('Ver agenda','/agenda')}</aside></div>`}</div>`;
}
export function studentAgendaPage(s:Snapshot):string{return calendarPage(s);}
