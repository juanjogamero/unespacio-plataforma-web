# Seguridad · Unespacio Aula frontend 0.2

Esta documentación no constituye una auditoría ni acredita cumplimiento RGPD.

## Dos compilaciones separadas

1. **Producción (`npm run build`)**: contiene la pantalla de login y `HttpGateway`. Excluye `development.js` y `local-files.js`. Sin conexión al VPS no permite acceder a la plataforma.
2. **GitHub Pages (`npm run pages:build`)**: compila deliberadamente datos ficticios, acceso a cuentas de desarrollo y persistencia local. Es público, NO autenticado y NO apto para información real de alumnos. La selección de roles no concede permisos reales.

El diseño y los recorridos educativos son los mismos; cambia la fuente de datos y el nivel de acceso. No publicar ni proporcionar claves o tokens en la web estática.

## Controles ya preparados

- Interfaz de login que envía credenciales **solo al backend same-origin** mediante HTTPS.
- Contrato para CSRF preautenticación (`GET /api/v1/auth/csrf`) y postautenticación; cookies que deberá emitir el servidor como `HttpOnly`, `Secure`, `SameSite`.
- Cada petición con `credentials:'same-origin'`, `redirect:'error'`, JSON y respuesta esperada.
- Textos mostrados escapados en HTML; enlaces externos filtrados por protocolo.
- Validación inicial de puntuaciones y archivos; el servidor será la autoridad.
- CSP y cabeceras mínimas en el servidor local; configurar Nginx/VPS por separado.
- En Pages el almacenamiento de desarrollo queda en ese navegador (localStorage, sessionStorage e IndexedDB), jamás en GitHub ni en la API.

## Obligatorio antes de cuentas reales

- Sesiones reales con protección antibruteforce, recuperación de contraseña, revocación y CSRF completo.
- Autorización por organización en **cada** endpoint; comprobar matrícula, asignación docente, usuario y rol; pruebas negativas IDOR/BOLA.
- Base de datos con claves foráneas, migraciones y copias de seguridad.
- Almacenamiento privado y escaneo de archivos, límites y protección de enlaces de descarga.
- HTTPS, HSTS tras verificar certificados, seguridad en cabeceras, monitorización, logs sin datos privados y gestión de secretos.
- Privacidad de menores, RGPD/LOPDGDD, política de retención y derechos de acceso/borrado, revisión legal.
- Tests E2E y de accesibilidad por rol, incluido acceso desde organizaciones ajenas.

**No usar GitHub Pages como backend ni tratar la elección de cuenta de desarrollo como autenticación.**
