# Preparación para un piloto comercial de Unespacio

**Actualizado:** 23 de noviembre de 2026 · versión 0.11.0.  
**Estado:** hoja de ruta y controles. No es una declaración de que el SaaS esté listo para venderse.

## Qué se ha implementado y qué se ha verificado

| Área | Demo GitHub Pages | Backend de negocio |
| --- | --- | --- |
| Agenda diaria y semanal | Implementada y comprobada en CI | Diaria, implementada |
| Alta, edición y cancelación | Demo con datos locales | API y control por negocio implementados |
| Apertura por días y turnos partidos | Implementada | Tablas y API implementadas |
| Cierres y ausencias | Demo implementada | API para cierres implementada |
| Clientes y profesionales | Demo | API y UI privada implementadas |
| Solicitudes online sin cuenta | Simuladas en el mismo navegador | Código con solicitudes pendientes, sin desplegar |
| Evitar reservas simultáneas | Solo mismo navegador | Constraint PostgreSQL; test de concurrencia en CI |
| Autenticación | No hay | Sesiones, scrypt, cookies HttpOnly y CSRF; falta despliegue |
| Aislamiento por negocio | No aplica a la demo | Backend filtrado por negocio, probado en CI |
| Despliegue de producción | No | Pendiente |

## Bloqueadores que impiden anunciar un servicio vendible

1. **Infraestructura real:** contratar y conectar alojamiento HTTPS para Node y PostgreSQL, configurar dominio, backups automáticos y restauración de pruebas; definir disponibilidad y soporte. No almacenar claves en GitHub.
2. **Seguridad de cuentas:** verificación de email, recuperación de contraseña, protección frente a fuerza bruta distribuida y gestión de invitaciones de equipo.
3. **Privacidad y cumplimiento:** redactar y revisar información a clientes y negocios, contratos de encargado de tratamiento cuando proceda, retención y derechos de acceso/supresión, y medidas de seguridad.
4. **Solicitudes de reserva externas:** decidir si serán pendientes de confirmación o confirmadas directamente con un mecanismo para evitar reservas falsas; no llamar «reserva confirmada» a una mera solicitud.
5. **Operación:** pruebas end-to-end con un negocio de verdad usando datos de prueba antes de permitir datos personales; monitorización de fallos y procedimientos ante incidentes.
6. **Producto:** validar alta rápida en móvil, adaptación de horarios y facilidad para personas mayores con 5-10 negocios locales antes de añadir módulos.

## MVP comercial recomendado

**Incluido:** cuenta de negocio, agenda sincronizada, cita manual, reservas web sin app, clientes habituales, servicios, profesionales, horarios partidos, vacaciones, cancelación, confirmación de solicitudes y mensajes de confirmación preparados para copiar.

**No incluido sin decisión adicional:** pagos, TPV, facturación, IA, informes avanzados, inventario o integración automatizada con WhatsApp.

## Indicadores de validación

- Tiempo medio para registrar por teléfono una cita nueva: objetivo exploratorio menos de 30 segundos.
- Porcentaje de solicitudes online confirmadas sin solapamiento: objetivo 100 %.
- Negocios que siguen usando Unespacio tras 4 semanas.
- Número de dobles reservas por errores del sistema: objetivo 0.
- Negocios dispuestos a pagar después de probarlo con sus citas cotidianas.
- Número de incidencias de usuarios mayores o no digitalizados al concertar una cita sin cuenta.

Los objetivos son hipótesis para medir, no resultados logrados.

## Regla de publicación

GitHub Pages es **solo una demo**. El servidor real se podrá habilitar para clientes únicamente cuando un responsable haya comprobado los bloqueadores anteriores en un entorno apropiado. No promocionar la versión 0.11.0 como producto de producción ni introducir datos reales en la demo.

## Automatizaciones opcionales incorporadas en 0.11.0

**Demostración pública:** se puede activar o desactivar la preparación de recordatorios, generar el resumen de mañana y apuntar clientes ficticios a una lista de espera. Si se cancela una cita, la demo muestra coincidencias y mensajes preparados para copiar. **No envía correos ni WhatsApps.**

**Aplicación privada (código, sin desplegar):** preferencias de automatización por negocio, avisos al propietario por nuevas solicitudes, recordatorios de cita 24 h antes con email y consentimiento, resumen diario y aviso al primer cliente de lista de espera compatible tras cancelación. Los emails se almacenan en cola PostgreSQL y requieren worker SMTP independiente configurado.

**Riesgos/bloqueadores específicos antes de activar envíos:** proveedor SMTP con dominio autenticado (SPF/DKIM/DMARC), política de privacidad, consentimiento registrable, procedimiento de bajas y revocación, supervisión de fallos de entrega, límites de abuso y revisión del sistema de reintentos para evitar mensajes duplicados. No enviar mensajes a clientes solo por disponer de su teléfono o email.

Las nuevas automatizaciones son una mejora de producto **implementada y comprobada en pruebas**; todavía no se han enviado emails a usuarios reales ni se han medido su efecto sobre cancelaciones, asistencia o ocupación.
