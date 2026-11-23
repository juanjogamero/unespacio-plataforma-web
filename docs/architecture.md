# Arquitectura frontend — Iteración 01

## Decisiones de esta fase

1. **Conservar el diseño v26**, no recrear una plantilla nueva. Menú blanco, fondo gris azulado, azul como acento docente, tarjetas de grupo de colores, tablas y listas compactas.
2. **Aplicación TypeScript sin dependencias de runtime** como primer arranque económico y verificable. El código está modularizado; se podrá migrar a un framework si los recorridos y el número de componentes lo justifican. No introducir dependencias solo por moda.
3. **Una única aplicación** con `Session.role` y `Session.workspaceId` servidos por backend. El cliente muestra rutas apropiadas, pero las decisiones de acceso SIEMPRE son del servidor.
4. **Separación frontend/backend** con `Gateway`, `HttpGateway` y un `PreviewGateway` aislado del build productivo.
5. **Frontend bajo el mismo origen que la API** para simplificar cookies seguras y evitar CORS de credenciales. El VPS servirá el frontend estático y hará reverse proxy de `/api/v1` al backend.
6. **Archivos solo mediante backend**, evitando URLs permanentes públicas para documentos de menores.

## Frontend no equivale a producto de producción

En esta fase hemos implementado navegación, vistas y formularios. La compilación productiva, al carecer de backend, muestra una pantalla de acceso pendiente. **No** se habilita un modo de suplantación de roles en producción. El modo local simula cambios de rol para probar diseño y no representa autenticación.

La aplicación real debe bloquear la vista hasta que el backend devuelva una sesión válida.

## Modelo de producto (MVP)

`workspace` → miembros con rol → alumno (único por organización) y grupos → materias/temas → materiales/actividades → entregas/notas. Las clases y recurrencias se relacionan directamente con un alumno o con un grupo. Los campos del frontend son un primer contrato orientativo, no el esquema final de BD.

## Próximas fases

- **Fase 02:** validación final de pantallas, sistema de componentes, filtros, estados vacíos, accesibilidad, creación y edición de grupos/alumnos y pruebas E2E.
- **Fase 03:** especificación completa de API y autenticación segura (sesión, CSRF, usuario, permisos), modelado multiempresa, políticas de archivos.
- **Fase 04:** integración en VPS (HTTPS, cabeceras de seguridad, copias de seguridad, logs mínimos, rate limits) y pruebas de aislamiento entre academias.
- **Fase 05:** piloto cerrado solo tras revisar privacidad, permisos, incidencias, recuperación de cuenta y eliminación de datos.

## Definiciones de estado

- **Implementado:** existe código que lo realiza en la interfaz o en la simulación local.
- **Verificado:** existe evidencia de prueba, limitada al entorno donde se ejecutó.
- **Pendiente:** requiere API real, persistencia, seguridad, despliegue o una decisión explícita de producto.
