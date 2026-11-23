import {CHANNEL_LABEL,availableTimes,cancelAppointment,createClient,createService,dayOffset,formatDay,latestForClient,loadDemo,persistDemo,resetDemo,saveAppointment,seedData,shiftDay,sortedAppointments,timeMinutes,minutesTime,setHours,addClosure,weekday,WEEKDAYS,addWaitEntry,availableWaitMatches,nextDayReminders,tomorrowSummary,type BookingInput,type Channel,type DemoData,type Preference} from './model.js';

type Page='agenda'|'clientes'|'servicios'|'reservar'|'horarios'|'automatizaciones';
type Dialog={kind:'cita';id?:string;prefill?:Partial<BookingInput>}|{kind:'cliente';id?:string}|{kind:'servicio';id?:string}|null;
const app=document.getElementById('app');
let db:DemoData=loadDemo();
let page:Page='agenda';
let day=dayOffset();
let professionalFilter='todos';
let calendarMode:'dia'|'semana'='dia';
let dialog:Dialog=null;
let flash='';
let onlineService=db.services[0]?.id??'';
let onlineProfessional=db.professionals[0]?.id??'';
let onlineDay=dayOffset(1);
let onlineTime='';
let onlineName='';
const esc=(value:unknown):string=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]??ch));
const icon=(name:string):string=>{
 const shapes:Record<string,string>={
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  scissors:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.12 8.12 21 21M14 10l7-7M8.12 15.88 11 13"/>',
  link:'<rect x="3" y="10" width="18" height="11" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  left:'<path d="m15 18-6-6 6-6"/>',
  right:'<path d="m9 18 6-6-6-6"/>',
  phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.7L7.2 10a16 16 0 0 0 6.8 6.8l1.6-1.8a2 2 0 0 1 1.7-.6l3 .5A2 2 0 0 1 22 16.9z"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  edit:'<path d="M12 20h9M16 4l4 4L9 19l-5 1 1-5L16 4z"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  spark:'<path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
  rotate:'<path d="M3 11a9 9 0 1 1 2.1 6M3 4v7h7"/>'
 };
 return '<svg class="ico" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(shapes[name]??shapes.calendar)+'</svg>';
};
const labelChannel=(channel:Channel)=>CHANNEL_LABEL[channel];
const serviceName=(id:string)=>db.services.find(s=>s.id===id)?.name??'Servicio';
const professionalName=(id:string)=>db.professionals.find(p=>p.id===id)?.name??'Profesional';
const clientName=(id:string)=>db.clients.find(c=>c.id===id)?.name??'Cliente';
const currency=(amount:number)=>amount.toLocaleString('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0});
const selectable=(items:{id:string;name:string}[],current:string)=>items.map(x=>'<option value="'+esc(x.id)+'"'+(x.id===current?' selected':'')+'>'+esc(x.name)+'</option>').join('');
const sortedToday=()=>sortedAppointments(db,day).filter(a=>professionalFilter==='todos'||a.professionalId===professionalFilter);
const count=(source:Channel)=>sortedAppointments(db,day).filter(a=>a.channel===source).length;
function announcement(message:string){flash=message;render()}
function setPage(next:Page){page=next;dialog=null;window.location.hash='/'+next;render()}
function routePage():Page{const hash=location.hash.replace(/^#\/?/,'');return ['agenda','clientes','servicios','reservar','horarios','automatizaciones'].includes(hash)?hash as Page:'agenda'}
function shell():string{
 const routes:{id:Page;title:string;icon:string}[]=[{id:'agenda',title:'Agenda',icon:'calendar'},{id:'clientes',title:'Clientes',icon:'users'},{id:'servicios',title:'Servicios',icon:'scissors'},{id:'reservar',title:'Reserva online',icon:'link'},{id:'horarios',title:'Horarios',icon:'clock'},{id:'automatizaciones',title:'Automatizaciones',icon:'spark'}];
 const nav=routes.map(r=>'<button type="button" class="nav-link '+(page===r.id?'active':'')+'" data-page="'+r.id+'" '+(page===r.id?'aria-current="page"':'')+'>'+icon(r.icon)+'<span>'+r.title+'</span></button>').join('');
 const titles:Record<Page,string>={agenda:'Agenda de citas',clientes:'Clientes habituales',servicios:'Servicios',reservar:'Reserva online',horarios:'Horarios y cierres',automatizaciones:'Automatizaciones'};
 const content=page==='agenda'?agendaView():page==='clientes'?clientsView():page==='servicios'?servicesView():page==='horarios'?hoursView():page==='automatizaciones'?automationsView():onlineView();
 return '<div class="app-shell"><aside class="sidebar"><div class="brand"><span class="brand-mark" aria-hidden="true"></span><span>unespacio<small>GESTIÓN DE CITAS</small></span></div><div class="place-card"><span class="place-dot"></span><div><strong>'+esc(db.settings.name)+'</strong><small>Negocio de demostración</small></div></div><p class="nav-label">TU ESPACIO</p><nav aria-label="Navegación principal">'+nav+'</nav><div class="sidebar-bottom"><div class="quiet-mark">'+icon('check')+' Sin complicaciones</div><small>Unespacio · versión de prueba</small></div></aside>'+
 '<div class="workspace"><div class="mobile-brand"><span class="brand-mark"></span><strong>unespacio</strong><span class="demo-tag">DEMO</span></div><header class="topbar"><div class="breadcrumb">MI NEGOCIO <span>/</span> <strong>'+titles[page]+'</strong></div><div class="top-actions"><span class="date-label">'+esc(formatDay(day,{day:'numeric',month:'short',year:'numeric'}))+'</span><span class="avatar" aria-label="Negocio de demostración">BB</span></div></header>'+
 '<div class="demo-note" role="note">'+icon('spark')+' <span><strong>Entorno de demostración.</strong> Los nombres son ficticios y los cambios se guardan solo en este navegador. No introduzcas datos reales.</span><button type="button" data-action="reset" title="Restablecer datos de ejemplo">'+icon('rotate')+'<span>Reiniciar demo</span></button></div>'+
 '<main class="main-content" id="main-content">'+content+'</main><div class="mobile-nav" aria-label="Navegación móvil">'+nav+'</div></div>'+
 (dialog?dialogView():'')+(flash?'<div class="toast" role="status">'+icon('check')+' '+esc(flash)+'</div>':'')+'</div>';
}
function pageHeading(kicker:string,title:string,description:string,action=''):string{return '<section class="page-heading"><div><span class="kicker">'+kicker+'</span><h1>'+title+'</h1><p>'+description+'</p></div>'+action+'</section>'}
function agendaView():string{
 const appointments=sortedToday();
 const monday=shiftDay(day,-((weekday(day)+6)%7));
 const weekDays=Array.from({length:7},(_,i)=>shiftDay(monday,i));
 const weekCards=weekDays.map(date=>{const listed=sortedAppointments(db,date).filter(a=>professionalFilter==='todos'||a.professionalId===professionalFilter);return '<button type="button" class="week-day '+(day===date?'selected':'')+'" data-action="select-day" data-day="'+date+'"><span>'+esc(formatDay(date,{weekday:'short'}))+'</span><strong>'+esc(formatDay(date,{day:'numeric'}))+'</strong><small>'+listed.length+' cita'+(listed.length!==1?'s':'')+'</small>'+listed.slice(0,3).map(a=>'<em>'+esc(a.time)+' · '+esc(clientName(a.clientId))+'</em>').join('')+'</button>'}).join('');
 const action='<button class="button primary hero-button" data-action="new" type="button">'+icon('plus')+' Nueva cita</button>';
 const stats='<div class="stat-grid"><div class="stat"><span>Citas del día</span><strong>'+appointments.length+'</strong><small>En la agenda seleccionada</small></div><div class="stat"><span>Por teléfono</span><strong>'+count('telefono')+'</strong><small>Sin cuenta ni aplicación</small></div><div class="stat"><span>Desde WhatsApp</span><strong>'+count('whatsapp')+'</strong><small>Registradas a mano</small></div><div class="stat"><span>Clientes habituales</span><strong>'+db.clients.length+'</strong><small>Con atención cercana</small></div></div>';
 const controls='<div class="calendar-controls"><div class="view-switch" role="group" aria-label="Vista de agenda"><button type="button" data-action="view-day" class="'+(calendarMode==='dia'?'selected':'')+'" aria-pressed="'+(calendarMode==='dia')+'">Día</button><button type="button" data-action="view-week" class="'+(calendarMode==='semana'?'selected':'')+'" aria-pressed="'+(calendarMode==='semana')+'">Semana</button></div><div class="date-nav"><button aria-label="Día anterior" type="button" data-action="prev">'+icon('left')+'</button><input id="agenda-day" type="date" aria-label="Seleccionar día" value="'+esc(day)+'"><button aria-label="Día siguiente" type="button" data-action="next">'+icon('right')+'</button><button type="button" class="today-button" data-action="today">Hoy</button></div><label class="compact-select">Profesional <select id="agenda-professional"><option value="todos">Todos</option>'+selectable(db.professionals,professionalFilter)+'</select></label></div>';
 const rows=appointments.map(a=>{
  const client=db.clients.find(c=>c.id===a.clientId);
  const service=db.services.find(s=>s.id===a.serviceId);
  const duration=service?.minutes??30;
  const end=minutesTime(timeMinutes(a.time)+duration);
  return '<article class="appointment"><div class="appointment-time"><strong>'+esc(a.time)+'</strong><small>'+end+'</small></div><div class="appointment-line"></div><div class="appointment-detail"><div class="appointment-top"><strong>'+esc(client?.name??'Cliente')+'</strong><span class="channel channel-'+a.channel+'">'+labelChannel(a.channel)+'</span></div><div class="appointment-sub">'+esc(service?.name??'Servicio')+' <span>·</span> '+duration+' min <span>·</span> '+esc(professionalName(a.professionalId))+'</div><div class="appointment-actions"><button type="button" data-action="edit" data-id="'+esc(a.id)+'">'+icon('edit')+' Editar</button><button type="button" data-action="copy" data-id="'+esc(a.id)+'">'+icon('copy')+' Copiar confirmación</button><button type="button" data-action="cancel" data-id="'+esc(a.id)+'">Cancelar</button></div></div></article>';
 }).join('');
 const firstProfessional=professionalFilter==='todos'?(db.professionals[0]?.id??''):professionalFilter;
 const defaultService=db.services[0]?.id??'';
 const slots=availableTimes(db,day,firstProfessional,defaultService).filter(t=>timeMinutes(t)>=9*60&&timeMinutes(t)<=18*60).slice(0,9);
 const slotButtons=slots.map(t=>'<button class="slot" type="button" data-action="slot" data-time="'+esc(t)+'">'+esc(t)+'</button>').join('');
 return pageHeading('TODO EN UN MISMO LUGAR','Cada cita, en su sitio.','Teléfono, WhatsApp, en persona y online. Tus reservas se organizan en una sola agenda.',action)+stats+
 '<div class="agenda-layout"><section class="panel"><div class="panel-head"><div><span class="kicker">TU DÍA</span><h2>'+esc(formatDay(day))+'</h2></div><span class="count-pill">'+appointments.length+' citas</span></div>'+controls+
 (calendarMode==='semana'?'<div class="week-overview">'+weekCards+'</div>':'')+'<div class="appointment-list">'+(rows||'<div class="empty-state">'+icon('calendar')+'<h3>Este día está despejado</h3><p>Añade una cita por teléfono, WhatsApp o en persona en pocos pasos.</p><button class="button secondary" data-action="new">Crear una cita</button></div>')+'</div></section>'+
 '<aside class="aside-stack"><section class="panel quick-panel"><span class="kicker">EN POCOS TOQUES</span><h2>Reserva un hueco</h2><p>Selecciona una hora libre para '+esc(professionalName(firstProfessional))+'. Podrás completar el cliente y el servicio después.</p><div class="slot-grid">'+(slotButtons||'<p class="muted">No hay huecos disponibles con el servicio de referencia.</p>')+'</div><small>Huecos orientativos para '+esc(serviceName(defaultService))+'. La disponibilidad se vuelve a comprobar al guardar.</small></section>'+
 '<section class="panel help-panel"><span class="kicker">PARA TODOS TUS CLIENTES</span><h2>Ellos reservan como siempre.</h2><p>Tú solo necesitas apuntarlo una vez.</p><div class="channel-guide"><span>'+icon('phone')+' Por teléfono</span><span>◉ WhatsApp</span><span>⌂ En el local</span><span>↗ Online (demo)</span></div></section></aside></div>';
}
function clientsView():string{
 const cards=db.clients.slice().sort((a,b)=>a.name.localeCompare(b.name,'es')).map(client=>{
  const previous=latestForClient(db,client.id);
  return '<article class="client-card" data-client-card data-search="'+esc(client.name.toLowerCase())+'"><div class="client-avatar">'+esc(client.name.split(/\s+/).map(n=>n[0]).slice(0,2).join('').toUpperCase())+'</div><div class="client-details"><strong>'+esc(client.name)+'</strong><small>Prefiere '+esc(labelChannel(client.preference).toLowerCase())+'</small><p>'+(previous?'Última cita registrada: '+esc(formatDay(previous.day,{day:'numeric',month:'short',year:'numeric'}))+' · '+esc(serviceName(previous.serviceId)):'Sin citas anteriores')+'</p><div class="client-actions"><button data-action="repeat" data-id="'+esc(client.id)+'">'+icon('rotate')+' Repetir cita</button><button data-action="client-edit" data-id="'+esc(client.id)+'">'+icon('edit')+' Editar ficha</button></div></div></article>';
 }).join('');
 return pageHeading('RELACIONES DE CONFIANZA','Clientes habituales','Sus preferencias y servicios, sin pedirles que descarguen una aplicación.','<button class="button primary" data-action="client-new">'+icon('plus')+' Añadir cliente</button>')+
 '<div class="panel client-panel"><div class="panel-head"><div><span class="kicker">DIRECTORIO</span><h2>'+db.clients.length+' clientes</h2></div><label class="search-field"><span class="sr-only">Buscar cliente</span><input type="search" id="client-search" placeholder="Buscar por nombre…"></label></div><div class="client-grid">'+cards+'</div><div class="empty-search" hidden>No hay clientes con ese nombre.</div></div>';
}
function servicesView():string{
 const cards=db.services.map(s=>'<article class="service-card"><div class="service-icon">'+icon('scissors')+'</div><h3>'+esc(s.name)+'</h3><p>'+icon('clock')+' '+s.minutes+' minutos</p><strong>'+currency(s.price)+'</strong><button type="button" data-action="service-edit" data-id="'+esc(s.id)+'">Editar servicio '+icon('right')+'</button></article>').join('');
 const people=db.professionals.map(p=>'<div class="professional-card"><span class="professional-avatar">'+esc(p.initials)+'</span><div><strong>'+esc(p.name)+'</strong><small>Profesional del ejemplo</small></div></div>').join('');
 return pageHeading('ORGANIZA TU NEGOCIO','Servicios y equipo','Define cuánto dura cada servicio para evitar que dos citas se solapen.','<button class="button primary" data-action="service-new">'+icon('plus')+' Añadir servicio</button>')+
 '<section class="panel list-panel"><div class="panel-head"><div><span class="kicker">CATÁLOGO</span><h2>Servicios disponibles</h2></div><span class="count-pill">'+db.services.length+' servicios</span></div><div class="service-grid">'+cards+'</div></section>'+
 '<section class="panel list-panel"><div class="panel-head"><div><span class="kicker">EQUIPO DE EJEMPLO</span><h2>Profesionales</h2></div></div><div class="professional-grid">'+people+'</div><p class="muted footer-note">Esta primera demostración incluye dos profesionales ficticios. La gestión completa del equipo quedará para una fase posterior.</p></section>';
}
function hoursView():string{
 const days=[1,2,3,4,5,6,0];
 const rows=days.map(d=>{
  const blocks=db.settings.hours[String(d)]??[];
  const b1=blocks[0],b2=blocks[1];
  return '<div class="hours-row"><strong>'+WEEKDAYS[d]+'</strong><div class="hours-times">'+
   '<label><span>Desde</span><input aria-label="Apertura de '+WEEKDAYS[d]+'" type="time" name="open1_'+d+'" value="'+(b1?.open??'')+'"></label><label><span>Hasta</span><input aria-label="Cierre de '+WEEKDAYS[d]+'" type="time" name="close1_'+d+'" value="'+(b1?.close??'')+'"></label>'+
   '<label><span>Desde (tarde)</span><input type="time" name="open2_'+d+'" value="'+(b2?.open??'')+'"></label><label><span>Hasta (tarde)</span><input type="time" name="close2_'+d+'" value="'+(b2?.close??'')+'"></label>'+
   '</div></div>';
 }).join('');
 const closures=db.settings.closures.slice().sort((a,b)=>a.day.localeCompare(b.day)).map(c=>'<div class="closure-item"><span><strong>'+esc(formatDay(c.day))+'</strong><small>'+esc(c.reason)+' · '+(c.professionalId?esc(professionalName(c.professionalId)):'Todo el negocio')+'</small></span><button data-action="closure-remove" data-id="'+esc(c.id)+'" aria-label="Eliminar cierre '+esc(c.day)+'">'+icon('x')+' Quitar</button></div>').join('');
 return pageHeading('DISPONIBILIDAD REALISTA','Horarios y descansos','Organiza turnos partidos, días libres y vacaciones. Los huecos online y las citas manuales respetarán estos horarios.', '')+
 '<div class="settings-layout"><section class="panel settings-panel"><span class="kicker">DATOS DEL NEGOCIO</span><h2>Tu establecimiento</h2><form id="business-form" class="settings-form"><label class="field">Nombre comercial<input name="name" type="text" maxlength="70" value="'+esc(db.settings.name)+'" required></label><p class="muted">Este nombre aparece en las confirmaciones y en la reserva online simulada.</p><button class="button secondary" type="submit">Guardar nombre</button></form></section>'+
 '<section class="panel settings-panel hours-panel"><span class="kicker">JORNADA HABITUAL</span><h2>Horario semanal</h2><p class="muted">Deja un turno vacío cuando el negocio esté cerrado. Puedes indicar mañana y tarde por separado.</p><form id="hours-form"><div class="hours-list">'+rows+'</div><p class="dialog-error" role="alert"></p><button class="button primary" type="submit">'+icon('check')+' Guardar horarios</button></form></section>'+
 '<section class="panel settings-panel"><span class="kicker">VACACIONES Y AUSENCIAS</span><h2>Bloquear una fecha</h2><p class="muted">Evita que entren nuevas citas mientras estés cerrado o un profesional esté ausente. Las citas ya existentes no se cancelan automáticamente.</p><form id="closure-form"><div class="form-grid"><label class="field">Día<input name="day" type="date" min="'+dayOffset()+'" value="'+dayOffset(1)+'"></label><label class="field">A quién afecta<select name="professionalId"><option value="">Todo el negocio</option>'+selectable(db.professionals,'')+'</select></label></div><label class="field">Motivo<input name="reason" maxlength="120" placeholder="Ej.: vacaciones, festivo"></label><p class="dialog-error" role="alert"></p><button class="button secondary" type="submit">'+icon('plus')+' Añadir bloqueo</button></form><div class="closure-list">'+(closures||'<p class="muted">No hay cierres especiales registrados.</p>')+'</div></section></div>';
}

function automationsView():string{
 const reminders=nextDayReminders(db);
 const waiting=db.waitlist.filter(w=>w.active);
 const matches=availableWaitMatches(db);
 const actions=[
  {key:'reminders' as const,title:'Recordatorios de citas',description:'Prepara recordatorios para las citas de mañana sin redactarlos uno por uno.',icon:'clock',count:reminders.length+' para mañana'},
  {key:'dailySummary' as const,title:'Resumen diario',description:'Toda la agenda de mañana preparada en un mensaje para el responsable.',icon:'calendar',count:sortedAppointments(db,shiftDay(dayOffset(),1)).length+' citas mañana'},
  {key:'waitlist' as const,title:'Recuperar huecos cancelados',description:'Detecta qué clientes de la lista de espera podrían aprovechar un hueco libre.',icon:'users',count:matches.length+' oportunidades'}
 ];
 const cards=actions.map(a=>'<article class="automation-feature"><div class="automation-icon">'+icon(a.icon)+'</div><div class="automation-content"><h3>'+a.title+'</h3><p>'+a.description+'</p><span class="automation-count">'+a.count+'</span></div><button type="button" class="automation-switch '+(db.automation[a.key]?'on':'')+'" data-action="automation-toggle" data-key="'+a.key+'" aria-pressed="'+db.automation[a.key]+'">'+(db.automation[a.key]?'Activada':'Desactivada')+'</button></article>').join('');
 const reminderCards=reminders.map(a=>'<article class="automation-task"><span class="task-marker">'+icon('clock')+'</span><div><strong>'+esc(clientName(a.clientId))+'</strong><small>'+a.time+' · '+esc(serviceName(a.serviceId))+' · '+esc(professionalName(a.professionalId))+'</small></div><button type="button" data-action="automation-copy" data-kind="reminder" data-id="'+esc(a.id)+'">'+icon('copy')+' Copiar mensaje</button></article>').join('');
 const matchCards=matches.map(m=>'<article class="automation-task"><span class="task-marker">'+icon('check')+'</span><div><strong>'+esc(clientName(m.entry.clientId))+'</strong><small>'+esc(formatDay(m.entry.day))+' a las '+esc(m.time)+' · '+esc(serviceName(m.entry.serviceId))+'</small></div><button type="button" data-action="automation-copy" data-kind="wait" data-id="'+esc(m.entry.id)+'">'+icon('copy')+' Preparar aviso</button></article>').join('');
 const waitingCards=waiting.map(w=>'<div class="waitlist-row"><div><strong>'+esc(clientName(w.clientId))+'</strong><small>'+esc(formatDay(w.day))+' · '+w.from+'–'+w.to+' · '+esc(serviceName(w.serviceId))+' · '+esc(professionalName(w.professionalId))+'</small></div><button type="button" data-action="wait-remove" data-id="'+esc(w.id)+'" aria-label="Retirar de la lista de espera">'+icon('x')+' Quitar</button></div>').join('');
 const select=(items:{id:string;name:string}[])=>items.map(i=>'<option value="'+esc(i.id)+'">'+esc(i.name)+'</option>').join('');
 return pageHeading('QUE TU AGENDA TRABAJE POR TI','Automatizaciones útiles','Menos tiempo escribiendo mensajes y más huecos aprovechados, sin obligar a tus clientes a utilizar tecnología.',
 '<span class="preview-tag">SIMULACIÓN INTERACTIVA</span>')+
 '<div class="automation-warning">'+icon('spark')+' <span><strong>Esta demostración no envía correos ni WhatsApps.</strong> Genera propuestas y mensajes para copiar. El servidor privado podrá enviar correos de forma automática solo cuando se configure el servicio de correo y exista autorización del destinatario.</span></div>'+
 '<div class="automation-features">'+cards+'</div>'+
 '<div class="automation-grid"><section class="panel automation-panel"><div class="panel-head"><div><span class="kicker">SIGUIENTE DÍA</span><h2>Recordatorios preparados</h2></div><span class="count-pill">'+reminders.length+'</span></div><div class="automation-tasks">'+(reminderCards||'<p class="muted">No hay citas para recordar mañana.</p>')+'</div><div class="automation-foot"><button type="button" class="button secondary" data-action="automation-copy" data-kind="summary">'+icon('copy')+' Copiar resumen de mañana</button></div></section>'+
 '<section class="panel automation-panel"><div class="panel-head"><div><span class="kicker">SIN PERDER UNA OPORTUNIDAD</span><h2>Huecos recuperables</h2></div><span class="count-pill">'+matches.length+'</span></div><div class="automation-tasks">'+(matchCards||'<p class="muted">Cuando canceles una cita y coincida con alguien en lista de espera, aparecerá aquí una propuesta de aviso.</p>')+'</div><p class="automation-foot muted">Un aviso no reserva automáticamente el hueco. La disponibilidad debe comprobarse de nuevo antes de confirmar.</p></section></div>'+
 '<div class="automation-grid"><section class="panel automation-panel"><div class="panel-head"><div><span class="kicker">CLIENTES QUE QUIEREN VENIR</span><h2>Lista de espera</h2></div><span class="count-pill">'+waiting.length+'</span></div><div class="waitlist-list">'+(waitingCards||'<p class="muted">La lista de espera está vacía.</p>')+'</div></section>'+
 '<section class="panel automation-panel"><div class="panel-head"><div><span class="kicker">AÑADIR CLIENTE</span><h2>Apuntar a la lista</h2></div></div><form id="waitlist-form" class="automation-wait-form"><div class="form-grid"><label class="field full">Cliente habitual<select name="clientId" required>'+select(db.clients)+'</select></label><label class="field">Servicio<select name="serviceId" required>'+select(db.services)+'</select></label><label class="field">Profesional<select name="professionalId" required>'+select(db.professionals)+'</select></label><label class="field full">Día<input name="day" type="date" value="'+day+'" required></label><label class="field">Desde<input name="from" type="time" value="09:00" required></label><label class="field">Hasta<input name="to" type="time" value="14:00" required></label></div><p class="dialog-error" role="alert"></p><button type="submit" class="button primary">Añadir a espera</button></form></section></div>';
}

function onlineView():string{
 if(!db.services.some(s=>s.id===onlineService))onlineService=db.services[0]?.id??'';
 if(!db.professionals.some(p=>p.id===onlineProfessional))onlineProfessional=db.professionals[0]?.id??'';
 const times=onlineService&&onlineProfessional?availableTimes(db,onlineDay,onlineProfessional,onlineService).filter(t=>timeMinutes(t)>=9*60&&timeMinutes(t)<=19*60):[];
 if(!times.includes(onlineTime))onlineTime='';
 const slots=times.map(t=>'<button type="button" class="online-slot '+(onlineTime===t?'selected':'')+'" data-action="online-time" data-time="'+t+'" aria-pressed="'+(onlineTime===t?'true':'false')+'">'+t+'</button>').join('');
 return pageHeading('VISTA DEL CLIENTE','Reservar también puede ser fácil','Una experiencia sin descargas ni contraseñas. Esta pantalla simula cómo reservaría un cliente.','<span class="preview-tag">VISTA DE DEMOSTRACIÓN</span>')+
 '<div class="online-layout"><section class="panel online-intro"><span class="kicker">'+esc(db.settings.name.toLocaleUpperCase('es-ES'))+'</span><div class="online-icon">'+icon('calendar')+'</div><h2>Tu próxima visita,<br>sin complicaciones.</h2><p>Escoge el servicio, el profesional y un hueco libre. No necesitas crear una cuenta.</p><div class="online-benefits"><span>'+icon('check')+' Sin descargar una aplicación</span><span>'+icon('check')+' Sin registrarte</span><span>'+icon('check')+' Disponibilidad en esta demo</span></div><div class="online-caution">En la versión real, las reservas online necesitarán un servidor compartido para confirmar los huecos de forma segura.</div></section>'+
 '<section class="panel online-form-panel"><form id="online-form" novalidate><span class="kicker">SOLICITAR CITA · DEMOSTRACIÓN</span><h2>Elige cuándo venir</h2><div class="form-grid"><label class="field">Servicio<select id="online-service" name="service" required>'+selectable(db.services,onlineService)+'</select></label><label class="field">Profesional<select id="online-professional" name="professional" required>'+selectable(db.professionals,onlineProfessional)+'</select></label><label class="field full">Día<input type="date" id="online-day" name="day" min="'+dayOffset()+'" value="'+esc(onlineDay)+'" required></label></div><div class="field"><span>Horas libres</span><div class="online-slots">'+(slots||'<p class="muted">No quedan huecos para ese día. Prueba otro.</p>')+'</div></div><label class="field">Tu nombre<input name="name" type="text" maxlength="80" autocomplete="name" placeholder="Nombre y apellido" value="'+esc(onlineName)+'" required></label><p class="form-help">No pedimos correo electrónico ni una cuenta de usuario. Usa solo datos inventados en esta prueba.</p><p class="dialog-error" id="online-error" role="alert"></p><button class="button primary submit-wide" type="submit">'+icon('check')+' Confirmar cita de prueba</button></form></section></div>';
}
function dialogView():string{
 if(!dialog)return '';
 let body='';
 let title='';
 if(dialog.kind==='cita'){
  const existing=dialog.id?db.appointments.find(a=>a.id===dialog!.id):undefined;
  const value={clientId:existing?.clientId??dialog.prefill?.clientId??'',serviceId:existing?.serviceId??dialog.prefill?.serviceId??db.services[0]?.id??'',professionalId:existing?.professionalId??dialog.prefill?.professionalId??db.professionals[0]?.id??'',day:existing?.day??dialog.prefill?.day??day,time:existing?.time??dialog.prefill?.time??'11:00',channel:existing?.channel??dialog.prefill?.channel??'telefono'};
  title=existing?'Editar cita':'Nueva cita';
  body='<form id="booking-form" class="dialog-form" data-id="'+esc(existing?.id??'')+'" novalidate><div class="form-grid"><label class="field full">Cliente habitual<select name="clientId"><option value="">Es un cliente nuevo</option>'+selectable(db.clients,value.clientId)+'</select></label><label class="field full">Si es nuevo, escribe su nombre<input name="clientName" maxlength="80" type="text" placeholder="Ej.: Antonio García"></label><label class="field">Servicio<select name="serviceId" required>'+selectable(db.services,value.serviceId)+'</select></label><label class="field">Profesional<select name="professionalId" required>'+selectable(db.professionals,value.professionalId)+'</select></label><label class="field">Día<input name="day" type="date" value="'+esc(value.day)+'" required></label><label class="field">Hora<input name="time" type="time" step="300" value="'+esc(value.time)+'" required></label><label class="field full">¿Cómo ha reservado?<select name="channel">'+Object.entries(CHANNEL_LABEL).map(([id,text])=>'<option value="'+id+'"'+(value.channel===id?' selected':'')+'>'+esc(text)+'</option>').join('')+'</select></label></div><p class="form-help">No hace falta que el cliente tenga email, cuenta ni aplicación. Elige un cliente existente o escribe uno nuevo.</p><p class="dialog-error" role="alert"></p><div class="dialog-actions"><button type="button" class="button secondary" data-action="close">Volver</button><button type="submit" class="button primary">'+icon('check')+' Guardar cita</button></div></form>';
 }else if(dialog.kind==='cliente'){
  const existing=dialog.id?db.clients.find(c=>c.id===dialog!.id):undefined;
  title=existing?'Editar cliente':'Añadir cliente';
  body='<form id="client-form" class="dialog-form" data-id="'+esc(existing?.id??'')+'" novalidate><label class="field">Nombre<input name="name" type="text" maxlength="80" value="'+esc(existing?.name??'')+'" placeholder="Nombre y apellido" required></label><label class="field">Teléfono (opcional)<input name="phone" type="tel" maxlength="25" value="'+esc(existing?.phone??'')+'" placeholder="Solo si es necesario"></label><label class="field">¿Cómo prefiere reservar?<select name="preference">'+Object.entries(CHANNEL_LABEL).map(([id,text])=>'<option value="'+id+'"'+((existing?.preference??'telefono')===id?' selected':'')+'>'+esc(text)+'</option>').join('')+'</select></label><p class="form-help">Guarda solo los datos imprescindibles. La preferencia de contacto no equivale a dar consentimiento para recibir mensajes.</p><p class="dialog-error" role="alert"></p><div class="dialog-actions"><button type="button" class="button secondary" data-action="close">Volver</button><button type="submit" class="button primary">Guardar cliente</button></div></form>';
 }else{
  const existing=dialog.id?db.services.find(s=>s.id===dialog!.id):undefined;
  title=existing?'Editar servicio':'Nuevo servicio';
  body='<form id="service-form" class="dialog-form" data-id="'+esc(existing?.id??'')+'" novalidate><label class="field">Nombre del servicio<input name="name" maxlength="70" value="'+esc(existing?.name??'')+'" placeholder="Ej.: Corte de pelo" required></label><div class="form-grid"><label class="field">Duración (minutos)<input name="minutes" type="number" min="10" max="180" step="5" value="'+(existing?.minutes??30)+'" required></label><label class="field">Precio orientativo (€)<input name="price" type="number" min="0" max="999" step="0.5" value="'+(existing?.price??15)+'" required></label></div><p class="form-help">La duración se usa para comprobar que una nueva cita no se solape con otra.</p><p class="dialog-error" role="alert"></p><div class="dialog-actions"><button type="button" class="button secondary" data-action="close">Volver</button><button type="submit" class="button primary">Guardar servicio</button></div></form>';
 }
 return '<div class="modal-backdrop" data-action="close-backdrop"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="dialog-header"><div><span class="kicker">UNESPACIO · AGENDA</span><h2 id="dialog-title">'+title+'</h2></div><button type="button" class="icon-button" data-action="close" aria-label="Cerrar">'+icon('x')+'</button></div>'+body+'</section></div>';
}
function render(){if(!app)return;app.innerHTML=shell();if(dialog){const first=app.querySelector<HTMLElement>('.dialog input,.dialog select');first?.focus()}}
function dataFrom(form:HTMLFormElement,name:string):string{return String(new FormData(form).get(name)??'').trim()}
function inlineError(form:HTMLFormElement,message:string){const target=form.querySelector('.dialog-error');if(target)target.textContent=message}
function save(){persistDemo(db)}
function onClick(event:MouseEvent){
 const target=event.target as Element;
 const button=target.closest<HTMLElement>('[data-page],[data-action]');
 if(!button)return;
 const view=button.dataset.page as Page|undefined;
 if(view){setPage(view);return}
 const action=button.dataset.action,id=button.dataset.id??'';
 if(action==='close-backdrop'&&target!==button)return;
 if(action==='close'||action==='close-backdrop'){dialog=null;render();return}
 if(action==='automation-toggle'){const key=button.dataset.key as 'reminders'|'dailySummary'|'waitlist';if(['reminders','dailySummary','waitlist'].includes(key)){db.automation[key]=!db.automation[key];save();announcement('Preferencia de simulación actualizada.')}return}
 if(action==='wait-remove'){const entry=db.waitlist.find(w=>w.id===id);if(entry){entry.active=false;save();announcement('Cliente retirado de la lista de espera.')}return}
 if(action==='automation-copy'){const kind=button.dataset.kind??'';let content='';
  if(kind==='summary')content=tomorrowSummary(db);
  if(kind==='reminder'){const a=db.appointments.find(x=>x.id===id);if(a)content='Hola, '+clientName(a.clientId)+'. Te recordamos tu cita de '+serviceName(a.serviceId).toLowerCase()+' mañana '+formatDay(a.day)+' a las '+a.time+' en '+db.settings.name+'. ¡Hasta pronto!';}
  if(kind==='wait'){const match=availableWaitMatches(db).find(m=>m.entry.id===id);if(match)content='Hola, '+clientName(match.entry.clientId)+'. Ha quedado un hueco en '+db.settings.name+' el '+formatDay(match.entry.day)+' a las '+match.time+'. Si te interesa, escríbenos y comprobamos la disponibilidad. Este mensaje NO confirma una cita.';}
  if(content)void navigator.clipboard.writeText(content).then(()=>announcement('Mensaje preparado y copiado. No se ha enviado automáticamente.'),()=>window.prompt('Copia el mensaje para enviarlo manualmente:',content));return;
 }
 if(action==='view-day'||action==='view-week'){calendarMode=action==='view-week'?'semana':'dia';render();return}
 if(action==='select-day'){day=button.dataset.day??day;calendarMode='dia';render();return}
 if(action==='closure-remove'){db.settings.closures=db.settings.closures.filter(c=>c.id!==id);save();announcement('Bloqueo eliminado.');return}
 if(action==='new'){dialog={kind:'cita'};flash='';render();return}
 if(action==='slot'){dialog={kind:'cita',prefill:{day,time:button.dataset.time??'11:00',professionalId:professionalFilter==='todos'?db.professionals[0]?.id:professionalFilter}};render();return}
 if(action==='prev'||action==='next'||action==='today'){day=action==='today'?dayOffset():shiftDay(day,action==='prev'?-1:1);flash='';render();return}
 if(action==='edit'){dialog={kind:'cita',id};render();return}
 if(action==='cancel'){if(window.confirm('¿Cancelar esta cita?')){if(cancelAppointment(db,id)){save();announcement('Cita cancelada.')}}return}
 if(action==='repeat'){
  const latest=latestForClient(db,id);
  dialog={kind:'cita',prefill:{clientId:id,serviceId:latest?.serviceId??db.services[0]?.id,professionalId:latest?.professionalId??db.professionals[0]?.id,day:dayOffset(1),time:latest?.time??'11:00',channel:db.clients.find(c=>c.id===id)?.preference??'telefono'}};render();return;
 }
 if(action==='copy'){void copyConfirmation(id);return}
 if(action==='client-new'||action==='client-edit'){dialog={kind:'cliente',id:action==='client-edit'?id:undefined};render();return}
 if(action==='service-new'||action==='service-edit'){dialog={kind:'servicio',id:action==='service-edit'?id:undefined};render();return}
 if(action==='online-time'){onlineTime=button.dataset.time??'';render();return}
 if(action==='reset'){if(window.confirm('¿Restablecer los datos ficticios de esta demostración?')){db=resetDemo();day=dayOffset();onlineName='';onlineTime='';professionalFilter='todos';calendarMode='dia';announcement('Datos de ejemplo restaurados.')}return}
}
async function copyConfirmation(id:string){
 const a=db.appointments.find(b=>b.id===id&&b.status==='confirmada');if(!a)return;
 const content='Hola, '+clientName(a.clientId)+'. Te confirmamos tu cita en '+db.settings.name+' el '+formatDay(a.day,{weekday:'long',day:'numeric',month:'long'})+' a las '+a.time+' para '+serviceName(a.serviceId).toLowerCase()+'. ¡Hasta pronto!';
 try{await navigator.clipboard.writeText(content);announcement('Confirmación copiada. Pégala en tu conversación de WhatsApp.')}
 catch{window.prompt('Copia este mensaje y envíalo desde WhatsApp:',content)}
}
function onChange(event:Event){
 const el=event.target as HTMLInputElement|HTMLSelectElement;
 if(el.id==='agenda-day'){day=el.value;render()}
 else if(el.id==='agenda-professional'){professionalFilter=el.value;render()}
 else if(el.id==='online-service'){onlineService=el.value;onlineTime='';render()}
 else if(el.id==='online-professional'){onlineProfessional=el.value;onlineTime='';render()}
 else if(el.id==='online-day'){onlineDay=el.value;onlineTime='';render()}
}
function onInput(event:Event){
 const el=event.target as HTMLInputElement;
 if(el.name==='name'&&el.closest('#online-form'))onlineName=el.value;
 if(el.id==='client-search'){
  const needle=el.value.trim().toLowerCase();
  const cards=[...document.querySelectorAll<HTMLElement>('[data-client-card]')];
  let visible=0;
  cards.forEach(card=>{const show=(card.dataset.search??'').includes(needle);card.hidden=!show;if(show)visible++});
  const empty=document.querySelector<HTMLElement>('.empty-search');if(empty)empty.hidden=visible!==0;
 }
}
function onSubmit(event:SubmitEvent){
 const form=event.target as HTMLFormElement;if(!form?.id)return;
 if(!['booking-form','client-form','service-form','online-form','business-form','hours-form','closure-form','waitlist-form'].includes(form.id))return;
 event.preventDefault();
 const name=dataFrom(form,'name');
 if(form.id==='business-form'){
  if(name.length<2)return inlineError(form,'Escribe un nombre válido.');
  db.settings.name=name;save();announcement('Nombre del negocio actualizado.');return;
 }
 if(form.id==='hours-form'){
  const next=structuredClone(db);
  for(let d=0;d<7;d++){
   const blocks:{open:string;close:string}[]=[];
   for(let t=1;t<=2;t++){
    const open=dataFrom(form,'open'+t+'_'+d),close=dataFrom(form,'close'+t+'_'+d);
    if((open&&!close)||(close&&!open))return inlineError(form,'Completa apertura y cierre del '+WEEKDAYS[d]+'.');
    if(open&&close)blocks.push({open,close});
   }
   const result=setHours(next,d,blocks);if(!result.ok)return inlineError(form,WEEKDAYS[d]+': '+result.message);
  }
  db.settings.hours=next.settings.hours;save();announcement('Horarios semanales actualizados.');return;
 }
 if(form.id==='waitlist-form'){
  const result=addWaitEntry(db,{clientId:dataFrom(form,'clientId'),serviceId:dataFrom(form,'serviceId'),professionalId:dataFrom(form,'professionalId'),day:dataFrom(form,'day'),from:dataFrom(form,'from'),to:dataFrom(form,'to')});
  if(!result.ok)return inlineError(form,result.message);
  save();announcement(result.message);return;
 }
 if(form.id==='closure-form'){
  const result=addClosure(db,dataFrom(form,'day'),dataFrom(form,'reason'),dataFrom(form,'professionalId')||null);
  if(!result.ok)return inlineError(form,result.message);
  save();announcement(result.message);return;
 }
 if(form.id==='booking-form'){
  const previousId=form.dataset.id||undefined;
  let clientId=dataFrom(form,'clientId');
  let createdId='';
  if(!clientId){
   const clientName=dataFrom(form,'clientName');
   if(clientName.length<2)return inlineError(form,'Escribe el nombre del cliente o elige uno habitual.');
   const existing=db.clients.find(c=>c.name.toLocaleLowerCase('es-ES')===clientName.toLocaleLowerCase('es-ES'));
   if(existing)clientId=existing.id;
   else{const created=createClient(db,clientName,dataFrom(form,'channel') as Preference);clientId=created.id;createdId=created.id}
  }
  const input:BookingInput={clientId,serviceId:dataFrom(form,'serviceId'),professionalId:dataFrom(form,'professionalId'),day:dataFrom(form,'day'),time:dataFrom(form,'time'),channel:dataFrom(form,'channel') as Channel};
  const result=saveAppointment(db,input,previousId);
  if(!result.ok){if(createdId)db.clients=db.clients.filter(c=>c.id!==createdId);return inlineError(form,result.message)}
  save();dialog=null;day=input.day;setPage('agenda');announcement(result.message);return;
 }
 if(form.id==='client-form'){
  if(name.length<2)return inlineError(form,'Escribe un nombre de al menos dos caracteres.');
  const pref=dataFrom(form,'preference') as Preference;
  if(!Object.keys(CHANNEL_LABEL).includes(pref))return inlineError(form,'Selecciona una preferencia válida.');
  const previous=db.clients.find(c=>c.id===form.dataset.id);
  if(previous){previous.name=name;previous.phone=dataFrom(form,'phone');previous.preference=pref}
  else createClient(db,name,pref,dataFrom(form,'phone'));
  save();dialog=null;setPage('clientes');announcement('Ficha de cliente guardada.');return;
 }
 if(form.id==='service-form'){
  if(name.length<2)return inlineError(form,'Escribe el nombre del servicio.');
  const minutes=Number(dataFrom(form,'minutes'));const price=Number(dataFrom(form,'price'));
  if(!Number.isInteger(minutes)||minutes<10||minutes>180||minutes%5!==0)return inlineError(form,'La duración debe ser de 10 a 180 minutos, en intervalos de 5.');
  if(!Number.isFinite(price)||price<0||price>999)return inlineError(form,'Escribe un precio válido.');
  const previous=db.services.find(s=>s.id===form.dataset.id);
  if(previous){previous.name=name;previous.minutes=minutes;previous.price=price}
  else createService(db,name,minutes,price);
  save();dialog=null;setPage('servicios');announcement('Servicio guardado.');return;
 }
 if(form.id==='online-form'){
  if(name.length<2)return inlineError(form,'Escribe un nombre de al menos dos caracteres.');
  if(onlineDay<dayOffset())return inlineError(form,'Selecciona una fecha de hoy en adelante.');
  if(!onlineTime)return inlineError(form,'Selecciona primero una hora libre.');
  const existing=db.clients.find(c=>c.name.toLocaleLowerCase('es-ES')===name.toLocaleLowerCase('es-ES'));
  const client=existing??createClient(db,name,'online');
  const input:BookingInput={clientId:client.id,professionalId:onlineProfessional,serviceId:onlineService,day:onlineDay,time:onlineTime,channel:'online'};
  const result=saveAppointment(db,input);
  if(!result.ok){if(!existing)db.clients=db.clients.filter(c=>c.id!==client.id);return inlineError(form,result.message)}
  save();onlineName='';onlineTime='';day=onlineDay;setPage('agenda');announcement('Reserva online simulada añadida a la agenda.');return;
 }
}
export function startBookingApp(){
 if(!app)throw new Error('Falta el contenedor principal');
 page=routePage();
 document.addEventListener('click',onClick);
 document.addEventListener('change',onChange);
 document.addEventListener('input',onInput);
 document.addEventListener('submit',onSubmit);
 window.addEventListener('hashchange',()=>{page=routePage();dialog=null;flash='';render()});
 render();
}
