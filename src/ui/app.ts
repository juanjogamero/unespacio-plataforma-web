import type {Gateway,Snapshot,Role,Topic,Assignment,Lesson,Material} from '../core/types.js';
import type {DevelopmentGateway} from '../core/development.js';
import {HttpGateway,HttpError} from '../core/http.js';
import {h,eDate,eTime,studentName} from './helpers.js';
import {icon} from './icons.js';
import {pageView} from './views.js';
import {calendarChoose,calendarMove,calendarMoveMonth,calendarGoToday,calendarSetView} from './calendar.js';
import {safeExternalUrl} from '../core/security.js';
import {applyPreferences,togglePreference} from '../core/preferences.js';

type ModalKind='new-student'|'new-group'|'new-topic'|'edit-topic'|'new-material'|'new-student-material'|'new-assignment'|'new-student-assignment'|'new-lesson'|'prepare'|'grade'|'material';
type Modal={kind:ModalKind;id:string};
const root=document.getElementById('app');
if(!root)throw new Error('No se ha encontrado el contenedor de la aplicación.');
const appRoot:HTMLElement=root;
const btn=(label:string,action:string,id:string,klass:string)=>`<button class="${klass}" type="button" data-action="${action}" data-id="${h(id)}">${label}</button>`;
const isDevelopment=document.documentElement.dataset.environment==='development'&&
 (location.hostname.endsWith('.github.io')||location.protocol==='file:'||['localhost','127.0.0.1','::1'].includes(location.hostname));
