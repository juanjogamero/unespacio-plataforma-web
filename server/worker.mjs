/**
 * Worker independiente de emails. No se ejecuta dentro de GitHub Pages.
 * Debe desplegarse junto a la API con credenciales SMTP y PostgreSQL privadas.
 * La cola evita el reenvío normal por reinicios (entrega SMTP at-least-once).
 */
import nodemailer from 'nodemailer';
import {database} from './db.mjs';
import {scheduleReminders,scheduleDigests,processQueue} from './automations.mjs';

export function smtpSender(env=process.env){
 const required=['SMTP_HOST','SMTP_PORT','SMTP_FROM','SMTP_USER','SMTP_PASSWORD'];
 const missing=required.filter(k=>!env[k]);
 if(missing.length)throw new Error('No se puede enviar correo: faltan variables de SMTP configuradas');
 const port=Number(env.SMTP_PORT);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('SMTP_PORT incorrecto');
 const transport=nodemailer.createTransport({
  host:env.SMTP_HOST,port,secure:port===465,requireTLS:port!==465,
  auth:{user:env.SMTP_USER,pass:env.SMTP_PASSWORD},
  pool:true,maxConnections:2,maxMessages:50,
  tls:{minVersion:'TLSv1.2'}
 });
 const send=async({to,subject,text})=>{
  await transport.sendMail({from:env.SMTP_FROM,to,subject,text});
 };
 return {send,close:()=>transport.close()};
}
export async function runCycle(send,now=new Date()){
 const db=database();
 const reminders=await scheduleReminders(now,db);
 const digests=await scheduleDigests(now,db);
 const queue=await processQueue(send,{db,max:20});
 return {reminders,digests,...queue};
}
const direct=process.argv[1]&&new URL('file://'+process.argv[1]).pathname===new URL(import.meta.url).pathname;
if(direct){
 if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL es obligatorio');
 const {send,close}=smtpSender();
 let running=false;
 async function tick(){
  if(running)return;
  running=true;
  try{
   const result=await runCycle(send);
   console.log('Ciclo de avisos:',JSON.stringify(result)); // Solo contadores, nunca destinatarios.
  }catch{
   console.error('Fallo en ciclo de avisos; se reintentará sin publicar datos personales');
  }finally{running=false}
 }
 const timer=setInterval(()=>{void tick()},60000);
 timer.unref();
 await tick();
 const stop=async()=>{clearInterval(timer);close();await database().end();process.exit(0)};
 process.once('SIGTERM',()=>{void stop()});
 process.once('SIGINT',()=>{void stop()});
}
