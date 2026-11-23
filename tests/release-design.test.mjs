import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('La compilación incluye y carga la última capa de diseño',()=>{
 const html=read('../dist/index.html');
 assert.match(html,/\/assets\/css\/studio.css/);
 assert.match(html,/\/assets\/css\/refined.css/);
 assert.ok(html.indexOf('studio.css')<html.indexOf('refined.css'));
 const css=read('../dist/assets/css/refined.css');
 for(const sel of ['.work-class-top','.work-topic-workspace','.study-task-list','.work-calendar','.course-hero']) assert.ok(css.includes(sel),sel);
});
test('La publicación versiona los recursos en Pages evitando estilos desactualizados',()=>{
 const pages=read('../scripts/build-pages.mjs');
 assert.match(pages,/ua-release/);
 assert.match(pages,/\\?v=/);
 const app=read('../src/ui/app.ts');
 assert.match(app,/Versión 0\.8\.1/);
});
