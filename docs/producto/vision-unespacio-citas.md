# Unespacio — visión de producto y agenda unificada de citas

**Registrado:** 23 de noviembre de 2026  
**Origen:** definición del promotor en conversación de producto.  
**Estado:** visión y principios confirmados por el promotor; funcionalidades del MVP detalladas como propuestas hasta cerrar alcance. **No confundir con código implementado ni verificado.**

## 1. Qué es Unespacio

Unespacio es una **plataforma web de gestión de citas y agenda para pequeños negocios de servicios**, especialmente **barberías tradicionales, peluquerías de barrio y negocios de pueblo**. Esta es la nueva dirección del producto y **no es Unespacio Aula**, que sigue siendo un proyecto académico separado.

El producto debe ayudar a organizar reservas y modernizar la gestión cotidiana sin obligar a los profesionales ni a sus clientes a cambiar de golpe sus hábitos.

**Problema prioritario:** muchas personas, especialmente mayores o con poca soltura digital, prefieren reservar por teléfono, WhatsApp o directamente en el establecimiento. No quieren descargar una aplicación, crear una cuenta o aprender a reservar por Internet.

**Diferenciación propuesta frente a otras plataformas de citas:** respetar las formas tradicionales de reservar y dar al negocio una única agenda con las citas de todos los canales. Se trata de una hipótesis de posicionamiento por validar, no de una comparación competitiva demostrada.

## 2. Principios rectores confirmados

1. **Nadie está obligado a utilizar tecnología para reservar.** Se acepta una llamada, un WhatsApp o una visita al negocio.
2. **Una sola agenda para todas las formas de reservar.** No puede haber reservas duplicadas para el mismo recurso y franja horaria.
3. **El profesional no debe duplicar trabajo.** Todas las citas terminan en la misma agenda y se registran con pocos toques.
4. **Modernización gradual.** El negocio empieza por gestionar citas y puede añadir herramientas cuando realmente las necesite.
5. **No sustituir la relación personal.** La tecnología sirve para mantener la cercanía y confianza con los clientes habituales.
6. **Diseño accesible y claro.** Botones grandes, textos comprensibles y formularios cortos; priorizar rapidez en el alta manual.
7. **Datos mínimos.** No exigir email ni cuenta al cliente cuando la cita la anota el profesional.

## 3. Flujos de reserva que debe unificar el producto

| Canal | Quién registra la cita | Necesita cuenta el cliente |
|---|---|---|
| Llamada telefónica | Profesional | No |
| WhatsApp tradicional | Profesional, tras responder al cliente | No |
| En persona | Profesional | No |
| Reserva online | Cliente, por su cuenta | Pendiente de definir, pero no debería exigirse instalar una aplicación |

**Regla funcional esencial:** una nueva reserva, manual o por Internet, debe consultar la disponibilidad real y evitar solapamientos. La validación definitiva debe hacerse en el servidor cuando haya backend, no solo en la interfaz.

## 4. Ejemplo de persona mayor: Antonio y Manolo

Antonio, de 74 años, llama a su barbería de confianza y pide corte de pelo para el jueves por la mañana. Manolo abre la agenda y selecciona las 11:30.

**Nueva cita — formulario corto:**
- Cliente: Antonio García.
- Servicio: corte de pelo.
- Día y hora: jueves, 11:30.
- Procedencia o canal de reserva: teléfono.
- Acción principal: guardar la cita.

Antonio no necesita correo electrónico, aplicación ni cuenta. Recuerda la hora que le han dicho; Manolo tiene la cita junto a las demás reservas.

Este caso es una **referencia de experiencia de usuario**, no un dato real ni una cita existente.

## 5. Funcionalidades candidatas para el primer MVP

Estas funciones proceden de la propuesta del promotor. Deben ordenarse y aprobarse antes de afirmar que forman parte de un MVP cerrado.

### A. Agenda unificada
- Vista de agenda legible por día y semana.
- Citas de teléfono, WhatsApp, local y web en el mismo calendario.
- Disponibilidad por servicio y profesional, cuando el negocio tenga varios.
- Evitar conflictos de horarios.
- Crear, modificar y cancelar citas de forma simple.

### B. Alta manual rápida
- Acceso directo a **Nueva cita** desde la agenda.
- Seleccionar hora, cliente, servicio y canal sin formularios largos.
- Permitir cliente nuevo sin cuenta digital.
- Interfaz con controles grandes, contraste suficiente y textos claros.

### C. Clientes habituales
- Ficha breve del cliente.
- Servicio habitual, profesional habitual, duración orientativa y última visita.
- Acción **Repetir última cita**, con selección de un nuevo hueco disponible.
- Posibilidad de reservar la próxima cita al terminar el servicio.

### D. Preferencias de reserva y contacto
Registrar, con el mínimo dato necesario, cómo quiere ser atendido el cliente:
- Prefiere llamada.
- Prefiere WhatsApp.
- Prefiere reserva online.
- Prefiere acudir al local.

Las comunicaciones enviadas por el negocio requerirán el consentimiento o fundamento legal que corresponda; no asumir autorización solo porque exista un número de teléfono.

