/** Preferencias de presentación, nunca credenciales ni autorizaciones. */
type Preference = 'compact' | 'reduceMotion' | 'largeText';
const key = (p:Preference)=>`unespacio.ui.${p}`;
export function getPreference(p:Preference):boolean {
 try { return window.localStorage.getItem(key(p))==='1'; }
 catch { return false; }
}
export function togglePreference(p:Preference):void {
 window.localStorage.setItem(key(p),getPreference(p)?'0':'1');
}
export function applyPreferences():void {
 document.documentElement.classList.toggle('compact-density',getPreference('compact'));
 document.documentElement.classList.toggle('reduce-motion',getPreference('reduceMotion'));
 document.documentElement.classList.toggle('larger-text',getPreference('largeText'));
}
