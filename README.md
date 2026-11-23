# Unespacio · Plataforma de gestión de citas

**Unespacio** ayuda a pequeños negocios —barberías, peluquerías y profesionales de servicios— a organizar reservas por teléfono, WhatsApp, en persona y online **sin obligar a sus clientes a instalar una aplicación**.

## Estado del proyecto (0.10.0)

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
- Diseño responsive y accesible para móvil.

## Base del producto real (preparada, pendiente de despliegue)

- **PostgreSQL** con clientes, profesionales, servicios, horarios, cierres y citas por negocio.
- **Autenticación:** contraseña con scrypt y sal individual, sesión mediante cookie HttpOnly, SameSite y CSRF.
- **Permisos:** roles owner/staff comprobados por el servidor; todas las operaciones internas filtradas por negocio.
- **Reservas concurrentes:** restricción de exclusión PostgreSQL para impedir que dos citas confirmadas se solapen en el mismo profesional.
- **Reserva pública:** enlace /r/identificador para pedir una cita sin crear cuenta. Al no verificar todavía el teléfono, la solicitud queda **pendiente** y el negocio debe confirmarla.
- **Configuración:** horas semanales, servicios, profesionales, clientes y política de privacidad para activar solicitudes externas.
- **Pruebas:** unitarias, integración con PostgreSQL y verificación del despliegue de GitHub Pages.

Este servidor **no está desplegado**, por lo que no se pueden aceptar reservas reales aún.

## Estructura

- `src/booking/` y `src/booking.css`: interfaz de demostración y reglas locales.
- `src/live/app.ts`: interfaz privada conectada a la API y vista pública de reservas.
- `src/main.ts`: selecciona el modo demo o el modo servidor.
- `server/schema.sql`: tablas y exclusión transaccional multiempresa.
- `server/auth.mjs`, `server/booking.mjs`, `server/app.mjs`: autenticación y API.
- `tests/`: pruebas de experiencia, dominio y backend.
- `docs/producto/vision-unespacio-citas.md`: visión confirmada por el promotor.

## Preparación técnica del servidor

Para uso privado en pruebas se necesita un servidor con Node.js 22+, PostgreSQL 15+, certificado HTTPS, dominio configurado y las variables `DATABASE_URL`, `APP_ORIGIN`, `NODE_ENV=production` y `API_PORT`. El servidor debe ejecutarse detrás de un proxy HTTPS que preserve el origen. `ALLOW_PUBLIC_SIGNUP` está desactivado de forma predeterminada para evitar registros abiertos.

En un entorno privado los responsables técnicos pueden instalar dependencias, ejecutar la migración, compilar la aplicación y arrancar la API con los scripts de `package.json`.

**No activar clientes reales sin** revisar la política de privacidad, acuerdos de tratamiento, copias de seguridad y restauración, verificación de cuentas, recuperación de contraseña, prevención de abuso y supervisión. El alta pública y las solicitudes externas solo deben habilitarse tras estas comprobaciones.

### Limitaciones conocidas

- Aún no hay verificación de email/telefono ni recuperación autónoma de contraseña.
- No hay envío automático de mensajes ni integración oficial con WhatsApp; tampoco pagos, facturación, IA o marketing avanzado.
- La demo de Pages usa `localStorage` sin sincronización; el backend todavía requiere alojamiento independiente.
- La interfaz privada necesita validación real de experiencia con negocios piloto.

**Unespacio Aula permanece independiente**; el repositorio académico no se modifica.

## Documentación

- [Visión del producto](docs/producto/vision-unespacio-citas.md)
- [Arquitectura de la demo](docs/arquitectura-demo.md)
- [Criterios para piloto comercial](docs/producto/preparacion-piloto.md)
