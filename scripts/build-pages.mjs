import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
const root=resolve(import.meta.dirname,'..');
execFileSync(process.execPath,['scripts/build.mjs','--development'],{cwd:root,stdio:'inherit'});
const page=join(root,'dist','index.html');
const version=JSON.parse(readFileSync(join(root,'package.json'),'utf8')).version;
const html=readFileSync(page,'utf8')
 .replaceAll('href="/','href="/unespacio-plataforma-web/')
 .replaceAll('src="/','src="/unespacio-plataforma-web/')
 .replace(/(href|src)="([^"]+\.(?:css|js|svg))"/g,(_,attr,url)=>attr+'="'+url+'?v='+version+'"')
 .replace('</head>','<meta name="unespacio-release" content="'+version+'"></head>');
writeFileSync(page,html);writeFileSync(join(root,'dist','.nojekyll'),'');
console.log('Frontend de desarrollo listo para GitHub Pages.');
