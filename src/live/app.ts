import {formatDay,dayOffset,shiftDay,CHANNEL_LABEL,type Channel} from '../booking/model.js';
const root=document.getElementById('app');
type Screen='agenda'|'clientes'|'servicios'|'horarios'|'publicar';
interface UserSession {user:{email:string;role:'owner'|'staff'};business:{id:string;name:string;slug:string;timezone:string;publicBookingEnabled:boolean;privacyUrl:string|null};csrfToken:string}
interface Service {id:string;name:string;minutes:number;price_cents:number;active:boolean}
interface Person {id:string;name:string;active:boolean}
interface Customer {id:string;name:string;phone:string|null;preference:Channel}
interface Slot {weekday:number;slot:number;open_min:number;close_min:number}
interface BusinessData {services:Service[];professionals:Person[];customers:Customer[];hours:Slot[];closures:unknown[]}
interface Booking {id:string;day:string;start_min:number;end_min:number;customer_name:string;service_name:string;professional_name:string;source:Channel;status:'pendiente'|'confirmada'|'cancelada'}
let session:UserSession|null=null;
let data:BusinessData|null=null;
let appointments:Booking[]=[];
let screen:Screen='agenda';
let day=dayOffset();
let error='';
let message='';
let signup=false;
let publicData:{business:{name:string;slug:string;privacyUrl:string};services:Service[];professionals:Person[]}|null=null;
let publicSlots:string[]=[];
let selectedSlot='';
let publicParams={serviceId:'',professionalId:'',day:dayOffset(1)};
const escape=(v:unknown)=>String(v??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]??k));
const time=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const money=c=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(c/100);
const val=(form:HTMLFormElement,key:string)=>String(new FormData(form).get(key)??'').trim();
function setError(e:unknown){error=e instanceof Error?e.message:'No se pudo completar la operación';message='';render()}
async function request<T=unknown>(path:string,options:{method?:string;body?:unknown}={}):Promise<T>{
 const headers:Record<string,string>={Accept:'application/json'};
 if(options.body!==undefined)headers['Content-Type']='application/json';
 if(options.method&&options.method!=='GET'&&session)headers['X-CSRF-Token']=session.csrfToken;
 let response:Response;
 try{response=await fetch('/api/v1'+path,{method:options.method??'GET',headers,credentials:'same-origin',cache:'no-store',body:options.body===undefined?undefined:JSON.stringify(options.body)})}
 catch{throw new Error('No hay conexión con el servidor. Comprueba Internet y vuelve a intentarlo.')}
 const result=await response.json().catch(()=>({error:'Respuesta inesperada del servidor'}));
 if(!response.ok)throw new Error(result.error||'No se ha podido realizar la operación.');
 return result as T;
}
async function loadData(){
 if(!session)return;
 data=await request<BusinessData>('/data');
 const r=await request<{appointments:Booking[]}>('/agenda?day='+encodeURIComponent(day));
 appointments=r.appointments;
}
function alertHTML(){return (error?'<p class="live-alert error" role="alert">'+escape(error)+'</p>':'')+(message?'<p class="live-alert success" role="status">'+escape(message)+'</p>':'')}
function loginPage():string{
 return '<div class="live-auth"><section class="auth-story"><div class="brand"><span class="brand-mark"></span><span>unespacio<small>LA AGENDA DE TU NEGOCIO</small></span></div><span class="kicker">PARA NEGOCIOS DE CERCANÍA</span><h1>Una agenda fácil.<br>Para atender como siempre.</h1><p>Recoge las citas de llamadas, WhatsApp y reservas online en un solo lugar. Sin obligar a tus clientes a utilizar una aplicación.</p><div class="online-benefits"><span>✓ Agenda compartida y segura</span><span>✓ Clientes habituales</span><span>✓ Sin doble reserva</span></div></section>'+
 '<section class="auth-card"><span class="kicker">UNESPACIO · ACCESO</span><h2>'+(signup?'Crea tu espacio':'Bienvenido de nuevo')+'</h2><p>'+(signup?'Prepara la agenda de tu establecimiento.':'Entra en el espacio de tu negocio.')+'</p>'+alertHTML()+
 '<form id="'+(signup?'register-live':'login-live')+'">'+(signup?'<label class="field">Nombre del negocio<input name="businessName" required maxlength="100" placeholder="Ej.: Barbería Manolo"></label><label class="field">Tu nombre<input name="professionalName" required maxlength="80" placeholder="Nombre del profesional"></label>':'')+
 '<label class="field">Identificador del negocio<input name="slug" required pattern="[a-z0-9-]{3,50}" placeholder="barberia-manolo" autocomplete="organization"></label><label class="field">Correo de acceso<input name="email" type="email" required maxlength="254" autocomplete="username" placeholder="tu@negocio.es"></label><label class="field">Contraseña<input name="password" type="password" required minlength="12" maxlength="128" autocomplete="'+(signup?'new-password':'current-password')+'" placeholder="Al menos 12 caracteres"></label><button class="button primary submit-wide" type="submit">'+(signup?'Crear mi negocio':'Entrar a mi agenda')+'</button></form><p class="auth-switch"><button type="button" data-action="toggle-signup">'+(signup?'Ya tengo un negocio':'Quiero crear mi negocio')+'</button></p><p class="muted">Si todavía no están abiertas las altas, el administrador debe habilitarlas. No utilices la demo pública para gestionar citas reales.</p></section></div>';
}
function banner():string{return '<div class="live-notice">Espacio privado · '+escape(session?.business.name)+' <button type="button" data-action="logout">Cerrar sesión</button></div>'}
function layout():string{
 const pages:{id:Screen;name:string}[]=[{id:'agenda',name:'Agenda'},{id:'clientes',name:'Clientes'},{id:'servicios',name:'Servicios y equipo'},{id:'horarios',name:'Horarios'},{id:'publicar',name:'Reserva pública'}];
 const nav=pages.map(p=>'<button type="button" class="nav-link '+(screen===p.id?'active':'')+'" data-nav="'+p.id+'">'+escape(p.name)+'</button>').join('');
 return '<div class="app-shell live-shell"><aside class="sidebar"><div class="brand"><span class="brand-mark"></span><span>unespacio<small>GESTIÓN DE CITAS</small></span></div><div class="place-card"><strong>'+escape(session?.business.name)+'</strong></div><p class="nav-label">TU NEGOCIO</p><nav>'+nav+'</nav><div class="sidebar-bottom"><small>Unespacio · acceso privado</small></div></aside><div class="workspace">'+banner()+
 '<main class="main-content">'+alertHTML()+(screen==='agenda'?agendaPage():screen==='clientes'?clientsPage():screen==='servicios'?servicesPage():screen==='horarios'?hoursPage():publishPage())+'</main><nav class="live-mobile-nav">'+nav+'</nav></div></div>';
}
function agendaPage():string{
 const rows=appointments.map(a=>'<div class="live-appointment"><div class="live-hour">'+time(a.start_min)+'</div><div><strong>'+escape(a.customer_name)+'</strong><p>'+escape(a.service_name)+' · '+escape(a.professional_name)+' · '+escape(CHANNEL_LABEL[a.source])+'</p></div><span class="status '+a.status+'">'+(a.status==='pendiente'?'Pendiente':a.status==='cancelada'?'Cancelada':'Confirmada')+'</span><div class="live-actions">'+(a.status==='pendiente'?'<button data-action="confirm" data-id="'+a.id+'">Confirmar</button>':'')+(a.status!=='cancelada'?'<button data-action="cancel" data-id="'+a.id+'">Cancelar</button>':'')+'</div></div>').join('');
 const options=(list:{id:string;name:string}[])=>list.map(x=>'<option value="'+escape(x.id)+'">'+escape(x.name)+'</option>').join('');
 return '<section class="page-heading"><div><span class="kicker">CITAS DE TODOS LOS CANALES</span><h1>Tu agenda diaria</h1><p>Registra una llamada, un WhatsApp o una cita en persona en pocos pasos.</p></div></section>'+
 '<div class="live-two"><section class="panel settings-panel"><span class="kicker">NUEVA CITA</span><h2>Apuntar una reserva</h2><form id="live-booking"><label class="field">Cliente habitual<select name="clientId"><option value="">Cliente nuevo</option>'+options(data?.customers??[])+'</select></label><label class="field">Si es nuevo, su nombre<input name="clientName" maxlength="100" placeholder="Nombre y apellido"></label><div class="form-grid"><label class="field">Servicio<select name="serviceId" required>'+options(data?.services.filter(s=>s.active)??[])+'</select></label><label class="field">Profesional<select name="professionalId" required>'+options(data?.professionals.filter(p=>p.active)??[])+'</select></label><label class="field">Día<input type="date" name="day" value="'+day+'" required></label><label class="field">Hora<input type="time" name="time" step="300" value="10:00" required></label></div><label class="field">Cómo ha reservado<select name="channel"><option value="telefono">Teléfono</option><option value="whatsapp">WhatsApp</option><option value="local">En persona</option></select></label><button class="button primary submit-wide" type="submit">Guardar cita</button></form></section>'+
 '<section class="panel settings-panel"><div class="live-day-header"><div><span class="kicker">EL DÍA</span><h2>'+escape(formatDay(day))+'</h2></div><input id="live-day" type="date" value="'+day+'"></div><div class="live-list">'+(rows||'<div class="empty-state"><h3>Sin citas todavía</h3><p>Las reservas del establecimiento aparecerán aquí.</p></div>')+'</div></section></div>';
}
function clientsPage():string{
 const cards=(data?.customers??[]).map(c=>'<div class="client-card"><div class="client-avatar">'+escape(c.name.slice(0,1))+'</div><div class="client-details"><strong>'+escape(c.name)+'</strong><small>'+escape(CHANNEL_LABEL[c.preference])+'</small>'+(c.phone?'<p>'+escape(c.phone)+'</p>':'')+'</div></div>').join('');
 return '<section class="page-heading"><div><span class="kicker">TRATO PERSONAL</span><h1>Clientes habituales</h1><p>Guarda solo los datos necesarios, sin exigir una cuenta a tus clientes.</p></div></section><div class="live-two"><section class="panel settings-panel"><h2>Añadir cliente</h2><form id="live-client"><label class="field">Nombre<input name="name" maxlength="100" required></label><label class="field">Teléfono (opcional)<input name="phone" type="tel" maxlength="30"></label><label class="field">Canal preferido<select name="preference"><option value="telefono">Teléfono</option><option value="whatsapp">WhatsApp</option><option value="local">En persona</option><option value="online">Online</option></select></label><button class="button primary" type="submit">Guardar cliente</button></form></section><section class="panel settings-panel"><h2>'+cards.length+' clientes</h2><div class="client-grid">'+(cards||'<p class="muted">Todavía no hay clientes.</p>')+'</div></section></div>';
}
function servicesPage():string{
 const list=(data?.services??[]).map(s=>'<div class="live-service"><strong>'+escape(s.name)+'</strong><span>'+s.minutes+' min · '+money(s.price_cents)+'</span></div>').join('');
 const people=(data?.professionals??[]).map(p=>'<div class="live-service"><strong>'+escape(p.name)+'</strong><span>Profesional</span></div>').join('');
 return '<section class="page-heading"><div><span class="kicker">PERSONALIZA TU NEGOCIO</span><h1>Servicios y equipo</h1><p>Las duraciones controlan la disponibilidad de los huecos.</p></div></section><div class="live-two"><section class="panel settings-panel"><h2>Nuevo servicio</h2><form id="live-service"><label class="field">Nombre<input name="name" required maxlength="100"></label><div class="form-grid"><label class="field">Duración (min)<input name="minutes" type="number" min="10" max="240" step="5" value="30"></label><label class="field">Precio (€)<input name="price" type="number" min="0" max="9999" step=".5" value="15"></label></div><button class="button primary" type="submit">Guardar servicio</button></form><div class="live-list">'+list+'</div></section><section class="panel settings-panel"><h2>Profesionales</h2><form id="live-professional"><label class="field">Nombre<input name="name" required maxlength="80"></label><button type="submit" class="button secondary">Añadir profesional</button></form><div class="live-list">'+people+'</div></section></div>';
}
function hoursPage():string{
 const week=[1,2,3,4,5,6,0];
 const items=week.map(d=>{
  const slots=data?.hours.filter(x=>x.weekday===d)??[];
  const one=slots.find(x=>x.slot===1),two=slots.find(x=>x.slot===2);
  return '<div class="hours-row"><strong>'+['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][d]+'</strong><div class="hours-times">'+[one?.open_min,one?.close_min,two?.open_min,two?.close_min].map((m,i)=>'<label><span>'+['Desde','Hasta','Desde (tarde)','Hasta (tarde)'][i]+'</span><input type="time" name="'+['open1_','close1_','open2_','close2_'][i]+d+'" value="'+(m===undefined?'':time(m))+'"></label>').join('')+'</div></div>';
 }).join('');
 return '<section class="page-heading"><div><span class="kicker">TU DISPONIBILIDAD</span><h1>Horarios de apertura</h1><p>Los clientes solo podrán solicitar citas en horas disponibles.</p></div></section><section class="panel settings-panel"><form id="live-hours"><div class="hours-list">'+items+'</div><button class="button primary" type="submit">Guardar horarios</button></form><p class="muted">Al modificar horarios, revisa también las citas ya confirmadas: no cambian automáticamente.</p></section>';
}
function publishPage():string{
 const b=session!.business,link=location.origin+'/r/'+b.slug;
 return '<section class="page-heading"><div><span class="kicker">ATENDER TAMBIÉN ONLINE</span><h1>Enlace de reserva</h1><p>Tus clientes no necesitan instalar una aplicación. Sus solicitudes quedarán pendientes de tu confirmación.</p></div></section><div class="live-two"><section class="panel settings-panel"><h2>Activar solicitudes</h2><form id="live-publish"><label class="field">Nombre del negocio<input name="name" maxlength="100" value="'+escape(b.name)+'" required></label><label class="field">URL de la política de privacidad<input name="privacyUrl" type="url" placeholder="https://tu-negocio.es/privacidad" value="'+escape(b.privacyUrl??'')+'"></label><label class="field live-checkbox"><input name="enabled" type="checkbox" '+(b.publicBookingEnabled?'checked':'')+'> Permitir solicitudes online</label><p class="muted">La página pública debe informar sobre el tratamiento de datos. La plataforma no envía mensajes automáticos ni confirma citas sin tu revisión.</p><button class="button primary" type="submit">Guardar configuración</button></form></section><section class="panel settings-panel"><h2>Tu enlace público</h2><p class="live-public-link">'+escape(link)+'</p><button class="button secondary" type="button" data-action="copy-public">Copiar enlace</button><p class="muted">Estado: '+(b.publicBookingEnabled?'solicitudes habilitadas':'inactivo')+'. En la demo de GitHub Pages este enlace no acepta reservas reales.</p></section></div>';
}
function publicPage():string{
 if(!publicData)return '<div class="public-booking"><h1>Reserva online</h1>'+alertHTML()+'<p>No se ha podido cargar el establecimiento.</p></div>';
 const options=(items:{id:string;name:string}[],value:string)=>items.map(x=>'<option value="'+escape(x.id)+'"'+(x.id===value?' selected':'')+'>'+escape(x.name)+'</option>').join('');
 return '<div class="public-booking"><div class="public-header"><span class="brand-mark"></span><strong>unespacio</strong></div><div class="panel online-form-panel"><span class="kicker">RESERVA SIN REGISTRARTE</span><h1>'+escape(publicData.business.name)+'</h1><p>Elige un horario para solicitar tu cita. El establecimiento confirmará la reserva.</p>'+alertHTML()+'<form id="live-public-book"><div class="form-grid"><label class="field">Servicio<select id="public-service">'+options(publicData.services,publicParams.serviceId)+'</select></label><label class="field">Profesional<select id="public-professional">'+options(publicData.professionals,publicParams.professionalId)+'</select></label></div><label class="field">Día<input id="public-day" type="date" min="'+dayOffset()+'" max="'+shiftDay(dayOffset(),45)+'" value="'+publicParams.day+'"></label><span class="field">Horas disponibles</span><div class="online-slots">'+(publicSlots.length?publicSlots.map(t=>'<button class="online-slot '+(selectedSlot===t?'selected':'')+'" data-action="public-slot" data-time="'+t+'" type="button">'+t+'</button>').join(''):'<p class="muted">Sin huecos disponibles para esta fecha.</p>')+'</div><label class="field">Tu nombre<input name="name" maxlength="100" autocomplete="name" required></label><label class="field">Teléfono para gestionar la cita<input name="phone" type="tel" maxlength="30" autocomplete="tel" required></label><label class="field live-checkbox"><input type="checkbox" name="acceptedPrivacy" required> He leído la <a href="'+escape(publicData.business.privacyUrl)+'" target="_blank" rel="noopener noreferrer">política de privacidad</a> del negocio.</label><input type="text" name="website" class="honey-field" tabindex="-1" autocomplete="off" aria-hidden="true"><button class="button primary submit-wide" type="submit">Enviar solicitud de cita</button></form><p class="muted">No necesitas cuenta ni contraseña. La cita no estará confirmada hasta que el negocio la acepte.</p></div></div>';
}
function render(){
 if(!root)return;
 root.innerHTML=location.pathname.startsWith('/r/')?publicPage():session?layout():loginPage();
}
async function reload(){await loadData();render()}
async function initPublic(){
 const slug=decodeURIComponent(location.pathname.split('/')[2]??'');
 const info=await request<typeof publicData>('/public/'+encodeURIComponent(slug));
 if(!info)throw new Error('Este negocio no está disponible.');
 publicData=info;publicParams.serviceId=info.services[0]?.id??'';publicParams.professionalId=info.professionals[0]?.id??'';
 await loadSlots();render();
}
async function loadSlots(){
 if(!publicData||!publicParams.serviceId||!publicParams.professionalId)return;
 const slug=publicData.business.slug;
 const qs=new URLSearchParams({serviceId:publicParams.serviceId,professionalId:publicParams.professionalId,day:publicParams.day});
 const result=await request<{availableTimes:string[]}>('/public/'+encodeURIComponent(slug)+'/availability?'+qs);
 publicSlots=result.availableTimes;selectedSlot='';
}
async function submit(form:HTMLFormElement){
 error='';message='';
 if(form.id==='login-live'||form.id==='register-live'){
  const b={email:val(form,'email'),password:val(form,'password'),slug:val(form,'slug'),businessName:val(form,'businessName'),professionalName:val(form,'professionalName')};
  const path=form.id==='login-live'?'/auth/login':'/auth/register';
  await request(path,{method:'POST',body:b});
  session=await request<UserSession>('/me');await reload();return;
 }
 if(form.id==='live-booking'){
  const b={clientId:val(form,'clientId')||undefined,clientName:val(form,'clientName'),serviceId:val(form,'serviceId'),professionalId:val(form,'professionalId'),day:val(form,'day'),time:val(form,'time'),channel:val(form,'channel')};
  await request('/appointments',{method:'POST',body:b});day=b.day;message='Cita guardada correctamente.';await reload();return;
 }
 if(form.id==='live-client'){
  await request('/clients',{method:'POST',body:{name:val(form,'name'),phone:val(form,'phone'),preference:val(form,'preference')}});
  message='Cliente guardado.';await reload();return;
 }
 if(form.id==='live-service'){
  await request('/services',{method:'POST',body:{name:val(form,'name'),minutes:Number(val(form,'minutes')),priceCents:Math.round(Number(val(form,'price'))*100)}});
  message='Servicio creado.';await reload();return;
 }
 if(form.id==='live-professional'){
  await request('/professionals',{method:'POST',body:{name:val(form,'name')}});
  message='Profesional añadido.';await reload();return;
 }
 if(form.id==='live-hours'){
  const rows=[];
  for(let d=0;d<7;d++)for(let slot=1;slot<=2;slot++){
   const open=val(form,'open'+slot+'_'+d),close=val(form,'close'+slot+'_'+d);
   if((open&&!close)||(!open&&close))throw new Error('Completa ambas horas del turno o déjalo vacío.');
   if(open&&close)rows.push({weekday:d,slot,open,close});
  }
  await request('/hours',{method:'PUT',body:{hours:rows}});message='Horario actualizado.';await reload();return;
 }
 if(form.id==='live-publish'){
  await request('/business',{method:'PATCH',body:{name:val(form,'name'),privacyUrl:val(form,'privacyUrl'),publicBookingEnabled:new FormData(form).get('enabled')==='on'}});
  session=await request<UserSession>('/me');message='Configuración pública guardada.';await reload();return;
 }
 if(form.id==='live-public-book'){
  if(!selectedSlot)throw new Error('Elige una hora disponible.');
  const slug=publicData!.business.slug;
  const acceptedPrivacy=new FormData(form).get('acceptedPrivacy')==='on';
  await request('/public/'+encodeURIComponent(slug)+'/book',{method:'POST',body:{...publicParams,time:selectedSlot,name:val(form,'name'),phone:val(form,'phone'),acceptedPrivacy,website:val(form,'website')}});
  message='Solicitud recibida. Espera la confirmación del establecimiento.';
  await loadSlots();render();return;
 }
}
async function click(event:MouseEvent){
 const button=(event.target as Element).closest<HTMLElement>('[data-action],[data-nav]');
 if(!button)return;
 try{
  error='';message='';
  if(button.dataset.nav){screen=button.dataset.nav as Screen;render();return}
  const action=button.dataset.action,id=button.dataset.id;
  if(action==='toggle-signup'){signup=!signup;render();return}
  if(action==='logout'){await request('/auth/logout',{method:'POST'});session=null;data=null;render();return}
  if(action==='confirm'||action==='cancel'){
   if(action==='cancel'&&!window.confirm('¿Cancelar esta cita?'))return;
   await request('/appointments/'+id+'/'+action,{method:'POST'});message=action==='confirm'?'Solicitud confirmada.':'Cita cancelada.';await reload();return;
  }
  if(action==='copy-public'){
   await navigator.clipboard.writeText(location.origin+'/r/'+session!.business.slug);message='Enlace copiado.';render();return;
  }
  if(action==='public-slot'){selectedSlot=button.dataset.time??'';render();return}
 }catch(e){setError(e)}
}
async function change(event:Event){
 const input=event.target as HTMLInputElement;
 try{
  if(input.id==='live-day'){day=input.value;await reload()}
  if(input.id==='public-day'){publicParams.day=input.value;await loadSlots();render()}
  if(input.id==='public-service'){publicParams.serviceId=input.value;await loadSlots();render()}
  if(input.id==='public-professional'){publicParams.professionalId=input.value;await loadSlots();render()}
 }catch(e){setError(e)}
}
export async function startLiveApp(){
 if(!root)throw new Error('No existe el contenedor de la aplicación');
 root.addEventListener('click',e=>{void click(e)});
 root.addEventListener('change',e=>{void change(e)});
 root.addEventListener('submit',e=>{const f=e.target as HTMLFormElement;if(f.tagName!=='FORM')return;e.preventDefault();void submit(f).catch(setError)});
 if(location.pathname.startsWith('/r/')){try{await initPublic()}catch(e){setError(e)}return}
 try{session=await request<UserSession>('/me');await loadData()}catch(e){session=null;error=''}
 render();
}
