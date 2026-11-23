# Arquitectura del prototipo de Unespacio Citas

**Versión:** 0.9.0 · demostración local, 23 de noviembre de 2026.

## Objetivo
Validar una experiencia sencilla de gestión de citas para barberías, peluquerías y pequeños negocios; en particular, facilitar que el profesional registre llamadas, WhatsApp y reservas en persona sin exigir tecnología al cliente.

## Implementación actual

- `src/main.ts` inicia la nueva interfaz de citas.
- `src/booking/app.ts` contiene las vistas de Agenda, Clientes, Servicios y Reserva online (demo), además de sus eventos.
- `src/booking/model.ts` implementa el modelo local de citas, servicios, profesionales y clientes.
- `src/booking.css` contiene el diseño responsive independiente.
- `localStorage` mantiene datos ficticios en el navegador actual; la carga inicial añade ejemplos.
- GitHub Pages publica una aplicación estática construida con TypeScript.
- `tests/booking.test.mjs` comprueba altas, solapamientos, cancelaciones y la nueva página pública.
- `scripts/verify-deployed.mjs` verifica el despliegue en navegador y genera capturas.

## Qué no garantiza

La comprobación local de solapamientos **no protege reservas simultáneas desde dos dispositivos**. La reserva online actual es una simulación en el navegador donde se abre la demo, no una página pública de reservas independientes. No existe autenticación real ni datos compartidos. No utilizar información de clientes reales.

## Camino hacia un MVP real

1. Definir reglas mínimas de horario laboral, duración, profesionales y cancelaciones.
2. Persistencia real por negocio con control de acceso servidor y datos separados entre negocios.
3. Crear y editar citas en una API con una transacción que verifique conflictos en el servidor.
4. Enlace de reserva web para clientes sin cuenta, con disponibilidad consultada al backend y límites contra abuso.
5. Probar el flujo con un negocio pequeño y observar si la reserva manual resulta suficientemente rápida.
6. Automatización de WhatsApp únicamente si se valida que aporta valor y se autoriza su coste y complejidad.

## Registro de alcance

Se han eliminado del código activo y del árbol actual del repositorio los módulos educativos heredados de Unespacio Aula. Se conservan únicamente en el historial Git de esta copia y en su repositorio académico original. El producto nuevo **no incorpora cursos, estudiantes, tareas ni calificaciones**.
