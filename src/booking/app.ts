import {CHANNEL_LABEL,availableTimes,cancelAppointment,createClient,createService,dayOffset,formatDay,latestForClient,loadDemo,persistDemo,resetDemo,saveAppointment,seedData,shiftDay,sortedAppointments,timeMinutes,minutesTime,type BookingInput,type Channel,type DemoData,type Preference} from './model.js';

type Page='agenda'|'clientes'|'servicios'|'reservar';
type Dialog={kind:'cita';id?:string;prefill?:Partial<BookingInput>}|{kind:'cliente';id?:string}|{kind:'servicio';id?:string}|null;
const app=document.getElementById('app');
let db:DemoData=loadDemo();
let page:Page='agenda';
let day=dayOffset();
let professionalFilter='todos';
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
function routePage():Page{const hash=location.hash.replace(/^#\/?/,'');return ['agenda','clientes','servicios','reservar'].includes(hash)?hash as Page:'agenda'}
function shell():string{
 const routes:{id:Page;title:string;icon:string}[]=[{id:'agenda',title:'Agenda',icon:'calendar'},{id:'clientes',title:'Clientes',icon:'users'},{id:'servicios',title:'Servicios',icon:'scissors'},{id:'reservar',title:'Reserva online',icon:'link'}];
 const nav=routes.map(r=>'<button type="button" class="nav-link '+(page===r.id?'active':'')+'" data-page="'+r.id+'" '+(page===r.id?'aria-current="page"':'')+'>'+icon(r.icon)+'<span>'+r.title+'</span></button>').join('');
 const titles:Record<Page,string>={agenda:'Agenda de citas',clientes:'Clientes habituales',servicios:'Servicios',reservar:'Reserva online'};
 const content=page==='agenda'?agendaView():page==='clientes'?clientsView():page==='servicios'?servicesView():onlineView();
 return '<div class="app-shell"><aside class="sidebar"><div class="brand"><span class="brand-mark" aria-hidden="true"></span><span>unespacio<small>GESTIÓN DE CITAS</small></span></div><div class="place-card"><span class="place-dot"></span><div><strong>Barbería del Barrio</strong><small>Negocio de demostración</small></div></div><p class="nav-label">TU ESPACIO</p><nav aria-label="Navegación principal">'+nav+'</nav><div class="sidebar-bottom"><div class="quiet-mark">'+icon('check')+' Sin complicaciones</div><small>Unespacio · versión de prueba</small></div></aside>'+
 '<div class="workspace"><div class="mobile-brand"><span class="brand-mark"></span><strong>unespacio</strong><span class="demo-tag">DEMO</span></div><header class="topbar"><div class="breadcrumb">MI NEGOCIO <span>/</span> <strong>'+titles[page]+'</strong></div><div class="top-actions"><span class="date-label">'+esc(formatDay(day,{day:'numeric',month:'short',year:'numeric'}))+'</span><span class="avatar" aria-label="Negocio de demostración">BB</span></div></header>'+
 '<div class="demo-note" role="note">'+icon('spark')+' <span><strong>Entorno de demostración.</strong> Los nombres son ficticios y los cambios se guardan solo en este navegador. No introduzcas datos reales.</span><button type="button" data-action="reset" title="Restablecer datos de ejemplo">'+icon('rotate')+'<span>Reiniciar demo</span></button></div>'+
 '<main class="main-content" id="main-content">'+content+'</main><div class="mobile-nav" aria-label="Navegación móvil">'+nav+'</div></div>'+
 (dialog?dialogView():'')+(flash?'<div class="toast" role="status">'+icon('check')+' '+esc(flash)+'</div>':'')+'</div>';
}
function pageHeading(kicker:string,title:string,description:string,action=''):string{return '<section class="page-heading"><div><span class="kicker">'+kicker+'</span><h1>'+title+'</h1><p>'+description+'</p></div>'+action+'</section>'}
function agendaView():string{
 const appointments=sortedToday();
 const action='<button class="button primary hero-button" data-action="new" type="button">'+icon('plus')+' Nueva cita</button>';
 const stats='<div class="stat-grid"><div class="stat"><span>Citas del día</span><strong>'+appointments.length+'</strong><small>En la agenda seleccionada</small></div><div class="stat"><span>Por teléfono</span><strong>'+count('telefono')+'</strong><small>Sin cuenta ni aplicación</small></div><div class="stat"><span>Desde WhatsApp</span><strong>'+count('whatsapp')+'</strong><small>Registradas a mano</small></div><div class="stat"><span>Clientes habituales</span><strong>'+db.clients.length+'</strong><small>Con atención cercana</small></div></div>';
 const controls='<div class="calendar-controls"><div class="date-nav"><button aria-label="Día anterior" type="button" data-action="prev">'+icon('left')+'</button><input id="agenda-day" type="date" aria-label="Seleccionar día" value="'+esc(day)+'"><button aria-label="Día siguiente" type="button" data-action="next">'+icon('right')+'</button><button type="button" class="today-button" data-action="today">Hoy</button></div><label class="compact-select">Profesional <select id="agenda-professional"><option value="todos">Todos</option>'+selectable(db.professionals,professionalFilter)+'</select></label></div>';
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
 '<div class="appointment-list">'+(rows||'<div class="empty-state">'+icon('calendar')+'<h3>Este día está despejado</h3><p>Añade una cita por teléfono, WhatsApp o en persona en pocos pasos.</p><button class="button secondary" data-action="new">Crear una cita</button></div>')+'</div></section>'+
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
function onlineView():string{
 if(!db.services.some(s=>s.id===onlineService))onlineService=db.services[0]?.id??'';
 if(!db.professionals.some(p=>p.id===onlineProfessional))onlineProfessional=db.professionals[0]?.id??'';
 const times=onlineService&&onlineProfessional?availableTimes(db,onlineDay,onlineProfessional,onlineService).filter(t=>timeMinutes(t)>=9*60&&timeMinutes(t)<=19*60):[];
 if(!times.includes(onlineTime))onlineTime='';
 const slots=times.map(t=>'<button type="button" class="online-slot '+(onlineTime===t?'selected':'')+'" data-action="online-time" data-time="'+t+'" aria-pressed="'+(onlineTime===t?'true':'false')+'">'+t+'</button>').join('');
 return pageHeading('VISTA DEL CLIENTE','Reservar también puede ser fácil','Una experiencia sin descargas ni contraseñas. Esta pantalla simula cómo reservaría un cliente.','<span class="preview-tag">VISTA DE DEMOSTRACIÓN</span>')+
 '<div class="online-layout"><section class="panel online-intro"><span class="kicker">BARBERÍA DEL BARRIO</span><div class="online-icon">'+icon('calendar')+'</div><h2>Tu próxima visita,<br>sin complicaciones.</h2><p>Escoge el servicio, el profesional y un hueco libre. No necesitas crear una cuenta.</p><div class="online-benefits"><span>'+icon('check')+' Sin descargar una aplicación</span><span>'+icon('check')+' Sin registrarte</span><span>'+icon('check')+' Disponibilidad en esta demo</span></div><div class="online-caution">En la versión real, las reservas online necesitarán un servidor compartido para confirmar los huecos de forma segura.</div></section>'+
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
 if(action==='reset'){if(window.confirm('¿Restablecer los datos ficticios de esta demostración?')){db=resetDemo();day=dayOffset();onlineName='';onlineTime='';professionalFilter='todos';announcement('Datos de ejemplo restaurados.')}return}
}
async function copyConfirmation(id:string){
 const a=db.appointments.find(b=>b.id===id&&b.status==='confirmada');if(!a)return;
 const content='Hola, '+clientName(a.clientId)+'. Te confirmamos tu cita en Barbería del Barrio el '+formatDay(a.day,{weekday:'long',day:'numeric',month:'long'})+' a las '+a.time+' para '+serviceName(a.serviceId).toLowerCase()+'. ¡Hasta pronto!';
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
 if(!['booking-form','client-form','service-form','online-form'].includes(form.id))return;
 event.preventDefault();
 const name=dataFrom(form,'name');
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
