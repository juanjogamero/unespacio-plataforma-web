import test from 'node:test';
import assert from 'node:assert/strict';
import {database,migrate} from '../server/db.mjs';
import {register,authenticate,requireCSRF} from '../server/auth.mjs';
import {daysFrom,weekday,localDate} from '../server/domain.mjs';
import {createApp} from '../server/app.mjs';
import {getAutomations,putAutomations,addWaitlist,listWaitlist,scheduleReminders,scheduleDigests,processQueue} from '../server/automations.mjs';
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
   const last=await fetch(base+'/api/v1/clients/'+c+'/last',{headers:{cookie}});
   assert.equal(last.status,200);
   assert.equal((await last.json()).last.startMinute,960);
   const foreign=await fetch(base+'/api/v1/clients/'+c2+'/last',{headers:{cookie}});
   assert.equal(foreign.status,404);
   const publicView=await fetch(base+'/r/'+slug);
   assert.equal(publicView.status,200);
   assert.match(await publicView.text(),/Unespacio · Agenda de citas/);
  }finally{
   await new Promise(resolve=>http.close(resolve));
  }
  // Verificación de avisos sin enviar correos: el emisor de prueba solo guarda en memoria.
  assert.equal((await getAutomations(b1)).remindersEnabled,false);
  assert.equal((await getAutomations(b2)).ownerAlertsEnabled,false);
  await putAutomations(b1,{ownerAlertsEnabled:true,remindersEnabled:true,dailySummaryEnabled:true,waitlistEnabled:true,summaryHour:18});
  await db.query('UPDATE customers SET email=$2,reminder_consent=true WHERE business_id=$1 AND id=$3',[b1,'cliente@example.invalid',c]);
  const queuedPublic=await requestPublic(slug,{name:'Solicitud para aviso',phone:'600 123 456',serviceId:svc,professionalId:pro,day,time:'12:30',acceptedPrivacy:true});
  assert.equal(queuedPublic.status,'pendiente');
  let jobs=(await db.query("SELECT * FROM notification_queue WHERE business_id=$1 AND kind='owner_request'",[b1])).rows;
  assert.equal(jobs.length,1);
  assert.equal(jobs[0].recipient_email,email);
  const wait=await addWaitlist(b1,{customerId:c,serviceId:svc,professionalId:pro,day,from:'12:00',to:'13:00',notifyConsent:true});
  assert.equal(wait.status,'active');
  assert.equal((await listWaitlist(b2)).length,0);
  assert.equal((await listWaitlist(b1)).length,1);
  const soon=await saveManual(b1,{clientId:c,serviceId:svc,professionalId:pro,day,time:'12:00',channel:'telefono'});
  assert.equal(soon.status,'confirmada');
  const cancelled=await import('../server/booking.mjs').then(x=>x.cancel(b1,soon.id));
  assert.equal(cancelled.status,'cancelada');
  const waitJobs=(await db.query("SELECT * FROM notification_queue WHERE business_id=$1 AND kind='waitlist_open'",[b1])).rows;
  assert.equal(waitJobs.length,1);
  assert.equal(waitJobs[0].recipient_email,'cliente@example.invalid');
  const reminderNow=new Date(daysFrom(day,-2)+'T12:00:00.000Z');
  const futureCount=await scheduleReminders(reminderNow,db);
  assert.ok(futureCount>=1);
  const duplicateCount=await scheduleReminders(reminderNow,db);
  assert.equal(duplicateCount,0);
  assert.ok(await scheduleDigests(new Date(),db)>=1);
  // Forzar vencimiento únicamente en la base efímera de CI.
  await db.query("UPDATE notification_queue SET due_at=now()-interval '1 minute' WHERE business_id=$1",[b1]);
  const delivered=[];
  const sent=await processQueue(async mail=>{delivered.push(mail)},{db,max:30});
  assert.equal(sent.failed,0);
  assert.ok(sent.sent>=3);
  assert.ok(delivered.some(m=>m.to===email&&m.subject.includes('solicitud')));
  assert.ok(delivered.some(m=>m.to==='cliente@example.invalid'&&m.subject.includes('hueco')));
  const waitAfter=await db.query('SELECT status FROM waitlist_entries WHERE id=$1',[wait.id]);
  assert.equal(waitAfter.rows[0].status,'notified');
  const resent=await processQueue(async mail=>{delivered.push(mail)},{db,max:30});
  assert.equal(resent.sent,0);
  assert.equal((await db.query("SELECT count(*)::int AS count FROM notification_queue WHERE business_id=$1 AND status='sent'",[b1])).rows[0].count,sent.sent);

 }finally{
  if(b1)await database().query('DELETE FROM businesses WHERE id=$1',[b1]);
  if(b2)await database().query('DELETE FROM businesses WHERE id=$1',[b2]);
  await database().query('DELETE FROM users WHERE email=ANY($1)',[[email,email2]]);
  await database().end();
 }
});
