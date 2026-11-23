import {start} from './ui/app.js';
start().catch(()=>{const el=document.getElementById('app');if(el)el.textContent='No hemos podido iniciar Unespacio. Vuelve a intentarlo más tarde.';});
