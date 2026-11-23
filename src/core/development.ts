import type {Gateway, Snapshot,Role,Session,Student,Group,Topic,Material,Assignment,Submission,Lesson,Notice,TopicInput,StudentInput,GroupInput,MaterialInput,AssignmentInput,SubmissionInput,GradeInput,LessonInput } from './types.js';
import {clampScore,safeExternalUrl,validateUpload} from './security.js';
import {saveLocalFile,readLocalFile} from './local-files.js';
const ACADEMY='academy-olivar';const PRIVATE='profesor-particular';
const USERS:Record<Role,Session>={
 'academy-teacher':{userId:'nora',name:'Nora Reyes',initials:'NR',role:'academy-teacher',workspaceId:ACADEMY,workspaceName:'Academia Olivar'},
 'academy-admin':{userId:'admin',name:'Ana Cortés',initials:'AC',role:'academy-admin',workspaceId:ACADEMY,workspaceName:'Academia Olivar'},
 'private-teacher':{userId:'daniel',name:'Daniel Ruiz',initials:'DR',role:'private-teacher',workspaceId:PRIVATE,workspaceName:'Espacio de Daniel'},
 'student':{userId:'lucia',name:'Lucía Martín',initials:'LM',role:'student',workspaceId:PRIVATE,workspaceName:'Clases particulares'}
};
const groups:Group[]=[
 {id:'g1',workspaceId:ACADEMY,name:'Inglés · 1.º ESO',subject:'Inglés',level:'1.º ESO',teacherId:'nora',studentIds:['sofia','hugo'],color:'blue',description:'Refuerzo de inglés y práctica semanal'},
 {id:'g2',workspaceId:ACADEMY,name:'Inglés B1',subject:'Inglés',level:'B1',teacherId:'nora',studentIds:['sofia','hugo','ines'],color:'violet',description:'Conversación y gramática de nivel B1'},
 {id:'g3',workspaceId:ACADEMY,name:'Matemáticas · 2.º ESO',subject:'Matemáticas',level:'2.º ESO',teacherId:'otro',studentIds:['hugo','ines'],color:'teal',description:'Refuerzo de matemáticas'}
];
const students:Student[]=[
 {id:'sofia',workspaceId:ACADEMY,name:'Sofía López',initials:'SL',level:'1.º ESO',subjects:['Inglés']},
 {id:'hugo',workspaceId:ACADEMY,name:'Hugo Romero',initials:'HR',level:'2.º ESO',subjects:['Inglés','Matemáticas']},
 {id:'ines',workspaceId:ACADEMY,name:'Inés Vidal',initials:'IV',level:'B1',subjects:['Inglés']},
 {id:'lucia',workspaceId:PRIVATE,name:'Lucía Martín',initials:'LM',level:'2.º ESO',subjects:['Matemáticas','Inglés']},
 {id:'marcos',workspaceId:PRIVATE,name:'Marcos Fernández',initials:'MF',level:'3.º ESO',subjects:['Matemáticas']}
];
const topics:Topic[]=[
 {id:'t1',groupId:'g1',title:'Primeros pasos',description:'Presentaciones y vocabulario',order:1},
 {id:'t2',groupId:'g1',title:'Daily routines',description:'Rutinas y presente simple',order:2},
 {id:'t3',groupId:'g2',title:'Speaking & everyday life',description:'Listening y conversación',order:1},
 {id:'t4',groupId:'g2',title:'Grammar lab',description:'Present perfect',order:2},
 {id:'t5',groupId:'g3',title:'Ecuaciones',description:'Ecuaciones de primer grado',order:1}
];
const materials:Material[]=[
 {id:'m1',groupId:'g1',topicId:'t1',title:'Guía de inicio',description:'Presentación de la materia y calendario',kind:'text',content:'Esta unidad reúne las primeras actividades para practicar inglés.'},
 {id:'m2',groupId:'g1',topicId:'t2',title:'Vocabulario de la unidad',description:'Lectura y práctica',kind:'link',url:'https://www.britishcouncil.org/school-resources'},
 {id:'m3',groupId:'g2',topicId:'t3',title:'Expresiones de conversación',description:'Material de repaso',kind:'text',content:'Practica cómo hablar de tus actividades cotidianas.'},
 {id:'m4',studentId:'lucia',subject:'Matemáticas',title:'Ecuaciones de primer grado',description:'Apuntes para la próxima sesión',kind:'text',content:'Recuerda despejar la incógnita realizando la misma operación en ambos miembros.'},
 {id:'m5',studentId:'lucia',subject:'Inglés',title:'Vocabulario · Unit 3',description:'Repaso de vocabulario',kind:'text',content:'Repasa la lista de palabras y completa dos ejemplos.'}
];
const assignments:Assignment[]=[
 {id:'a1',groupId:'g1',topicId:'t2',title:'My daily routine',instructions:'Escribe entre 6 y 10 frases describiendo tu rutina diaria.',dueDate:'2026-11-23',maxScore:10,createdBy:'nora'},
 {id:'a2',groupId:'g2',topicId:'t3',title:'Speaking: my week',instructions:'Prepara un texto breve sobre tu semana y súbelo en la actividad.',dueDate:'2026-11-26',maxScore:10,createdBy:'nora'},
 {id:'a3',studentId:'lucia',subject:'Matemáticas',title:'Resolver ejercicios 4 y 5',instructions:'Resuelve los ejercicios 4 y 5 del cuaderno y explica los pasos.',dueDate:'2026-11-24',maxScore:10,createdBy:'daniel'}
];
const submissions:Submission[]=[
 {id:'sub1',assignmentId:'a1',studentId:'hugo',text:'I usually wake up at seven and walk to school.',status:'submitted',submittedAt:'2026-11-18T12:30:00'},
 {id:'sub2',assignmentId:'a1',studentId:'sofia',text:'Every morning I have breakfast and go to class.',status:'reviewed',submittedAt:'2026-11-18T10:10:00',score:9,feedback:'Muy buen trabajo, Sofía.'}
];
const lessons:Lesson[]=[
 {id:'l1',groupId:'g1',subject:'Inglés',start:'2026-11-19T18:00:00',end:'2026-11-19T19:00:00',preparation:'Practicar el presente simple y revisar la actividad My daily routine.',recurring:true},
 {id:'l2',groupId:'g1',subject:'Inglés',start:'2026-11-26T18:00:00',end:'2026-11-26T19:00:00',recurring:true},
 {id:'l3',groupId:'g2',subject:'Inglés',start:'2026-11-20T17:00:00',end:'2026-11-20T18:00:00'},
 {id:'l4',studentId:'lucia',subject:'Matemáticas',start:'2026-11-17T17:00:00',end:'2026-11-17T18:00:00',summary:'Ecuaciones de primer grado. Quedaron pendientes los ejercicios 4 y 5.',nextStep:'Corregir ejercicios y comenzar ecuaciones con paréntesis.',recurring:true},
 {id:'l5',studentId:'lucia',subject:'Matemáticas',start:'2026-11-24T17:00:00',end:'2026-11-24T18:00:00',preparation:'Revisar ejercicios 4 y 5 y preparar ecuaciones con paréntesis.',recurring:true},
 {id:'l6',studentId:'lucia',subject:'Inglés',start:'2026-11-25T18:00:00',end:'2026-11-25T19:00:00',recurring:true},
 {id:'l7',studentId:'marcos',subject:'Matemáticas',start:'2026-11-20T16:00:00',end:'2026-11-20T17:00:00',recurring:true}
];
const notices:Notice[]=[
 {id:'n1',groupId:'g1',title:'Material nuevo disponible',body:'Ya podéis consultar el vocabulario de la unidad.',date:'2026-11-18'},
 {id:'n2',groupId:'g2',title:'Próxima clase',body:'Repasaremos speaking y comprensión oral.',date:'2026-11-17'}
];
let uid=300;
/** Solo GitHub Pages de desarrollo: almacenamiento local ficticio sin autenticación. No incluido en producción. */
export class DevelopmentGateway implements Gateway {
 private role:Role|null=null;
 constructor(){this.restore();}
 private restore(){
  try{
   const raw=localStorage.getItem('unespacio.dev.data.v1');
   if(raw){const saved=JSON.parse(raw);
    if(saved&&['topics','materials','assignments','submissions','lessons','students','groups'].every(k=>Array.isArray(saved[k]))){
     topics.splice(0,topics.length,...saved.topics);materials.splice(0,materials.length,...saved.materials);
     assignments.splice(0,assignments.length,...saved.assignments);submissions.splice(0,submissions.length,...saved.submissions);lessons.splice(0,lessons.length,...saved.lessons);students.splice(0,students.length,...saved.students);groups.splice(0,groups.length,...saved.groups);
     uid=Number.isSafeInteger(saved.uid)&&saved.uid>300?saved.uid:300;
    }
   }
   const r=sessionStorage.getItem('unespacio.dev.session.v1');
   if(r&&Object.prototype.hasOwnProperty.call(USERS,r))this.role=r as Role;
  }catch{ /* Datos ficticios dañados: conservar estado inicial */ }
 }
 private persist(){try{localStorage.setItem('unespacio.dev.data.v1',JSON.stringify({topics,materials,assignments,submissions,lessons,students,groups,uid}));}catch{throw new Error('El navegador no permite guardar cambios. Revisa el almacenamiento disponible.');}}
 signOut(){this.role=null;try{sessionStorage.removeItem('unespacio.dev.session.v1')}catch{}}

