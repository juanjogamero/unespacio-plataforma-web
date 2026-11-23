import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {assert} from './domain.mjs';
const {Pool}=pg;
let pool;
export function database(){
 assert(Boolean(process.env.DATABASE_URL),'Falta DATABASE_URL: no se puede iniciar una API real sin PostgreSQL',503);
 if(!pool){pool=new Pool({connectionString:process.env.DATABASE_URL,max:8,idleTimeoutMillis:30000,connectionTimeoutMillis:10000,ssl:process.env.DATABASE_SSL==='true'?{rejectUnauthorized:true}:undefined})}
 return pool;
}
export async function transaction(action){
 const client=await database().connect();
 try{await client.query('BEGIN');const out=await action(client);await client.query('COMMIT');return out}
 catch(error){await client.query('ROLLBACK');throw error}
 finally{client.release()}
}
export async function migrate(){
 const sql=await readFile(fileURLToPath(new URL('./schema.sql',import.meta.url)),'utf8');
 await database().query(sql);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===fileURLToPath(new URL('file://'+process.argv[1]))){
 await migrate();console.log('Esquema PostgreSQL instalado');
 await database().end();
}
