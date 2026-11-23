import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=(p)=>readFileSync(new URL(p,root),'utf8');
test('La entrada real exige una sesión servida por la API',()=>{
 assert.match(read('src/ui/app.ts'),/gateway\.getSnapshot\(\)/);
 assert.match(read('src/ui/app.ts'),/async function start|export async function start/);
 assert.match(read('src/core/http.ts'),/auth\/login/);
 assert.match(read('src/core/http.ts'),/auth\/logout/);
});
test('No hay credenciales codificadas ni credenciales guardadas en localStorage',()=>{
 for(const p of ['src/ui/app.ts','src/core/http.ts']) assert.doesNotMatch(read(p),/localStorage|sessionStorage/);
 assert.doesNotMatch(read('src/core/http.ts'),/Authorization:.*Bearer/i);
});
test('La API usa cookies del mismo origen y protección CSRF',()=>{
 assert.match(read('src/core/http.ts'),/credentials:'same-origin'/);
 assert.match(read('src/core/http.ts'),/X-CSRF-Token/);
 assert.match(read('src/core/http.ts'),/redirect:'error'/);
});
test('La selección libre de roles solo existe en el módulo de desarrollo',()=>{
 assert.match(read('src/core/development.ts'),/setRole\(role:Role\)/);
 assert.match(read('src/ui/app.ts'),/isDevelopment/);
 assert.doesNotMatch(read('public/index.html'),/data-environment="development"/);
});
test('Los datos locales de desarrollo son ficticios y no se envían al VPS',()=>{
 assert.match(read('src/core/development.ts'),/unespacio\.dev\.data\.v1/);
 assert.doesNotMatch(read('src/core/development.ts'),/fetch\(/);
});
test('La compilación real elimina módulos de desarrollo',()=>{
 assert.match(read('scripts/build.mjs'),/rmSync\(join\(out,'assets','js','core','development\.js'/);
 assert.equal(existsSync(new URL('../dist/assets/js/core/development.js',import.meta.url)),false);
 assert.equal(existsSync(new URL('../dist/assets/js/core/local-files.js',import.meta.url)),false);
});
test('El servidor local incluye CSP, protección MIME y política de permisos',()=>{
 assert.match(read('scripts/serve.mjs'),/Content-Security-Policy/);
 assert.match(read('scripts/serve.mjs'),/nosniff/);
 assert.match(read('scripts/serve.mjs'),/Permissions-Policy/);
});
test('El contenido dinámico se escapa y se rechazan enlaces ejecutables',async()=>{
 const sec=await import('../dist/assets/js/core/security.js');
 assert.equal(sec.escapeHtml('<img src=x onerror=alert(1)>'),'&lt;img src=x onerror=alert(1)&gt;');
 assert.equal(sec.safeExternalUrl('javascript:alert(1)'),null);
 assert.equal(sec.safeExternalUrl('data:text/html,test'),null);
 assert.ok(sec.safeExternalUrl('https://example.org/material'));
});
test('Las calificaciones se validan entre 0 y 10',async()=>{
 const sec=await import('../dist/assets/js/core/security.js');
 assert.throws(()=>sec.clampScore(11));
 assert.equal(sec.clampScore(8.56),8.6);
});
test('El entorno de desarrollo está aislado mediante atributo solo en build especial',()=>{
 assert.match(read('scripts/build.mjs'),/data-environment="development"/);
 assert.match(read('scripts/build-pages.mjs'),/--development/);
 assert.match(read('src/ui/app.ts'),/location\.hostname\.endsWith\('\.github\.io'\)/);
});
