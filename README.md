# Unespacio · Agenda y gestión de citas

Unespacio es una plataforma web de citas pensada para **barberías, peluquerías y pequeños negocios de servicios**. Su objetivo es que cada negocio tenga **una sola agenda** sin obligar a sus clientes, especialmente personas mayores, a utilizar aplicaciones o registrarse.

**Demostración pública:** https://juanjogamero.github.io/unespacio-plataforma-web/

**Referencia de producto:** [Visión de Unespacio y atención a clientes poco digitalizados](docs/producto/vision-unespacio-citas.md).

## Qué puedes probar (versión 0.9.0)

- **Agenda unificada:** citas ficticias procedentes de teléfono, WhatsApp, en el local y reserva web simulada, con filtros por día y profesional.
- **Citas manuales:** crear una cita para alguien que llama, escribe o se presenta en persona, sin exigirle correo electrónico ni cuenta; editar y cancelar.
- **Evitar solapamientos en la demo:** al guardar, se comprueban los horarios y la duración del servicio respecto a otras citas del mismo profesional.
- **Clientes habituales:** alta y edición de fichas mínimas, canal preferido y acción «Repetir cita».
- **Servicios:** alta y edición de nombre, duración y precio orientativo.
- **Confirmación para WhatsApp:** copiar un texto preparado y enviarlo **manualmente** desde la conversación habitual.
- **Vista de reserva online:** simulación sin registro, compartiendo los datos **solo dentro del navegador actual**.

## Advertencias importantes

**Este repositorio es un prototipo de interfaz, no un servicio de reservas en producción.**

- Todo se guarda en `localStorage` del navegador. **No existe base de datos compartida, ni sincronización entre dispositivos ni autorización de servidor**.
- La reserva «online» se simula en el propio navegador; no se puede usar para aceptar citas externas reales.
- La protección frente a dobles reservas es local; más adelante debe implementarse con restricciones transaccionales en backend.
- No hay integración automática con WhatsApp: la confirmación solo se copia para que el negocio la envíe si procede.
- Los nombres y negocios mostrados al iniciar son **ficticios**. **No introducir información real de clientes ni datos personales** en GitHub Pages.
- No se han implementado pagos, IA, facturación ni automatizaciones de mensajería.

## Diseño

Identidad visual de Unespacio: verde petróleo `#163D3B`, salvia `#91C4A5`, acento cálido `#D5AE99` y fondo claro `#F5F8F5`. Tipografías **Manrope** y **DM Sans**. Interfaz responsive, controles visibles y formularios cortos.

## Estructura activa

- `src/booking/model.ts`: tipos y validación local de disponibilidad, clientes y reservas.
- `src/booking/app.ts`: navegación, agenda, clientes, servicios y simulación online.
- `src/booking.css`: estilo responsive.
- `src/main.ts`: arranque de la aplicación de citas.
- `public/index.html`: página pública.
- `tests/booking.test.mjs`: pruebas del modelo y del HTML.
- `scripts/verify-deployed.mjs`: comprobación del despliegue y capturas de navegador real.

## Siguientes decisiones técnicas

La siguiente fase necesita concretar el flujo de reserva externa, horarios del negocio, profesionales y reglas de cancelación. **Antes de introducir usuarios reales** habrá que implementar autenticación de negocio, persistencia en base de datos, aislamiento por negocio, validación de permisos y prevención transaccional de solapamientos.

**Unespacio Aula es un proyecto académico separado.** Los archivos educativos heredados que aún puedan existir en el historial del repositorio no forman parte del frontend público activo.
