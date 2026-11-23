import {execFileSync} from 'node:child_process';
import {mkdirSync,copyFileSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),out=join(root,'dist'),development=process.argv.includes('--development');
rmSync(out,{recursive:true,force:true});mkdirSync(join(out,'assets','js'),{recursive:true});mkdirSync(join(out,'assets','css'),{recursive:true});
execFileSync('tsc',['-p','tsconfig.json'],{cwd:root,stdio:'inherit'});
copyFileSync(join(root,'src','booking.css'),join(out,'assets','css','booking.css'));
copyFileSync(join(root,'public','index.html'),join(out,'index.html'));
copyFileSync(join(root,'public','favicon.svg'),join(out,'favicon.svg'));
if(development){const html=readFileSync(join(out,'index.html'),'utf8').replace('<html lang="es">','<html lang="es" data-environment="development">');writeFileSync(join(out,'index.html'),html);}
console.log('Unespacio Citas: build de '+(development?'demostración':'producción')+' listo.');
