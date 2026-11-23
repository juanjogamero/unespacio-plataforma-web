import {execFileSync} from 'node:child_process';
import {mkdirSync,cpSync,copyFileSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..'),out=join(root,'dist'),development=process.argv.includes('--development');
rmSync(out,{recursive:true,force:true});mkdirSync(join(out,'assets','js'),{recursive:true});mkdirSync(join(out,'assets','css'),{recursive:true});
execFileSync('tsc',['-p','tsconfig.json'],{cwd:root,stdio:'inherit'});
copyFileSync(join(root,'src','styles.css'),join(out,'assets','css','styles.css'));
copyFileSync(join(root,'src','design.css'),join(out,'assets','css','design.css'));
copyFileSync(join(root,'src','studio.css'),join(out,'assets','css','studio.css'));
copyFileSync(join(root,'src','refined.css'),join(out,'assets','css','refined.css'));
copyFileSync(join(root,'src','brand.css'),join(out,'assets','css','brand.css'));
copyFileSync(join(root,'public','index.html'),join(out,'index.html'));
copyFileSync(join(root,'public','favicon.svg'),join(out,'favicon.svg'));
if(development){const html=readFileSync(join(out,'index.html'),'utf8').replace('<html lang="es">','<html lang="es" data-environment="development">');writeFileSync(join(out,'index.html'),html);}
else {
 rmSync(join(out,'assets','js','core','development.js'),{force:true});
 rmSync(join(out,'assets','js','core','local-files.js'),{force:true});
}
// CSP funciona sin inline scripts, estilos o orígenes externos. El VPS debe añadir también cabeceras HTTP.
console.log(`Build correcto: ${out} (${development?'entorno de desarrollo':'producción'})`);