### E. Reserva online sencilla
- Un cliente puede elegir servicio, fecha y hueco sin descargar una aplicación.
- La reserva entra en la misma agenda, con protección frente a conflictos.
- El detalle exacto del flujo y la identificación mínima necesaria están pendientes de definir.

### F. WhatsApp en primera fase
- El negocio sigue hablando con el cliente por WhatsApp, como siempre.
- El profesional registra manualmente la cita en Unespacio.
- Se puede ofrecer un texto de confirmación listo para copiar y pegar.
- **No afirmar que WhatsApp queda integrado o que la cita se guarda automáticamente.**

## 6. Fuera del MVP inicial / fase futura, salvo autorización

**Automatización oficial de WhatsApp:** reconocimiento de mensajes, consulta de huecos y confirmaciones dentro de la conversación. Requiere integración autorizada, costes y validación rigurosa para evitar confirmar horas equivocadas. No se incluye de inicio.

Tampoco se debe añadir IA, pagos, facturación, CRM avanzado ni otros módulos que no se hayan justificado y aprobado para esta nueva plataforma.

## 7. Criterios de éxito que debe comprobar el prototipo

1. Un profesional puede crear una reserva recibida por teléfono en unos pocos pasos.
2. El cliente no necesita cuenta ni email para que el profesional le reserve una cita.
3. Una cita por teléfono, WhatsApp, en persona u online aparece en la **misma** agenda.
4. La aplicación evita que un mismo profesional esté reservado dos veces en la misma franja.
5. Recuperar a un cliente habitual y repetir su última cita es más rápido que crearla de cero.
6. Una persona con poca experiencia digital puede identificar claramente las acciones esenciales del negocio.
7. Las demostraciones se hacen con **datos ficticios**, nunca datos reales de clientes.

## 8. Situación técnica actual (versión de demostración 0.9.0)

La web pública **ya muestra Unespacio Citas**, no las pantallas de Unespacio Aula. El prototipo incluye una agenda, creación/edición/cancelación de citas, servicios, fichas de clientes habituales, preferencias, copia manual de mensajes y simulación de reserva online.

**Implementado y comprobado solo en la demostración:**
- Citas por teléfono, WhatsApp, en el local y online simulado en la misma agenda del navegador.
- Prevención local de solapamientos para un profesional según el horario y la duración del servicio.
- Alta manual sin cuenta ni email del cliente; edición, cancelación y repetición de citas.
- Servicios con duración y precio orientativo; clientes con canal preferido.
- Estado guardado en `localStorage` del navegador.
- Pruebas automáticas del modelo y verificación del sitio en GitHub Pages con navegador real.

**No implementado ni verificado en producción:**
- Almacenamiento compartido en un servidor y sincronización entre distintos dispositivos.
- Autenticación y separación de información de cada negocio.
- Prevención transaccional de dobles reservas en base de datos.
- Reservas externas reales a través de un enlace compartible.
- Integración oficial con WhatsApp y envío automático de mensajes.

Se prohíbe utilizar datos reales en esta demo. Los ejemplos precargados son ficticios; el producto aún no es apto para un negocio real.

## 9. Registro de decisiones y pendientes

**Confirmado por el promotor:**
- El proyecto nuevo es una plataforma de citas para pequeños negocios, no un aula.
- Atender a personas mayores o poco digitalizadas sin imponerles una app.
- Unificar los canales manuales y digitales en una sola agenda.
- Mantener la relación cercana con el cliente y facilitar el trabajo al profesional.

**Propuesto para dimensionar el MVP (aún por concretar):**
- Servicios, duración y profesionales.
- Fichas mínimas de clientes; repetir última cita.
- Preferencia de canal y mensaje para copiar por WhatsApp.
- Reserva online sin app.

**Implementado en la demo local (sin servidor):**
- Agenda con todos los canales y validación de huecos en el navegador.
- Fichas mínimas de clientes y alta manual de citas.
- Simulación de reserva online en el mismo navegador.

**Pendiente de producción:**
- Sincronización y almacenamiento compartido seguros.
- Prevención de doble reserva desde servidor.
- Autenticación y aislamiento de negocios.
- Reserva online externa, disponible para cualquier cliente.
- Integración oficial con WhatsApp.

## 10. Avance técnico 0.10.0 (23/11/2026)

Se ha implementado una primera **agenda semanal y configuración de horarios** en la demo. Además, se ha añadido una aplicación privada separada con una API Node.js y esquema PostgreSQL para negocios, sesiones, propietarios/profesionales, clientes y solicitudes online pendientes de confirmación. La base de datos dispone de una restricción transaccional que impide dobles reservas confirmadas para el mismo profesional y franja horaria.

**Precisión de estado:** el código del backend se verifica en GitHub Actions, pero **NO hay un servidor de producción alojado ni una base de datos comercial conectada**. Las reservas entre dispositivos y los datos personales reales siguen fuera de la demostración GitHub Pages. Ver [preparación del piloto](preparacion-piloto.md).
