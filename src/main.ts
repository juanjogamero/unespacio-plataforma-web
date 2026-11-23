import {startBookingApp} from './booking/app.js';
import {startLiveApp} from './live/app.js';
const isDemo=document.documentElement.dataset.environment==='development';
if(isDemo){startBookingApp()}
else{startLiveApp().catch(()=>{const root=document.getElementById('app');if(root)root.textContent='No podemos conectar con Unespacio. Vuelve a intentarlo más tarde.'})}
