import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=(p)=>readFileSync(new URL(p,root),'utf8');

test('La navegación interna no ofrece cambio de roles libre',()=>{
 const app=read('src/ui/app.ts');
 assert.doesNotMatch(app,/data-action="switch-role"/);
 assert.doesNotMatch(app,/data-action="set-role"/);
 assert.match(app,/data-form="development-login"/);
});
test('El acceso productivo sigue dependiendo del backend',()=>{
 const app=read('src/ui/app.ts');
 assert.match(app,/data-form="sign-in"/);
 assert.match(app,/gateway as HttpGateway\)\.signIn/);
 assert.match(read('src/core/http.ts'),/credentials:'same-origin'/);
});
test('Las opciones de interfaz solo guardan preferencias de presentación',()=>{
 const pref=read('src/core/preferences.ts');
 assert.match(pref,/unespacio\.ui\./);
 assert.doesNotMatch(pref,/password|token|credential|session/i);
});

test('Los ajustes incluyen un modo opcional de lectura con textos grandes',()=>{const prefs=read('src/core/preferences.ts'),views=read('src/ui/views.ts'),app=read('src/ui/app.ts');assert.match(prefs,/larger-text/);assert.match(views,/Texto más grande/);assert.match(app,/toggle-large-text/);});
