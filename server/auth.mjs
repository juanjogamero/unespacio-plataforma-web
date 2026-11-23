import {randomBytes,scryptSync,createHash,timingSafeEqual} from 'node:crypto';
import {database,transaction} from './db.mjs';
import {assert,nonEmpty,validEmail,validSlug} from './domain.mjs';
const hashToken=token=>createHash('sha256').update(token).digest('hex');
const token=()=>randomBytes(32).toString('base64url');
export function hashPassword(password){
 assert(typeof password==='string'&&password.length>=12&&password.length<=128,'Usa una contraseña de 12 a 128 caracteres');
 const salt=randomBytes(16).toString('hex');
 return 'scrypt$'+salt+'$'+scryptSync(password,Buffer.from(salt,'hex'),64).toString('hex');
}
export function verifyPassword(password,stored){
 if(typeof password!=='string'||typeof stored!=='string')return false;
 const parts=stored.split('$');if(parts.length!==3||parts[0]!=='scrypt')return false;
 try{const digest=Buffer.from(parts[2],'hex');if(digest.length!==64)return false;
 const test=scryptSync(password,Buffer.from(parts[1],'hex'),64);
 return timingSafeEqual(test,digest);
 }catch{return false}
}
export async function newSession(db,userId,businessId){
 const sid=token(),csrf=token();
 await db.query("INSERT INTO sessions(token_hash,csrf_hash,user_id,business_id,expires_at) VALUES($1,$2,$3,$4,now()+interval '7 days')",[hashToken(sid),hashToken(csrf),userId,businessId]);
 return {sid,csrf};
}
export function cookieName(){return process.env.NODE_ENV==='production'?'__Host-unespacio_sid':'unespacio_sid'}
export function cookieHeader(sid,clear=false){
 const secure=process.env.NODE_ENV==='production'?'; Secure':'';
 return cookieName()+'='+(clear?'':encodeURIComponent(sid))+'; Path=/; HttpOnly; SameSite=Lax'+secure+(clear?'; Max-Age=0':'; Max-Age=604800');
}
export async function register(body){
 const {email,password,slug,businessName,professionalName}=body;
 assert(validEmail(email),'Correo electrónico incorrecto');
 assert(validSlug(slug),'El identificador debe tener 3-50 letras minúsculas, números o guiones');
 assert(nonEmpty(businessName,2,100),'Escribe el nombre del negocio');
 assert(nonEmpty(professionalName,2,80),'Escribe tu nombre profesional');
 const passwordHash=hashPassword(password);
 return transaction(async db=>{
  const b=await db.query("INSERT INTO businesses(slug,name) VALUES($1,$2) RETURNING id,name,slug",[slug,businessName.trim()]);
  const u=await db.query("INSERT INTO users(email,password_hash) VALUES($1,$2) RETURNING id,email",[email.toLowerCase().trim(),passwordHash]);
  const business=b.rows[0],user=u.rows[0];
  await db.query("INSERT INTO memberships(business_id,user_id,role) VALUES($1,$2,'owner')",[business.id,user.id]);
  await db.query("INSERT INTO professionals(business_id,name) VALUES($1,$2)",[business.id,professionalName.trim()]);
  for(const day of [1,2,3,4,5]){
   await db.query("INSERT INTO business_hours(business_id,weekday,slot,open_min,close_min) VALUES($1,$2,1,540,840),($1,$2,2,960,1200)",[business.id,day]);
  }
  await db.query("INSERT INTO business_hours(business_id,weekday,slot,open_min,close_min) VALUES($1,6,1,540,840)",[business.id]);
  return {business,user,...await newSession(db,user.id,business.id)};
 });
}
export async function login(body){
 const email=typeof body.email==='string'?body.email.toLowerCase().trim():'';
 const password=body.password;
 const slug=typeof body.slug==='string'?body.slug.trim():'';
 assert(validEmail(email)&&validSlug(slug)&&typeof password==='string','Credenciales incorrectas',401);
 const {rows}=await database().query('SELECT u.id,u.email,u.password_hash,b.id AS business_id,b.slug,b.name FROM users u JOIN memberships m ON m.user_id=u.id JOIN businesses b ON b.id=m.business_id WHERE u.email=$1 AND b.slug=$2',[email,slug]);
 const person=rows[0];
 if(!person||!verifyPassword(password,person.password_hash))throw Object.assign(new Error('Credenciales incorrectas'),{status:401});
 const session=await newSession(database(),person.id,person.business_id);
 return {sid:session.sid,csrf:session.csrf,user:{id:person.id,email:person.email},business:{id:person.business_id,slug:person.slug,name:person.name}};
}
function parseCookie(header){
 const name=cookieName()+'=';
 const part=(header||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name));
 if(!part)return '';
 try{return decodeURIComponent(part.slice(name.length))}catch{return ''}
}
export async function authenticate(req){
 const sid=parseCookie(req.headers.cookie);
 if(!sid||sid.length>100)return null;
 const {rows}=await database().query('SELECT s.token_hash,s.csrf_hash,s.user_id,s.business_id,u.email,m.role,b.slug,b.name,b.timezone,b.public_booking_enabled,b.privacy_url FROM sessions s JOIN users u ON s.user_id=u.id JOIN memberships m ON m.business_id=s.business_id AND m.user_id=s.user_id JOIN businesses b ON b.id=s.business_id WHERE s.token_hash=$1 AND s.expires_at>now()',[hashToken(sid)]);
 return rows[0]??null;
}
export function requireCSRF(req,session){
 const supplied=req.headers['x-csrf-token'];
 assert(typeof supplied==='string'&&supplied.length>=32&&supplied.length<200,'Falta el token de seguridad',403);
 const actual=Buffer.from(hashToken(supplied),'hex'),expected=Buffer.from(session.csrf_hash,'hex');
 assert(timingSafeEqual(actual,expected),'Token de seguridad incorrecto',403);
}
export async function logout(req,session){
 requireCSRF(req,session);
 await database().query('DELETE FROM sessions WHERE token_hash=$1',[session.token_hash]);
}
export async function sessionCSRF(session){
 const csrf=token();
 await database().query('UPDATE sessions SET csrf_hash=$2 WHERE token_hash=$1',[session.token_hash,hashToken(csrf)]);
 return csrf;
}
