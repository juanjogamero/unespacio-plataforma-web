# Contrato de API del frontend (diseño, pendiente de VPS)

API misma procedencia bajo `/api/v1` con TLS. Los IDs, roles y organización se resuelven **en el servidor**, no a partir de parámetros confiados del navegador.

## Autenticación y sesión

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/auth/csrf` | Obtiene `{csrfToken}` para login; prepara cookie preautenticación |
| POST | `/auth/login` | `{email,password}` con `X-CSRF-Token`, crea cookie de sesión HttpOnly; rotar ID |
| POST | `/auth/logout` | Revoca sesión/cookie; requiere CSRF |
| GET | `/me/snapshot` | Devuelve snapshot **filtrado por permisos** y `csrfToken`; 401 sin sesión |

La sesión debe usar `HttpOnly`, `Secure`, `SameSite`, expiración/revocación, protección antbruteforce y permitir restablecer contraseña mediante flujo todavía pendiente de definir.

## Operaciones del frontend

| Método | Ruta | Uso |
|---|---|---|
| POST | `/students` | Crear ficha de alumno en la organización autorizada |
| POST | `/groups` | Crear grupo, con profesor y alumnado (solo administrador) |
| POST | `/topics` | Crear tema |
| PATCH | `/topics/:id` | Editar tema |
| POST | `/materials` | Adjuntar material (multipart); límites y escaneo servidor |
| GET | `/materials/:id/access` | URL segura de material autorizado |
| POST | `/assignments` | Publicar actividad individual/grupal |
| POST | `/assignments/:id/submissions` | Crear entrega de alumno |
| GET | `/submissions/:id/access` | URL temporal para archivo entregado; autorización |
| PATCH | `/submissions/:id/grade` | Nota y comentarios (solo docente responsable) |
| POST | `/lessons` | Registrar sesión |
| PATCH | `/lessons/:id` | Modificar preparación o registro |

Todas las mutaciones requieren sesión válida y CSRF. Validar datos y pertenencia a la organización de cada ID. Los formularios aún necesitan acciones de edición/eliminación adicionales y endpoints para miembros, matrículas y recurrencias reales.

## Límites

No hay servidor implementado en este repositorio. El entorno de desarrollo es una implementación de navegador aislada, no una API ni almacenamiento entre usuarios reales.


### Planificación semanal (frontend)

El formulario permite solicitar `recurring: true` para crear una serie semanal. En desarrollo local se generan ocho sesiones, cada siete días, guardadas únicamente en el navegador para comprobar la agenda. El backend del VPS deberá validar autorización, fechas, duración, recurrencia y creación de la serie de forma transaccional antes de permitir datos reales; este comportamiento NO constituye una programación multiusuario segura.
