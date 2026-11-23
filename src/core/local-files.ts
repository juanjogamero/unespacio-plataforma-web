/** IndexedDB únicamente para archivos ficticios del entorno de desarrollo. Nunca se despliega al VPS. */
const DB='unespacio-aula-dev-files';
function database():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  if(!('indexedDB' in globalThis)){reject(new Error('Tu navegador no permite almacenar archivos localmente.'));return;}
  const request=indexedDB.open(DB,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('files'))request.result.createObjectStore('files');};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(new Error('No se ha podido acceder al almacenamiento de archivos.'));
 });
}
export async function saveLocalFile(id:string,file:File):Promise<void>{
 if(file.size>3*1024*1024)throw new Error('En desarrollo, el límite por archivo es de 3 MB.');
 const db=await database();
 try{await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction('files','readwrite');tx.objectStore('files').put(file,id);
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(new Error('No se ha podido guardar el archivo.'));
 });}finally{db.close();}
}
export async function readLocalFile(id:string):Promise<File|null>{
 const db=await database();
 try{return await new Promise<File|null>((resolve,reject)=>{
  const tx=db.transaction('files','readonly');const request=tx.objectStore('files').get(id);
  request.onsuccess=()=>resolve(request.result instanceof File?request.result:null);
  request.onerror=()=>reject(new Error('No se ha podido leer el archivo.'));
 });}finally{db.close();}
}
