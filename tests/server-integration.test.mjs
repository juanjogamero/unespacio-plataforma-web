import test from 'node:test';
import assert from 'node:assert/strict';
import {database,migrate} from '../server/db.mjs';
import {register,authenticate,requireCSRF} from '../server/auth.mjs';
import {daysFrom,weekday,localDate} from '../server/domain.mjs';
import {createApp} from '../server/app.mjs';
import {saveManual,agenda,businessBySlug,requestPublic,confirmRequest,freeSlots,dbConflict} from '../server/booking.mjs';
const slug='ci-unspace-'+Math.random().toString(36).slice(2,12);
const slug2='ci-other-'+Math.random().toString(36).slice(2,12);
const email=slug+'@example.invalid';
const email2=slug2+'@example.invalid';
const today=localDate('Europe/Madrid');
const day=daysFrom(today,((8-weekday(today))%7)||7); // próximo lunes, siempre dentro del horizonte de reserva
test('PostgreSQL: aislamiento multiempresa y exclusión de reservas concurrentes',async()=>{
 assert.ok(process.env.DATABASE_URL,'Requiere DATABASE_URL en CI');
 await migrate();
 await migrate(); // La migración debe ser idempotente.
 let b1,b2;
 try{
  const a=await register({email,password:'FraseSeguraDePrueba35',slug,businessName:'Barbería de Prueba',professionalName:'Manolo'});
  const b=await register({email:email2,password:'FraseSeguraDePrueba45',slug:slug2,businessName:'Otra barbería',professionalName:'Alicia'});
  b1=a.business.id;b2=b.business.id;
  const db=database();
  const pro=(await db.query('SELECT id FROM professionals WHERE business_id=$1',[b1])).rows[0].id;
  const other=(await db.query('SELECT id FROM professionals WHERE business_id=$1',[b2])).rows[0].id;
  const svc=(await db.query("INSERT INTO services(business_id,name,minutes,price_cents) VALUES($1,'Corte clásico',30,1500) RETURNING id",[b1])).rows[0].id;
  const svc2=(await db.query("INSERT INTO services(business_id,name,minutes,price_cents) VALUES($1,'Corte clásico',30,1500) RETURNING id",[b2])).rows[0].id;
  const c=(await db.query("INSERT INTO customers(business_id,name) VALUES($1,'Cliente ficticio') RETURNING id",[b1])).rows[0].id;
  const c2=(await db.query("INSERT INTO customers(business_id,name) VALUES($1,'Otro cliente') RETURNING id",[b2])).rows[0].id;
  const req={headers:{cookie:'unespacio_sid='+a.sid}};
  const session=await authenticate(req);
  assert.equal(session.business_id,b1);
  assert.doesNotThrow(()=>requireCSRF({headers:{'x-csrf-token':a.csrf}},session));
  assert.throws(()=>requireCSRF({headers:{'x-csrf-token':'X'.repeat(44)}},session),/incorrecto/);
  const input={clientId:c,serviceId:svc,professionalId:pro,day,time:'10:00',channel:'telefono'};
  const attempts=await Promise.allSettled([saveManual(b1,input),saveManual(b1,{...input,time:'10:10',channel:'whatsapp'})]);
  assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);
  const fail=attempts.find(x=>x.status==='rejected');
  assert.equal(fail.reason.status,409);
  assert.equal((await agenda(b1,day)).length,1);
  assert.equal((await agenda(b2,day)).length,0);
  const isolated=await saveManual(b2,{clientId:c2,serviceId:svc2,professionalId:other,day,time:'10:00',channel:'telefono'});
  assert.equal(isolated.status,'confirmada');
  await assert.rejects(saveManual(b2,{clientId:c,serviceId:svc,professionalId:other,day,time:'11:00',channel:'telefono'}),/no está disponible|otro negocio|inexistente/);
  assert.equal(await businessBySlug(slug2).then(x=>x.id),b2);
  await db.query("UPDATE businesses SET public_booking_enabled=true,privacy_url='https://example.com/privacidad' WHERE id=$1",[b1]);
  const pub=await requestPublic(slug,{name:'Persona de prueba',phone:'600 123 456',serviceId:svc,professionalId:pro,day,time:'11:00',acceptedPrivacy:true});
  assert.equal(pub.status,'pendiente');
  assert.equal((await agenda(b1,day)).length,2);
  const confirmed=await confirmRequest(b1,pub.requestId);
  assert.equal(confirmed.status,'confirmada');
  await assert.rejects(requestPublic(slug,{name:'Otra persona',phone:'600 555 666',serviceId:svc,professionalId:pro,day,time:'11:10',acceptedPrivacy:true}),/ocupado/);
  // E2E HTTP real: autenticación por cookie, CSRF y agenda separada por negocio.
  const http=createApp();
  await new Promise(resolve=>http.listen(0,'127.0.0.1',resolve));
  try{
   const base='http://127.0.0.1:'+http.address().port;
   const cookie='unespacio_sid='+a.sid;
   const me=await fetch(base+'/api/v1/me',{headers:{cookie}});
   assert.equal(me.status,200);
   const sessionHTTP=await me.json();
   assert.equal(sessionHTTP.business.id,b1);
   const withoutCSRF=await fetch(base+'/api/v1/appointments',{method:'POST',headers:{cookie,'content-type':'application/json'},body:JSON.stringify({clientId:c,serviceId:svc,professionalId:pro,day,time:'16:00',channel:'telefono'})});
   assert.equal(withoutCSRF.status,403);
   const withCSRF=await fetch(base+'/api/v1/appointments',{method:'POST',headers:{cookie,'content-type':'application/json','x-csrf-token':sessionHTTP.csrfToken},body:JSON.stringify({clientId:c,serviceId:svc,professionalId:pro,day,time:'16:00',channel:'telefono'})});
   assert.equal(withCSRF.status,201);
   const privateDay=await fetch(base+'/api/v1/agenda?day='+day,{headers:{cookie}});
   assert.equal(privateDay.status,200);
   assert.equal((await privateDay.json()).appointments.length,3);
   const publicView=await fetch(base+'/r/'+slug);
   assert.equal(publicView.status,200);
   assert.match(await publicView.text(),/Unespacio · Agenda de citas/);
  }finally{
   await new Promise(resolve=>http.close(resolve));
  }

 }finally{
  if(b1)await database().query('DELETE FROM businesses WHERE id=$1',[b1]);
  if(b2)await database().query('DELETE FROM businesses WHERE id=$1',[b2]);
  await database().query('DELETE FROM users WHERE email=ANY($1)',[[email,email2]]);
  await database().end();
 }
});