const gateway:Gateway=isDevelopment?new (await import('../core/development.js')).DevelopmentGateway():new HttpGateway();
let snapshot:Snapshot|null=null,modal:Modal|null=null,menu:'profile'|'notices'|null=null,toastText='',searchValue='',busy=false;
let lastFocus:HTMLElement|null=null;
let currentRoute='/inicio';
let authError='';
applyPreferences();
function parseRoute(){let hash='/inicio';try{hash=decodeURI(location.hash.slice(1)||'/inicio');}catch{hash='/inicio';}const [path,query]=hash.split('?');return {path:path||'/inicio',qs:new URLSearchParams(query||'')};}
function defaultRoute(s:Snapshot){return s.session.role==='private-teacher'?'/alumnos':s.session.role==='academy-admin'?'/inicio':s.session.role==='student'?'/inicio':'/inicio';}
function navItems(s:Snapshot){const role=s.session.role;
 if(role==='private-teacher')return [{label:'Mis alumnos',url:'/alumnos',ico:'users'},{label:'Agenda',url:'/agenda',ico:'calendar'},{label:'Entregas',url:'/entregas',ico:'tasks'},{label:'Biblioteca',url:'/biblioteca',ico:'folder'}];
 if(role==='academy-admin')return [{label:'Grupos del centro',url:'/inicio',ico:'school'},{label:'Mis clases',url:'/clases',ico:'book'},{label:'Agenda',url:'/agenda',ico:'calendar'},{label:'Entregas',url:'/entregas',ico:'tasks'},{label:'Biblioteca',url:'/biblioteca',ico:'folder'}];
 if(role==='student')return [{label:'Mi aprendizaje',url:'/inicio',ico:'home'},{label:'Mis materias',url:'/materias',ico:'book'},{label:'Mis tareas',url:'/tareas',ico:'tasks'},{label:'Agenda',url:'/agenda',ico:'calendar'}];
 return [{label:'Inicio',url:'/inicio',ico:'home'},{label:'Mis clases',url:'/clases',ico:'school'},{label:'Agenda',url:'/agenda',ico:'calendar'},{label:'Entregas',url:'/entregas',ico:'tasks'},{label:'Biblioteca',url:'/biblioteca',ico:'folder'}];
}
function nav(s:Snapshot){const items=navItems(s);return `<aside class="sidebar"><a href="#${defaultRoute(s)}" class="brand" aria-label="Unespacio, ir al inicio"><span class="brand-symbol"><i></i><i></i><i></i></span><span class="brand-name">unespacio </span></a><div class="sidebar-scroll"><span class="sidebar-section-label">TU ESPACIO</span><nav aria-label="Navegación principal">${items.map((item,i)=>`<a href="#${item.url}" class="nav-item ${currentRoute===item.url||currentRoute.startsWith(`${item.url}/`)?'is-active':''}">${icon(item.ico,19)} <span>${item.label}</span>${item.url==='/entregas'&&s.session.role!=='student'&&s.submissions.some(x=>x.status==='submitted')?`<span class="nav-counter">${s.submissions.filter(x=>x.status==='submitted').length}</span>`:''}</a>${i===3&&items.length>4?'<div class="sidebar-divider"></div><span class="sidebar-section-label">RECURSOS</span>':''}`).join('')}</nav></div><div class="sidebar-bottom"><div class="workspace-badge"><span class="avatar small">${h(s.session.initials)}</span><span><strong>${h(s.session.workspaceName)}</strong><small>${h(s.session.role==='academy-teacher'?'Profesor de academia':s.session.role==='academy-admin'?'Administración':s.session.role==='private-teacher'?'Profesor particular':'Alumno')}</small></span></div></div></aside>`;}
function header(s:Snapshot){const date=new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});return `<header class="topbar"><button class="mobile-menu btn btn-icon" type="button" data-action="mobile-nav" aria-label="Abrir menú">${icon('menu')}</button><div class="search-holder"><label class="sr-only" for="global-search">Buscar en Unespacio</label>${icon('search',18)}<input id="global-search" autocomplete="off" type="search" placeholder="Buscar alumnos, grupos o actividades…" value="${h(searchValue)}"/><div id="search-results" class="search-results" hidden></div></div><div class="top-controls"><span class="top-date">${h(date)}</span><button class="top-icon" type="button" data-action="toggle-notices" aria-label="Ver avisos" aria-expanded="${menu==='notices'}" title="Avisos">${icon('bell')}</button><a href="#/agenda" class="top-icon" aria-label="Ir a agenda" title="Agenda">${icon('calendar')}</a><button class="profile-trigger" type="button" data-action="toggle-profile" aria-expanded="${menu==='profile'}" aria-label="Opciones de cuenta"><span class="avatar small">${h(s.session.initials)}</span>${icon('down',14)}</button></div>${menu==='profile'?`<div class="top-dropdown profile-dropdown" role="menu"><div class="dropdown-user"><span class="avatar">${h(s.session.initials)}</span><div><strong>${h(s.session.name)}</strong><small>${h(s.session.workspaceName)}</small></div></div><a href="#/perfil" role="menuitem">${icon('user',17)} Mi perfil</a><a href="#/configuracion" role="menuitem">${icon('settings',17)} Configuración</a><button class="dropdown-signout" type="button" data-action="sign-out">${icon('rotate',17)} Cerrar sesión</button><div class="dropdown-build">Versión 0.8.1</div></div>`:''}${menu==='notices'?`<div class="top-dropdown notice-dropdown" role="dialog" aria-label="Avisos recientes"><div class="surface-header"><h3>Avisos recientes</h3><button class="btn btn-icon" data-action="close-menu" aria-label="Cerrar avisos">${icon('x',17)}</button></div>${s.notices.length?s.notices.slice(0,5).map(n=>`<div class="notice-compact"><strong>${h(n.title)}</strong><p>${h(n.body)}</p><small>${eDate(n.date)}</small></div>`).join(''):'<p class="muted">Sin avisos recientes.</p>'}</div>`:''}</header>`;}
function formField(name:string,title:string,type='text',value='',extra=''){return `<label class="field"><span>${h(title)}</span><input name="${h(name)}" type="${type}" value="${h(value)}" ${extra}/></label>`;}
function localDateTime(value:Date){const p=(n:number)=>String(n).padStart(2,'0');return value.getFullYear()+'-'+p(value.getMonth()+1)+'-'+p(value.getDate())+'T'+p(value.getHours())+':'+p(value.getMinutes());}
function nextClassTime(){const start=new Date();start.setMinutes(0,0,0);start.setHours(start.getHours()+1);return {start:localDateTime(start),end:localDateTime(new Date(start.getTime()+3600000))};}
function textarea(name:string,title:string,value='',required=false){return `<label class="field"><span>${h(title)}</span><textarea name="${h(name)}" rows="4" ${required?'required':''}>${h(value)}</textarea></label>`;}
function renderModal(s:Snapshot,m:Modal){const suggested=nextClassTime();const group=s.groups.find(g=>g.id===m.id),student=s.students.find(st=>st.id===m.id),topic=s.topics.find(t=>t.id===m.id),lesson=s.lessons.find(l=>l.id===m.id),submission=s.submissions.find(sub=>sub.id===m.id);const assigned=submission&&s.assignments.find(a=>a.id===submission.assignmentId);let title='';let body='';let form='';let submit='Guardar';
 switch(m.kind){
 case 'new-student':title='Añadir alumno';form='student';body=`<p class="muted">Crea una ficha única. Después podrás organizar sus materias y clases.</p>${formField('name','Nombre completo','text','','required minlength="3" maxlength="120"')}${formField('level','Nivel educativo','text','','required maxlength="60"')}${formField('subjects','Materias (separadas por comas)','text','','required placeholder="Matemáticas, Inglés"')}`;submit='Crear ficha de alumno';break;
 case 'new-group':title='Nuevo grupo';form='group';body=`<p class="muted">Organiza una clase para compartir temas y tareas con todo el grupo.</p>${formField('name','Nombre del grupo','text','','required placeholder="Matemáticas · 2.º ESO"')}${formField('subject','Asignatura','text','','required')}${formField('level','Nivel','text','','required')}<label class="field"><span>Profesor asignado</span><select name="teacherId" required><option value="nora">Nora Reyes</option></select></label><label class="field"><span>Color de la clase</span><select name="color"><option value="blue">Azul</option><option value="teal">Turquesa</option><option value="violet">Violeta</option><option value="rose">Coral</option></select></label><fieldset class="field"><legend>Alumnos del grupo</legend><div class="group-student-choices">${s.students.map(st=>`<label><input type="checkbox" name="students" value="${h(st.id)}"> ${h(st.name)} · ${h(st.level)}</label>`).join('')}</div></fieldset>${textarea('description','Descripción (opcional)')}`;submit='Crear grupo';break;
 case 'new-topic':title='Nuevo tema';form='topic';body=`<p class="muted">Organiza los materiales y tareas de ${h(group?.name||'la clase')}.</p>${formField('title','Título del tema','text','', 'required maxlength="100" minlength="2"')}${textarea('description','Descripción (opcional)')}`;submit='Crear tema';break;
 case 'edit-topic':title='Editar tema';form='topic-edit';body=`${formField('title','Título','text',topic?.title||'','required minlength="2" maxlength="100"')}${textarea('description','Descripción',topic?.description||'')}`;submit='Guardar tema';break;
 case 'new-material':case 'new-student-material':title='Añadir material';form='material';body=`<p class="muted">${h(topic?.title||student?.name||'Material educativo')}</p>${formField('title','Título','text','','required maxlength="120"')}<label class="field"><span>Tipo de recurso</span><select name="kind" id="material-kind"><option value="text">Explicación</option><option value="link">Enlace</option><option value="file">Archivo</option></select></label>${textarea('description','Descripción breve')}<div class="material-dynamic"><label class="field"><span>Contenido de la explicación</span><textarea rows="4" name="content"></textarea></label></div>`;submit='Añadir material';break;
 case 'new-assignment':case 'new-student-assignment':title='Crear actividad';form='assignment';body=`<p class="muted">Se publicará ${topic?'para el grupo':'para este alumno'}.</p>${formField('title','Título de la actividad','text','','required maxlength="120"')}${textarea('instructions','Instrucciones','',true)}${formField('dueDate','Fecha de entrega','date','2026-11-26','required')}`;submit='Publicar actividad';break;
 case 'prepare':title=lesson?'Preparar o registrar sesión':'Registrar sesión';form='lesson';body=`<p class="muted">${h(lesson?.subject||'Clase')} · ${lesson?`${eDate(lesson.start)} ${eTime(lesson.start)}`:'Nueva sesión'}</p>${formField('subject','Materia','text',lesson?.subject||'','required')}${formField('start','Inicio','datetime-local',lesson?.start.slice(0,16)||suggested.start,'required')}${formField('end','Final','datetime-local',lesson?.end.slice(0,16)||suggested.end,'required')}${textarea('preparation','Preparación y objetivos',lesson?.preparation||'')}${textarea('summary','Qué se ha trabajado',lesson?.summary||'')}${textarea('nextStep','Para la siguiente sesión',lesson?.nextStep||'')}`;submit='Guardar seguimiento';break;
 case 'new-lesson':title='Registrar sesión';form='lesson';body=`${formField('subject','Materia','text',group?.subject||'','required')}${formField('start','Inicio','datetime-local',suggested.start,'required')}${formField('end','Final','datetime-local',suggested.end,'required')}<label class="field ua-checkbox-field"><span><input type="checkbox" name="recurring"/> Repetir cada semana</span><small>Se programarán las ocho próximas sesiones semanales.</small></label>${textarea('summary','Qué se ha trabajado')}${textarea('nextStep','Para la siguiente sesión')}`;submit='Guardar sesión';break;
 case 'grade':title='Corregir entrega';form='grade';body=`<p class="muted">${h(submission?studentName(s,submission.studentId):'Alumno')} · ${h(assigned?.title||'Actividad')}</p><div class="student-response">${h(submission?.text||'No se ha incluido una respuesta de texto.')}</div>${submission?.fileName?`<p class="submission-attachment">${icon('file',16)} ${h(submission.fileName)} ${btn('Abrir archivo','open-submission',submission.id,'btn btn-outline btn-small')}</p>`:''}${formField('score','Calificación (0–10)','number',submission?.score?.toString()||'','required min="0" max="10" step="0.1"')}${textarea('feedback','Comentario de devolución',submission?.feedback||'')}`;submit='Publicar calificación';break;
 case 'material':{const material=s.materials.find(x=>x.id===m.id);title=material?.title||'Material';body=`<p class="muted">${h(material?.description||'')}</p>${material?.kind==='text'?`<div class="student-response">${h(material.content||'Sin contenido.')}</div>`:material?.kind==='link'?`<p>Enlace externo: ${h(material.url||'')}</p>`:`<p>${h(material?.fileName||'Archivo')}</p><p class="muted">En desarrollo, los archivos ficticios se guardan en este navegador. No utilices documentos reales de alumnos.</p>`}${material?.kind!=='text'?`<div class="form-actions">${btn('Abrir recurso','open-material',m.id,'btn btn-solid')}</div>`:''}`;break;}
 }
 const content=form?`<form data-form="${form}" data-id="${h(m.id)}">${body}<div class="form-actions"><button class="btn btn-outline" type="button" data-action="close-modal">Cancelar</button><button class="btn btn-solid" type="submit">${submit}</button></div></form>`:body;
 return `<div class="modal-backdrop" data-action="close-modal"></div><div class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="dialog-head"><div><span class="eyebrow">UNESPACIO</span><h2 id="modal-title">${title}</h2></div><button class="btn btn-icon" type="button" data-action="close-modal" aria-label="Cerrar ventana">${icon('x')}</button></div>${content}</div>`;}
