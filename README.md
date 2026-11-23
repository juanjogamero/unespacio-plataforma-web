# Unespacio · Plataforma de gestión de citas

**Unespacio** ayuda a pequeños negocios —barberías, peluquerías y profesionales de servicios— a organizar reservas por teléfono, WhatsApp, en persona y online **sin obligar a sus clientes a instalar una aplicación**.

## Estado del proyecto (0.11.0)

Hay **dos entornos diferentes**:

| Entorno | Enlace / ejecución | Datos | Estado |
| --- | --- | --- | --- |
| Demostración pública | https://juanjogamero.github.io/unespacio-plataforma-web/ | Ficticios, locales al navegador | Publicado mediante GitHub Actions |
| Aplicación de negocio | Servidor Node.js + PostgreSQL, por desplegar en HTTPS | Base de datos real separada por negocio | Implementada en código y probada en CI; **no desplegada** |

**La demo NO es un servicio comercial:** no sincroniza dispositivos ni permite recibir reservas externas reales. No escribir datos personales reales en GitHub Pages.

## Experiencia disponible en la demo

- Agenda diaria y semanal con citas de varios canales.
- Alta manual rápida, edición y cancelación de citas.
- Fichas mínimas de clientes y repetición de citas habituales.
- Servicios con duración y precio orientativo.
- **Horarios de apertura, turnos partidos, días libres y ausencias** con bloqueo local de nuevas citas.
- Reserva online simulada y texto de confirmación para copiar en WhatsApp.
- **Nuevo: centro de automatizaciones** con recordatorios preparados, resumen de mañana y lista de espera que detecta huecos liberados por cancelaciones. Todo en modo simulación, sin enviar mensajes.
- Diseño responsive y accesible para móvil.

## Base del producto real (preparada, pendiente de despliegue)

- **PostgreSQL** con clientes, profesionales, servicios, horarios, cierres y citas por negocio.
- **Autenticación:** contraseña con scrypt y sal individual, sesión mediante cookie HttpOnly, SameSite y CSRF.
- **Permisos:** roles owner/staff comprobados por el servidor; todas las operaciones internas filtradas por negocio.
- **Reservas concurrentes:** restricción de exclusión PostgreSQL para impedir que dos citas confirmadas se solapen en el mismo profesional.
- **Reserva pública:** enlace /r/identificador para pedir una cita sin crear cuenta. Al no verificar todavía el teléfono, la solicitud queda **pendiente** y el negocio debe confirmarla.
- **Configuración:** horas semanales, servicios, profesionales, clientes y política de privacidad para activar solicitudes externas.
- **Automatizaciones opcionales:** avisos por correo al propietario ante nuevas solicitudes, recordatorios 24 horas antes solo con consentimiento, resumen diario y propuesta de hueco liberado al primer cliente compatible de la lista de espera.
- **Cola y proceso independientes:** PostgreSQL registra el estado de cada email; un proceso SMTP opcional envía avisos de forma diferida, con reintentos limitados e identificadores para evitar duplicados normales.
- **Pruebas:** unitarias, integración con PostgreSQL, emisor de correo simulado en CI y verificación del despliegue de GitHub Pages.

Este servidor **no está desplegado**, por lo que no se pueden aceptar reservas reales aún.

## Estructura

- `src/booking/` y `src/booking.css`: interfaz de demostración y reglas locales.
- `src/live/app.ts`: interfaz privada conectada a la API y vista pública de reservas.
- `src/main.ts`: selecciona el modo demo o el modo servidor.
- `server/schema.sql`: tablas y exclusión transaccional multiempresa.
- `server/auth.mjs`, `server/booking.mjs`, `server/app.mjs`: autenticación y API.
- `server/automations.mjs`: programación y cola de recordatorios, avisos y lista de espera.
- `server/worker.mjs`: proceso de envío SMTP, separado de la API y de la demo pública.
- `tests/`: pruebas de experiencia, dominio y backend.
- `docs/producto/vision-unespacio-citas.md`: visión confirmada por el promotor.

## Preparación técnica del servidor

Para uso privado en pruebas se necesita un servidor con Node.js 22+, PostgreSQL 15+, certificado HTTPS, dominio configurado y las variables `DATABASE_URL`, `APP_ORIGIN`, `NODE_ENV=production` y `API_PORT`. El servidor debe ejecutarse detrás de un proxy HTTPS que preserve el origen. `ALLOW_PUBLIC_SIGNUP` está desactivado de forma predeterminada para evitar registros abiertos.

Para ejecutar el envío real de correos se necesita un proceso independiente del servidor web con `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` y `SMTP_FROM`; **no debe ponerse ningún secreto en GitHub Pages ni activar notificaciones sin consentimiento**. Las preferencias están apagadas por defecto. Sin un servicio SMTP y el proceso de avisos, los eventos solo quedarán en cola.

En un entorno privado los responsables técnicos pueden instalar dependencias, ejecutar la migración, compilar la aplicación y arrancar la API y el worker con los scripts de `package.json`.

**No activar clientes reales sin** revisar la política de privacidad, acuerdos de tratamiento, copias de seguridad y restauración, verificación de cuentas, recuperación de contraseña, prevención de abuso y supervisión. El alta pública y las solicitudes externas solo deben habilitarse tras estas comprobaciones.

### Limitaciones conocidas

- Aún no hay verificación de email/telefono ni recuperación autónoma de contraseña.
- El código permite enviar **emails transaccionales** cuando se conecte SMTP; no hay integración oficial ni envíos automáticos por WhatsApp. Tampoco pagos, facturación, IA o marketing avanzado.
- Los avisos por email son *opt-in* en los clientes; los negocios deben informar y conservar adecuadamente la base de legitimación y respetar el derecho a no recibirlos.
- Los huecos liberados se proponen, **no se reservan automáticamente**; deben reconfirmarse con el negocio.
- La demo de Pages usa `localStorage` sin sincronización; el backend todavía requiere alojamiento independiente.
- La interfaz privada necesita validación real de experiencia con negocios piloto.

**Unespacio Aula permanece independiente**; el repositorio académico no se modifica.

## Documentación

- [Visión del producto](docs/producto/vision-unespacio-citas.md)
- [Arquitectura de la demo](docs/arquitectura-demo.md)
- [Criterios para piloto comercial](docs/producto/preparacion-piloto.md)
