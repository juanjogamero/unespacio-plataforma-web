import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Sesiones con fechas actuales y recurrencia opcional',()=>{const app=src('src/ui/app.ts');assert.match(app,/nextClassTime\(\)/);assert.match(app,/Repetir cada semana/);assert.doesNotMatch(app,/2026-11-26T17:00/);assert.match(app,/finalización debe ser posterior/);});
test('La recurrencia se limita a ocho fechas en desarrollo',()=>{const code=src('src/core/development.ts');assert.match(code,/const total=input\.recurring\?8:1/);assert.match(src('src/core/http.ts'),/credentials:'same-origin'/);});