function render(){if(!snapshot)return;const parsed=parseRoute();currentRoute=parsed.path;const page=pageView(snapshot,parsed.path,parsed.qs);appRoot.innerHTML=`<div class="shell" id="shell">${nav(snapshot)}<div class="main-column">${header(snapshot)}<main class="content" id="main-content" tabindex="-1">${page}</main></div></div><div id="modal-root" class="modal-layer ${modal?'open':''}">${modal?renderModal(snapshot,modal):''}</div><div class="toast ${toastText?'visible':''}" role="status" aria-live="polite">${h(toastText)}</div>`;appRoot.classList.toggle('with-modal',!!modal);if(searchValue)updateSearch();}
function say(message:string){toastText=message;render();setTimeout(()=>{toastText='';const toast=document.querySelector('.toast');if(toast)toast.textContent='';},4000);}
async function reload(message?:string){snapshot=await gateway.getSnapshot();modal=null;menu=null;render();if(message)say(message);}
function openModal(kind:ModalKind,id:string){lastFocus=document.activeElement as HTMLElement;modal={kind,id};menu=null;render();document.querySelector<HTMLElement>('#modal-root input, #modal-root textarea, #modal-root button')?.focus();}
function closeModal(){modal=null;render();lastFocus?.focus({preventScroll:true});}
async function openMaterial(id:string){const m=snapshot?.materials.find(x=>x.id===id);if(!m)return;let url:string|null=null;if(m.kind==='link')url=safeExternalUrl(m.url||'');else if(gateway.openMaterial)url=await gateway.openMaterial(m);if(url){const link=document.createElement('a');link.href=url;link.rel='noopener noreferrer';link.target='_blank';link.click();if(url.startsWith('blob:'))setTimeout(()=>URL.revokeObjectURL(url!),60000);}else say('El archivo estará disponible cuando se conecte el almacenamiento seguro.');}
function updateSearch(){if(!snapshot)return;const panel=document.getElementById('search-results');if(!panel)return;const q=searchValue.toLocaleLowerCase('es-ES').trim();if(!q){panel.hidden=true;return;}
 const results=[...snapshot.groups.map(g=>({label:g.name,details:'Clase',url:`/clases/${g.id}`})),...snapshot.students.map(s=>({label:s.name,details:'Alumno',url:`/alumnos/${s.id}`})),...snapshot.assignments.map(a=>({label:a.title,details:'Actividad',url:`/actividades/${a.id}`}))].filter(x=>x.label.toLocaleLowerCase('es-ES').includes(q)).slice(0,7);
 panel.hidden=false;panel.innerHTML=results.length?results.map(r=>`<a href="#${h(r.url)}"><span><strong>${h(r.label)}</strong><small>${h(r.details)}</small></span>${icon('right',16)}</a>`).join(''):'<div class="search-empty">Sin coincidencias</div>';
}
function validActionTarget(target:EventTarget|null){return target instanceof Element?target.closest<HTMLElement>('[data-action]'):null;}
appRoot.addEventListener('click',async e=>{const target=validActionTarget(e.target);if(!target){if(menu&&!(e.target instanceof Element&&e.target.closest('.top-dropdown'))){menu=null;render();}return;}
 const action=target.dataset.action||'',id=target.dataset.id||'';
 if(action==='calendar-prev'||action==='calendar-next'){calendarMove(action==='calendar-next'?1:-1);render();return;}
 if(action==='calendar-prev-month'||action==='calendar-next-month'){calendarMoveMonth(action==='calendar-next-month'?1:-1);render();return;}
 if(action==='calendar-today'){calendarGoToday();render();return;}
 if(action==='calendar-select'){calendarChoose(id);render();return;}
 if(action==='calendar-view'){calendarSetView(id);render();return;}
 if(action==='close-modal'){closeModal();return;}if(action==='close-menu'){menu=null;render();return;}
 if(action==='toggle-profile'||action==='toggle-notices'){menu=menu===(action==='toggle-profile'?'profile':'notices')?null:action==='toggle-profile'?'profile':'notices';render();return;}
 if(action==='mobile-nav'){document.getElementById('shell')?.classList.toggle('mobile-open');return;}
 if(action==='sign-out'){
  if(isDevelopment){(gateway as DevelopmentGateway).signOut();snapshot=null;menu=null;modal=null;location.hash='';authScreen();return;}
  try{await (gateway as HttpGateway).signOut();snapshot=null;menu=null;modal=null;location.hash='';authScreen();}
  catch(err){say(err instanceof Error?err.message:'No se ha podido cerrar la sesión.');}return;
 }
 if(action==='toggle-density'||action==='toggle-motion'||action==='toggle-large-text'){try{togglePreference(action==='toggle-density'?'compact':action==='toggle-motion'?'reduceMotion':'largeText');applyPreferences();render();say('Preferencia actualizada en este dispositivo.');}catch{say('No se ha podido guardar la preferencia.');}return;}
 if(action==='material'){openModal('material',id);return;}if(action==='open-material'){await openMaterial(id);return;}
 if(action==='open-submission'){
  const sub=snapshot?.submissions.find(x=>x.id===id);
  if(!sub||!gateway.openSubmission)return;
  try{const url=await gateway.openSubmission(sub);
   if(!url){say('El archivo no está disponible en este dispositivo.');return;}
   const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.click();
   if(url.startsWith('blob:'))setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch(err){say(err instanceof Error?err.message:'No se pudo abrir el archivo.');}return;
 }
 if(['new-group','new-student','new-topic','edit-topic','new-material','new-assignment','new-student-material','new-student-assignment','grade','prepare','new-lesson'].includes(action)){openModal(action as ModalKind,id);return;}
});
appRoot.addEventListener('input',e=>{const el=e.target;if(el instanceof HTMLInputElement&&el.id==='global-search'){searchValue=el.value;updateSearch();}});
appRoot.addEventListener('change',e=>{const el=e.target;if(el instanceof HTMLSelectElement&&el.id==='material-kind'){const dynamic=document.querySelector('.material-dynamic');if(!dynamic)return;dynamic.innerHTML=el.value==='text'?`<label class="field"><span>Contenido de la explicación</span><textarea rows="4" name="content"></textarea></label>`:el.value==='link'?`<label class="field"><span>Enlace</span><input name="url" type="url" placeholder="https://..." required></label>`:`<label class="field"><span>Archivo</span><input name="file" type="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp" required><small>PDF, DOCX, TXT o imágenes · Máximo 10 MB.</small></label>`;}});
appRoot.addEventListener('submit',async e=>{const form=e.target;if(!(form instanceof HTMLFormElement))return;e.preventDefault();if(busy)return;
 if(form.dataset.form==='development-login'&&isDevelopment){
  const role=String(new FormData(form).get('role')||'') as Role;
  if(!(['academy-teacher','private-teacher','academy-admin','student'] as string[]).includes(role))return;
  (gateway as DevelopmentGateway).setRole(role);searchValue='';snapshot=await gateway.getSnapshot();modal=null;menu=null;
  location.hash=`#${defaultRoute(snapshot)}`;render();return;
 }

 if(form.dataset.form==='sign-in'){
  if(isDevelopment){authError='El acceso con contraseña estará disponible al conectar el servidor. Para probar el entorno utiliza una de las cuentas de desarrollo.';authScreen();return;}
  const fd=new FormData(form);const email=String(fd.get('email')||'').trim();const password=String(fd.get('password')||'');
  busy=true;try{await (gateway as HttpGateway).signIn(email,password);snapshot=await gateway.getSnapshot();authError='';if(!location.hash)location.hash=`#${defaultRoute(snapshot)}`;render();}
  catch(err){authError=err instanceof Error?err.message:'No se ha podido iniciar sesión.';authScreen();}finally{busy=false;}return;
 }
 busy=true;const data=new FormData(form);const id=form.dataset.id||'',kind=form.dataset.form||'';try{
 if(kind==='student')await gateway.createStudent({name:String(data.get('name')||''),level:String(data.get('level')||''),subjects:String(data.get('subjects')||'').split(',').map(x=>x.trim()).filter(Boolean)});
 else if(kind==='group')await gateway.createGroup({name:String(data.get('name')||''),subject:String(data.get('subject')||''),level:String(data.get('level')||''),teacherId:String(data.get('teacherId')||''),studentIds:data.getAll('students').map(String),color:String(data.get('color')||'blue') as 'blue'|'teal'|'violet'|'rose',description:String(data.get('description')||'')});
 else if(kind==='topic')await gateway.createTopic({groupId:id,title:String(data.get('title')||''),description:String(data.get('description')||'')});
 else if(kind==='topic-edit')await gateway.updateTopic(id,{title:String(data.get('title')||''),description:String(data.get('description')||'')});
 else if(kind==='material'){const topic=snapshot?.topics.find(t=>t.id===id),student=snapshot?.students.find(st=>st.id===id);const materialKind=String(data.get('kind')) as 'text'|'link'|'file';const file=data.get('file');const raw={title:String(data.get('title')||''),description:String(data.get('description')||''),kind:materialKind,...(topic?{groupId:topic.groupId,topicId:topic.id}:{studentId:student?.id,subject:parseRoute().qs.get('materia')||student?.subjects[0]||''}),content:String(data.get('content')||''),url:String(data.get('url')||''),...(file instanceof File&&file.size?{file}:{} )};await gateway.addMaterial(raw);}
 else if(kind==='assignment'){const topic=snapshot?.topics.find(t=>t.id===id),student=snapshot?.students.find(st=>st.id===id);await gateway.addAssignment({title:String(data.get('title')||''),instructions:String(data.get('instructions')||''),dueDate:String(data.get('dueDate')||''),...(topic?{topicId:topic.id,groupId:topic.groupId}:{studentId:student?.id,subject:parseRoute().qs.get('materia')||student?.subjects[0]||''})});}
 else if(kind==='submit'){const file=data.get('file');await gateway.submit({assignmentId:id,text:String(data.get('text')||''),...(file instanceof File&&file.size?{file}:{})});}
 else if(kind==='grade')await gateway.grade({submissionId:id,score:Number(data.get('score')),feedback:String(data.get('feedback')||'')});
 else if(kind==='lesson'){const l=snapshot?.lessons.find(x=>x.id===id),g=snapshot?.groups.find(x=>x.id===id),st=snapshot?.students.find(x=>x.id===id);const payload={subject:String(data.get('subject')||''),start:String(data.get('start')||''),end:String(data.get('end')||''),summary:String(data.get('summary')||''),preparation:String(data.get('preparation')||''),nextStep:String(data.get('nextStep')||''),...(l?.groupId||g?.id?{groupId:l?.groupId||g?.id}:{}),...(l?.studentId||st?.id?{studentId:l?.studentId||st?.id}:{}),recurring:l?!!l.recurring:data.get('recurring')==='on'};if(new Date(payload.end).getTime()<=new Date(payload.start).getTime())throw new Error('La finalización debe ser posterior al inicio.');if(l)await gateway.updateLesson(l.id,payload);else await gateway.saveLesson(payload);}
 await reload(isDevelopment?'Guardado en este dispositivo.':'Cambios guardados correctamente.');
 }catch(error){say(error instanceof Error?error.message:'No se ha podido guardar.');}finally{busy=false;}
});
window.addEventListener('hashchange',()=>{modal=null;menu=null;searchValue='';render();window.scrollTo({top:0,behavior:'instant'});});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(modal){e.preventDefault();closeModal();}else if(menu){menu=null;render();}}if(e.key==='Tab'&&modal){const focusable=[...document.querySelectorAll<HTMLElement>('#modal-root button, #modal-root input, #modal-root textarea, #modal-root select')].filter(x=>!x.hasAttribute('disabled'));if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
function authScreen(message=''){
 const error=authError||message;
 const choices:[Role,string,string][]=[
  ['academy-teacher','Nora Reyes','Profesora de academia'],
  ['private-teacher','Daniel Ruiz','Profesor particular'],
  ['academy-admin','Ana Cortés','Administradora del centro'],
  ['student','Lucía Martín','Alumna']
 ];
 appRoot.innerHTML=`<div class="login-shell">
  <section class="login-aside" aria-label="Bienvenida a Unespacio">
   <div class="login-brand"><span class="brand-symbol"><i></i><i></i><i></i></span><span>unespacio </span></div>
   <div class="login-aside-copy"><span class="login-kicker">EL ESPACIO DE TRABAJO PARA ENSEÑAR</span><h1>Cada clase,<br>en su lugar<span>.</span></h1><p>Alumnos, grupos, sesiones, materiales y tareas. Todo conectado para que puedas centrarte en enseñar.</p></div>
   <div class="login-feature-list" aria-label="Qué puedes hacer en Unespacio">
    <div><span>01</span><strong>Prepara la siguiente sesión</strong><small>Sin perder de vista la anterior.</small></div>
    <div><span>02</span><strong>Comparte materiales y tareas</strong><small>Desde el alumno o desde su grupo.</small></div>
    <div><span>03</span><strong>Continúa donde lo dejaste</strong><small>Una agenda, un espacio, menos pasos.</small></div>
   </div>
   <div class="login-aside-foot">UNESPACIO <span aria-hidden="true">·</span> UN ESPACIO PARA ENSEÑAR</div>
  </section>
  <main class="login-main"><div class="login-panel"><div class="login-top-label"><span class="login-badge">ACCESO A TU ESPACIO</span><span class="login-flourish" aria-hidden="true">✳</span></div>
    <h2>Bienvenido de nuevo.</h2><p class="login-intro">Retoma tus clases justo donde las dejaste.</p>
    ${isDevelopment?`<form class="login-form" data-form="development-login">
       <label for="workspace-account">Cuenta de trabajo
        <select id="workspace-account" name="role" required>${choices.map(([id,name,role])=>`<option value="${h(id)}">${h(name)} · ${h(role)}</option>`).join('')}</select>
       </label>
       <button class="login-submit" type="submit">Acceder al espacio ${icon('right',18)}</button>
      </form><p class="environment-explanation">Acceso de desarrollo con datos ficticios guardados en este dispositivo. No es una cuenta real ni una autenticación segura.</p>`:
      `<form class="login-form" data-form="sign-in" autocomplete="on">
       <label for="signin-email">Correo electrónico<input id="signin-email" type="email" name="email" placeholder="nombre@tuacademia.es" autocomplete="username" required maxlength="254"></label>
       <label for="signin-password">Contraseña<input id="signin-password" type="password" name="password" placeholder="Introduce tu contraseña" autocomplete="current-password" required minlength="8"></label>
       <button class="login-submit" type="submit">Acceder al espacio ${icon('right',18)}</button>
      </form><p class="environment-explanation">Tu acceso será verificado por el servidor de Unespacio. Si no tienes cuenta, contacta con tu centro.</p>`}
    ${error?`<div class="login-error" role="alert">${icon('info',16)}${h(error)}</div>`:''}
    <div class="login-footnote">UNESPACIO <span>·</span> DOCENCIA SIN COMPLICACIONES</div>
   </div></main>
  </div>`;
}
export async function start(){
 if(isDevelopment){
  const dev=gateway as DevelopmentGateway;
  if(dev.getRole()){
   try{snapshot=await gateway.getSnapshot();if(!location.hash)location.hash=`#${defaultRoute(snapshot)}`;render();}catch{snapshot=null;authScreen();}
  }else authScreen();
  return;
 }
 try{snapshot=await gateway.getSnapshot();if(!location.hash)location.hash=`#${defaultRoute(snapshot)}`;render();}
 catch(e){snapshot=null;if(e instanceof HttpError&&e.status===401)authScreen();else authScreen('El servidor de acceso todavía no está disponible. La conexión con el VPS está pendiente.');}
}
