/** Toda cadena de origen externo se escapa antes de interpolarla en HTML. */
export function escapeHtml(value:unknown):string {
 return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] ?? c));
}
/** Aceptamos enlaces de contenido HTTP(S), nunca javascript:, data:, file: o blob:. */
export function safeExternalUrl(raw:string):string|null {
 try {const u=new URL(raw);return ['https:','http:'].includes(u.protocol) ? u.href : null;}catch{return null;}
}
export function validateUpload(file:File):string|null {
 const max=10*1024*1024;
 if(file.size>max)return 'El archivo supera los 10 MB permitidos en este formulario.';
 const allowed=['application/pdf','image/jpeg','image/png','image/webp','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
 if(!allowed.includes(file.type))return 'Formato no admitido. Usa PDF, DOCX, TXT, JPG, PNG o WebP.';
 return null;
}
export function clampScore(value:number):number {
 if(!Number.isFinite(value)||value<0||value>10)throw new Error('La nota debe estar entre 0 y 10.');
 return Math.round(value*10)/10;
}
/** Se aplica a filtros de pantalla: NO sustituye comprobaciones de permisos del servidor. */
export function filterByWorkspace<T extends {workspaceId:string}>(rows:T[],workspaceId:string):T[]{return rows.filter(x=>x.workspaceId===workspaceId);}
