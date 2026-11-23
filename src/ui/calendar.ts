import type {Snapshot,Lesson,Assignment} from '../core/types.js';
import {icon} from './icons.js';
import {h,eTime} from './helpers.js';

/** Calendario de interfaz. Solo organiza las sesiones y plazos recibidos del Gateway. */
const dateKey=(value:string)=>value.slice(0,10);
const parseDate=(day:string)=>new Date(`${day}T12:00:00`);
const isoDate=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const now=new Date();
let selected=isoDate(now),visibleMonth=new Date(now.getFullYear(),now.getMonth(),1),mode:'month'|'week'='month';
const weekdays=['L','M','X','J','V','S','D'];
export type CalendarEvent={key:string;kind:'lesson'|'deadline';title:string;detail:string;href:string;time?:string};
export function calendarEvents(s:Snapshot):CalendarEvent[]{
 const lessons=s.lessons.map((l:Lesson)=>({key:dateKey(l.start),kind:'lesson' as const,title:l.groupId?(s.groups.find(g=>g.id===l.groupId)?.name||l.subject):l.subject,detail:`${eTime(l.start)}–${eTime(l.end)} · ${l.subject}`,time:l.start,href:s.session.role==='student'?`#/agenda?dia=${dateKey(l.start)}`:l.groupId?`#/clases/${encodeURIComponent(l.groupId)}?tab=sesiones`:`#/alumnos/${encodeURIComponent(l.studentId||'')}`}));
 const deadlines=s.assignments.map((a:Assignment)=>({key:dateKey(a.dueDate),kind:'deadline' as const,title:a.title,detail:`Entrega · ${a.subject||'Actividad'}`,time:'',href:`#/actividades/${encodeURIComponent(a.id)}`}));
 return [...lessons,...deadlines].sort((a,b)=>a.key.localeCompare(b.key)||String(a.time||'').localeCompare(String(b.time||'')));
}
export function calendarSelectedDate(){return selected;}
export function calendarMove(direction:number){
 if(mode==='week'){
  const d=parseDate(selected);d.setDate(d.getDate()+direction*7);selected=isoDate(d);visibleMonth=new Date(d.getFullYear(),d.getMonth(),1);
 }else{
  visibleMonth=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+direction,1);
  // Mantener un día seleccionado visible al recorrer los meses.
  const date=parseDate(selected);selected=isoDate(new Date(visibleMonth.getFullYear(),visibleMonth.getMonth(),Math.min(date.getDate(),new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+1,0).getDate())));
 }
}
export function calendarMoveMonth(direction:number){
 visibleMonth=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+direction,1);
 const day=parseDate(selected).getDate();
 selected=isoDate(new Date(visibleMonth.getFullYear(),visibleMonth.getMonth(),Math.min(day,new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+1,0).getDate())));
}
export function calendarChoose(value:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return;
 const d=parseDate(value);if(Number.isNaN(d.getTime())||isoDate(d)!==value)return;
 selected=value;visibleMonth=new Date(d.getFullYear(),d.getMonth(),1);
}
export function calendarSetView(value:string){if(value==='month'||value==='week')mode=value;}
export function calendarGoToday(){const d=new Date();selected=isoDate(d);visibleMonth=new Date(d.getFullYear(),d.getMonth(),1);}
export function calendarResetForTests(day:string){calendarChoose(day);mode='month';}
function monthLabel(date:Date){return date.toLocaleDateString('es-ES',{month:'long',year:'numeric'});}
function monthDays(){const first=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth(),1),offset=(first.getDay()+6)%7;const start=new Date(first);start.setDate(1-offset);const days:Date[]=[];const end=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+1,0);const rows=Math.ceil((offset+end.getDate())/7);for(let i=0;i<rows*7;i++){const d=new Date(start);d.setDate(start.getDate()+i);days.push(d)}return days;}
function weekDays(){const d=parseDate(selected);d.setDate(d.getDate()-(d.getDay()+6)%7);return Array.from({length:7},(_,i)=>{const x=new Date(d);x.setDate(d.getDate()+i);return x});}
function selectedSummary(s:Snapshot,limit=4){
 const events=calendarEvents(s).filter(x=>x.key===selected);
 return `<div class="work-calendar-agenda"><div class="work-calendar-daytop"><div><small>AGENDA DEL DÍA</small><h3>${h(parseDate(selected).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'}))}</h3></div><span class="work-calendar-total">${events.length} ${events.length===1?'evento':'eventos'}</span></div><div class="work-calendar-events">${events.length?events.slice(0,limit).map(ev=>`<a class="work-calendar-event ${ev.kind}" href="${h(ev.href)}"><span class="work-calendar-event-mark">${icon(ev.kind==='lesson'?'clock':'tasks',17)}</span><span><strong>${h(ev.title)}</strong><small>${h(ev.detail)}</small></span>${icon('right',16)}</a>`).join(''):`<div class="work-calendar-empty">No hay clases ni entregas previstas para este día.</div>`}</div></div>`;
}
export function calendarWidget(s:Snapshot,compact=false):string{
 const events=calendarEvents(s),byDay=new Map<string,Set<string>>();for(const e of events){if(!byDay.has(e.key))byDay.set(e.key,new Set());byDay.get(e.key)!.add(e.kind)}
 const today=isoDate(new Date());
 const dates=compact||mode==='month'?monthDays():weekDays();
 const title=compact?monthLabel(visibleMonth):mode==='week'?`${dates[0]!.toLocaleDateString('es-ES',{day:'numeric',month:'short'})} – ${dates.at(-1)!.toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})}`:monthLabel(visibleMonth);
 return `<section class="work-calendar ${compact?'work-calendar-compact':'work-calendar-full'}" aria-label="Calendario interactivo"><div class="work-calendar-header"><div><span class="work-overline">${compact?'MI CALENDARIO':'CALENDARIO ACADÉMICO'}</span><h2>${compact?'Tu planificación':'Agenda y entregas'}</h2></div>${compact?`<a class="work-icon-soft" href="#/agenda" aria-label="Abrir agenda completa">${icon('arrow',18)}</a>`:`<button type="button" class="work-calendar-today" data-action="calendar-today">Hoy</button>`}</div><div class="work-calendar-nav"><strong aria-live="polite">${h(title)}</strong><div class="work-calendar-nav-actions">${!compact?`<div class="work-calendar-switch" role="group" aria-label="Vista del calendario"><button type="button" data-action="calendar-view" data-id="month" aria-pressed="${mode==='month'}" class="${mode==='month'?'is-active':''}">Mes</button><button type="button" data-action="calendar-view" data-id="week" aria-pressed="${mode==='week'}" class="${mode==='week'?'is-active':''}">Semana</button></div>`:''}<button type="button" class="work-icon-soft" data-action="${compact?'calendar-prev-month':'calendar-prev'}" aria-label="Periodo anterior">${icon('left',18)}</button><button type="button" class="work-icon-soft" data-action="${compact?'calendar-next-month':'calendar-next'}" aria-label="Periodo siguiente">${icon('right',18)}</button></div></div><div class="work-calendar-grid" role="group" aria-label="Seleccionar día">${weekdays.map(w=>`<span class="work-calendar-weekday" aria-hidden="true">${w}</span>`).join('')}${dates.map(d=>{const date=isoDate(d),classes=byDay.get(date),isCurrent=d.getMonth()===visibleMonth.getMonth();return `<button class="work-calendar-cell ${date===selected?'is-selected':''} ${date===today?'is-today':''} ${isCurrent?'':'is-outside'}" data-action="calendar-select" data-id="${date}" type="button" aria-label="${h(d.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'}))}${classes?.size?' · con eventos':''}" aria-pressed="${date===selected}" ${date===today?'aria-current="date"':''}><span>${d.getDate()}</span><span class="work-calendar-dots" aria-hidden="true">${classes?.has('lesson')?'<i class="lesson"></i>':''}${classes?.has('deadline')?'<i class="deadline"></i>':''}</span></button>`}).join('')}</div><div class="work-calendar-legend"><span><i class="lesson"></i> Clase</span><span><i class="deadline"></i> Entrega</span></div>${selectedSummary(s,compact?3:10)}${compact?`<a href="#/agenda" class="work-calendar-footer">Abrir calendario completo ${icon('arrow',15)}</a>`:''}</section>`;
}
export function calendarPage(s:Snapshot):string{return `<div class="work-calendar-page"><header class="work-page-head"><div><span class="work-overline">TU TIEMPO, EN ORDEN</span><h1>Calendario</h1><p>Selecciona un día para ver las clases y los plazos de entrega.</p></div></header><div class="work-calendar-page-grid">${calendarWidget(s)}<aside class="work-calendar-upcoming"><div class="work-overline">PRÓXIMOS EVENTOS</div><h2>A continuación</h2>${calendarEvents(s).filter(x=>x.key>=isoDate(new Date())).slice(0,7).map(ev=>`<a href="${h(ev.href)}" class="work-upcoming-item"><span class="work-upcoming-date">${h(parseDate(ev.key).toLocaleDateString('es-ES',{day:'2-digit',month:'short'}))}</span><span><strong>${h(ev.title)}</strong><small>${h(ev.detail)}</small></span>${icon('right',16)}</a>`).join('')||'<p class="work-calendar-empty">Sin eventos próximos.</p>'}<div class="work-calendar-help">${icon('info',17)}<p>Las sesiones y las fechas de entrega aparecen automáticamente cuando tu profesor las programa.</p></div></aside></div></div>`;}
