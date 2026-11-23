import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('El sistema visual 0.8 introduce espacios de trabajo compactos y una jerarquía usable',()=>{
 const html=read('dist/index.html'),css=read('dist/assets/css/refined.css');
 assert.match(html,/refined.css/);
 for(const selector of ['.ua-next-lesson','.ua-class-item','.ua-student-next','.ua-course-heading','.ua-page-heading','.ua-learning-grid'])assert.ok(css.includes(selector),selector);
 assert.match(css,/focus-visible/);assert.match(css,/@media\(max-width:640px\)/);
});