 private uploads=new Map<string,File>();
 setRole(role:Role){if(!(role in USERS))throw new Error('Cuenta de desarrollo desconocida.');this.role=role;sessionStorage.setItem('unespacio.dev.session.v1',role);}
 getRole(){return this.role;}
 async getSnapshot():Promise<Snapshot>{
  if(!this.role)throw new Error('Selecciona una cuenta para acceder al entorno de desarrollo.');
  const session=structuredClone(USERS[this.role]);
  const isStudent=session.role==='student',isPrivate=session.role==='private-teacher';
  const allowedGroups=groups.filter(g=>session.role==='academy-admin'&&g.workspaceId===ACADEMY||session.role==='academy-teacher'&&g.teacherId===session.userId);
  const allowedStudents=students.filter(s=>isStudent?s.id==='lucia':isPrivate?s.workspaceId===PRIVATE:s.workspaceId===ACADEMY);
  const studentIds=new Set(allowedStudents.map(s=>s.id));const groupIds=new Set(allowedGroups.map(g=>g.id));
  const relevant=(x:{groupId?:string;studentId?:string})=>(x.groupId!==undefined&&groupIds.has(x.groupId))||(x.studentId!==undefined&&studentIds.has(x.studentId));
  return structuredClone({session,groups:allowedGroups,students:allowedStudents,topics:topics.filter(t=>groupIds.has(t.groupId)),materials:materials.filter(relevant),assignments:assignments.filter(relevant),submissions:submissions.filter(s=>assignments.filter(relevant).some(a=>a.id===s.assignmentId)&&(!isStudent||s.studentId==='lucia')),lessons:lessons.filter(relevant),notices:notices.filter(n=>n.groupId&&groupIds.has(n.groupId))});
 }
 async createStudent(input:StudentInput){
  if(this.role!=='academy-admin'&&this.role!=='private-teacher')throw new Error('No tienes permiso para crear alumnos.');
  const name=input.name.trim();const level=input.level.trim();const subjects=input.subjects.map(x=>x.trim()).filter(Boolean);
  if(name.length<3||name.length>120||!level||!subjects.length)throw new Error('Completa nombre, nivel y materias.');
  const id=`stu${uid++}`;students.push({id,workspaceId:this.role==='private-teacher'?PRIVATE:ACADEMY,name,level,subjects,initials:name.split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()});this.persist();
 }
 async createGroup(input:GroupInput){
  if(this.role!=='academy-admin')throw new Error('Solo administración puede crear grupos.');
  const name=input.name.trim(),subject=input.subject.trim(),level=input.level.trim();
  if(name.length<3||!subject||!level)throw new Error('Completa el grupo, nivel y asignatura.');
  if(input.studentIds.some(id=>!students.some(st=>st.id===id&&st.workspaceId===ACADEMY)))throw new Error('Hay alumnos que no pertenecen a la academia.');
  if(input.teacherId!=='nora')throw new Error('El profesor no está disponible en este espacio de desarrollo.');
  groups.push({id:`grp${uid++}`,workspaceId:ACADEMY,name,subject,level,teacherId:input.teacherId,studentIds:[...new Set(input.studentIds)],color:input.color,description:input.description.trim()});this.persist();
 }
 private requireTeacher(){if(!this.role||this.role==='student')throw new Error('Esta acción corresponde al profesorado.');}
 private requireGroup(groupId:string){if(this.role==='private-teacher'||this.role==='student'||(this.role==='academy-teacher'&&!groups.some(g=>g.id===groupId&&g.teacherId==='nora')))throw new Error('No puedes modificar esta clase con la cuenta actual.');}
 private validateScope(input:{groupId?:string;studentId?:string}){if(input.groupId)this.requireGroup(input.groupId);else if(input.studentId){if(this.role!=='private-teacher'||!students.some(s=>s.id===input.studentId&&s.workspaceId===PRIVATE))throw new Error('No puedes modificar ese alumno.');}else throw new Error('Selecciona una clase o un alumno.');}
 async createTopic(input:TopicInput){this.requireTeacher();this.requireGroup(input.groupId);const title=input.title.trim();if(title.length<2||title.length>100)throw new Error('Introduce un título entre 2 y 100 caracteres.');topics.push({id:`t${uid++}`,groupId:input.groupId,title,description:input.description.slice(0,500),order:topics.filter(t=>t.groupId===input.groupId).length+1});this.persist();}
 async updateTopic(id:string,input:Pick<Topic,'title'|'description'>){this.requireTeacher();const topic=topics.find(t=>t.id===id);if(!topic)throw new Error('Tema no encontrado.');this.requireGroup(topic.groupId);if(input.title.trim().length<2)throw new Error('El título es demasiado corto.');topic.title=input.title.trim().slice(0,100);topic.description=input.description.slice(0,500);this.persist();}
 async addMaterial(input:MaterialInput){this.requireTeacher();this.validateScope(input);if(input.kind==='link'&&!safeExternalUrl(input.url||''))throw new Error('Introduce un enlace HTTPS o HTTP válido.');if(input.kind==='file'&&!input.file)throw new Error('Selecciona un archivo.');if(input.file){const err=validateUpload(input.file);if(err)throw new Error(err);}const id=`m${uid++}`;materials.push({id,...{groupId:input.groupId,studentId:input.studentId,subject:input.subject,topicId:input.topicId,title:input.title.trim(),description:input.description.trim(),kind:input.kind,url:input.url,content:input.content,fileName:input.file?.name}});if(input.file){await saveLocalFile(`material:${id}`,input.file);this.uploads.set(id,input.file);}this.persist();}
 async addAssignment(input:AssignmentInput){this.requireTeacher();this.validateScope(input);if(input.title.trim().length<2||!input.dueDate)throw new Error('Indica un título y fecha de entrega.');assignments.push({id:`a${uid++}`,...input,title:input.title.trim(),maxScore:10,createdBy:USERS[this.role!].userId});this.persist();}
 async submit(input:SubmissionInput){if(this.role!=='student')throw new Error('Solo los alumnos pueden entregar una tarea.');const assignment=assignments.find(a=>a.id===input.assignmentId);if(!assignment||assignment.studentId!=='lucia')throw new Error('No tienes acceso a esta actividad.');if(!input.text.trim()&&!input.file)throw new Error('Introduce una respuesta o adjunta un archivo.');if(input.file){const err=validateUpload(input.file);if(err)throw new Error(err);}const existing=submissions.find(s=>s.assignmentId===input.assignmentId&&s.studentId==='lucia');if(existing&&existing.status==='reviewed')throw new Error('La actividad ya está calificada.');if(input.file)await saveLocalFile(`submission:${input.assignmentId}:lucia`,input.file);
  if(existing){existing.text=input.text;existing.submittedAt=new Date().toISOString();if(input.file)existing.fileName=input.file.name;}
  else submissions.push({id:`sub${uid++}`,assignmentId:input.assignmentId,studentId:'lucia',text:input.text,status:'submitted',submittedAt:new Date().toISOString(),fileName:input.file?.name});
  this.persist();}
 async grade(input:GradeInput){this.requireTeacher();const s=submissions.find(s=>s.id===input.submissionId),a=s&&assignments.find(a=>a.id===s.assignmentId);if(!s||!a)throw new Error('Entrega no encontrada.');this.validateScope(a);s.score=clampScore(input.score);s.feedback=input.feedback.slice(0,2000);s.status='reviewed';this.persist();}
 async saveLesson(input:LessonInput){this.requireTeacher();this.validateScope(input);if(!input.subject||!input.start||!input.end)throw new Error('Completa la materia y las fechas.');
 const start=new Date(input.start),end=new Date(input.end);
 if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<=start)throw new Error('La finalización debe ser posterior al inicio.');
 const fmt=(d:Date)=>{const p=(n:number)=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes());};
 const total=input.recurring?8:1;
 for(let i=0;i<total;i++){const a=new Date(start),b=new Date(end);a.setDate(start.getDate()+7*i);b.setDate(end.getDate()+7*i);lessons.push({id:`l${uid++}`,...input,start:fmt(a),end:fmt(b),recurring:!!input.recurring});}
 this.persist();}
 async updateLesson(id:string,input:LessonInput){this.requireTeacher();const lesson=lessons.find(x=>x.id===id);if(!lesson)throw new Error('Sesión no encontrada.');this.validateScope(lesson);Object.assign(lesson,input);this.persist();}
 async openSubmission(submission:Submission){const file=await readLocalFile(`submission:${submission.assignmentId}:${submission.studentId}`);return file?URL.createObjectURL(file):null;}
 async openMaterial(material:Material){if(material.kind==='file'){const file=this.uploads.get(material.id)||await readLocalFile(`material:${material.id}`);return file?URL.createObjectURL(file):null;}return material.kind==='link'?safeExternalUrl(material.url||''):null;}
}
