import test from 'node:test';
import assert from 'node:assert/strict';
import {hashPassword,verifyPassword,cookieHeader} from '../server/auth.mjs';
test('Contraseñas hasheadas con sal individual; nunca texto plano',()=>{
 const password='FraseSeguraDePrueba23';
 const first=hashPassword(password),second=hashPassword(password);
 assert.notEqual(first,second);assert.ok(!first.includes(password));
 assert.equal(verifyPassword(password,first),true);
 assert.equal(verifyPassword('otro-password',first),false);
 assert.equal(verifyPassword(password,'dato-invalido'),false);
 assert.throws(()=>hashPassword('corta'),/12 a 128/);
});
test('Sesión protegida con HttpOnly, SameSite y caducidad',()=>{
 const header=cookieHeader('token');
 assert.match(header,/HttpOnly/);assert.match(header,/SameSite=Lax/);assert.match(header,/Max-Age=604800/);
 assert.match(cookieHeader('',true),/Max-Age=0/);
});
