import type {Snapshot,Assignment,Lesson,Submission,Group} from '../core/types.js';
import {escapeHtml as h} from '../core/security.js';
export {h};
export function eDate(value:string,full=false):string{const d=new Date(value.length===10?`${value}T12:00:00`:value);return Number.isNaN(d.getTime())?'Sin fecha':d.toLocaleDateString('es-ES',full?{weekday:'long',day:'numeric',month:'long'}:{day:'numeric',month:'short'});}
export function eTime(value:string):string {const d=new Date(value);return Number.isNaN(d.getTime())?'–':d.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'});}
export function plural(n:number,one:string,many:string):string{return `${n} ${n===1?one:many}`;}
export function groupAssignments(s:Snapshot,g:Group){return s.assignments.filter(x=>x.groupId===g.id);}
export function groupTopics(s:Snapshot,g:Group){return s.topics.filter(x=>x.groupId===g.id).sort((a,b)=>a.order-b.order);}
export function nextLesson(s:Snapshot):Lesson|undefined{return [...s.lessons].filter(l=>new Date(l.start).getTime()>=Date.now()-86400000).sort((a,b)=>a.start.localeCompare(b.start))[0]||[...s.lessons].sort((a,b)=>b.start.localeCompare(a.start))[0];}
export function studentName(s:Snapshot,id:string){return s.students.find(x=>x.id===id)?.name||'Alumno';}
export function assignmentName(s:Snapshot,id:string){return s.assignments.find(x=>x.id===id)?.title||'Actividad';}
export function pendingReviews(s:Snapshot):Submission[]{return s.submissions.filter(x=>x.status==='submitted');}
export function assignmentState(s:Snapshot,a:Assignment,studentId:string):string{return s.submissions.find(x=>x.assignmentId===a.id&&x.studentId===studentId)?.status==='reviewed'?'Calificada':s.submissions.find(x=>x.assignmentId===a.id&&x.studentId===studentId)?'Entregada':'Pendiente';}
export function groupName(s:Snapshot,id:string):string{return s.groups.find(g=>g.id===id)?.name||'Clase';}
export function dateInput(date:string):string{return date.slice(0,10);}
export function pill(text:string,kind='neutral'){return `<span class="pill pill-${kind}">${h(text)}</span>`;}
