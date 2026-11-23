import type { Gateway,Snapshot,TopicInput,StudentInput,GroupInput,Topic,MaterialInput,AssignmentInput,SubmissionInput,GradeInput,LessonInput,Material } from './types.js';
import {safeExternalUrl,validateUpload,clampScore} from './security.js';
export class HttpError extends Error {constructor(public readonly status:number,message:string){super(message);this.name='HttpError';}}
const PREFIX='/api/v1';
let csrfFromSession:string|null=null;
/** Todas las solicitudes son same-origin. Cookies HttpOnly, Secure y SameSite las gestiona el servidor. */
async function request<T>(path:string,method='GET',body?:unknown):Promise<T>{
 const headers:Record<string,string>={'Accept':'application/json'};
 const csrf=document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content||csrfFromSession;
 if(method!=='GET'&&method!=='HEAD'){
  if(!csrf)throw new HttpError(503,'La API aún no ha proporcionado protección CSRF.');
  headers['X-CSRF-Token']=csrf;
  if(!(body instanceof FormData))headers['Content-Type']='application/json';
 }
 let response:Response;
 try{response=await fetch(`${PREFIX}${path}`,{method,credentials:'same-origin',redirect:'error',headers,body:body instanceof FormData?body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});}catch{throw new HttpError(503,'No es posible conectar con el servidor.');}
 if(!response.ok){let msg='La operación no se ha podido completar.';if(response.status===401)msg='Tu sesión ha caducado. Accede de nuevo.';if(response.status===403)msg='No tienes permiso para realizar esta operación.';throw new HttpError(response.status,msg);}
 if(response.status===204)return undefined as T;
 const type=response.headers.get('content-type')||'';
 if(!type.toLowerCase().includes('application/json'))throw new HttpError(502,'Respuesta inesperada del servidor.');
 return await response.json() as T;
}
function materialPayload(input:MaterialInput):FormData {
 const d=new FormData();d.set('title',input.title);d.set('description',input.description);d.set('kind',input.kind);
 if(input.groupId)d.set('groupId',input.groupId);if(input.studentId)d.set('studentId',input.studentId);if(input.subject)d.set('subject',input.subject);if(input.topicId)d.set('topicId',input.topicId);if(input.url){if(!safeExternalUrl(input.url))throw new Error('El enlace no es seguro.');d.set('url',input.url);}if(input.content)d.set('content',input.content);
 if(input.file){const err=validateUpload(input.file);if(err)throw new Error(err);d.set('file',input.file);}return d;
}
export class HttpGateway implements Gateway {
 async signIn(email:string,password:string){
  if(!email||!password)throw new HttpError(400,'Introduce tu correo y tu contraseña.');
  const session=await request<{csrfToken:string}>('/auth/csrf');
  if(!session?.csrfToken)throw new HttpError(503,'El servidor de autenticación no está configurado.');
  csrfFromSession=session.csrfToken;
  await request<void>('/auth/login','POST',{email,password});
 }
 async signOut(){await request('/auth/logout','POST');csrfFromSession=null;}
 async getSnapshot(){const snapshot=await request<Snapshot & {csrfToken?:string}>('/me/snapshot');csrfFromSession=snapshot.csrfToken||null;return snapshot;}
 async createStudent(input:StudentInput){await request('/students','POST',input);}
 async createGroup(input:GroupInput){await request('/groups','POST',input);}
 async createTopic(input:TopicInput){await request<Topic>('/topics','POST',input);}
 async updateTopic(id:string,input:Pick<Topic,'title'|'description'>){await request(`/topics/${encodeURIComponent(id)}`,'PATCH',input);}
 async addMaterial(input:MaterialInput){await request('/materials','POST',materialPayload(input));}
 async addAssignment(input:AssignmentInput){await request('/assignments','POST',input);}
 async submit(input:SubmissionInput){const d=new FormData();d.set('text',input.text);if(input.file){const err=validateUpload(input.file);if(err)throw new Error(err);d.set('file',input.file);}await request(`/assignments/${encodeURIComponent(input.assignmentId)}/submissions`,'POST',d);}
 async grade(input:GradeInput){await request(`/submissions/${encodeURIComponent(input.submissionId)}/grade`,'PATCH',{score:clampScore(input.score),feedback:input.feedback});}
 async saveLesson(input:LessonInput){await request('/lessons','POST',input);}
 async updateLesson(id:string,input:LessonInput){await request(`/lessons/${encodeURIComponent(id)}`,'PATCH',input);}
 async openSubmission(submission:{id:string}){const result=await request<{url:string}>(`/submissions/${encodeURIComponent(submission.id)}/access`);const url=safeExternalUrl(result.url);return url&&url.startsWith('https://')?url:null;}
 async openMaterial(material:Material){const result=await request<{url:string}>(`/materials/${encodeURIComponent(material.id)}/access`);const url=safeExternalUrl(result.url);return url&&url.startsWith('https://')?url:null;}
}
