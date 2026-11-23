# Dirección de diseño · Unespacio Aula

## Objetivo

La interfaz debe funcionar como un **campus educativo de trabajo cotidiano**, no como una colección de tarjetas promocionales. Preservamos la identidad del logotipo actual y los recorridos aprobados del MVP.

## Decisiones para la interfaz

1. **Contenido antes que decoración.** Los bloques repetitivos (próximas clases, recursos, tareas, participantes) se representan como listas estructuradas con columnas, fechas y separadores. No se encapsulan automáticamente en tarjetas de color.
2. **Una función, una composición.** Tarea pendiente = estado y plazo; clase = día, hora y materia; material = tipo, materia y acción de consulta. El componente depende de la función.
3. **Color con significado.** Azul para navegación y foco, colores de materias para reconocer contexto; los fondos neutros no compiten con el contenido.
4. **Escala tipográfica moderada.** Los encabezados de herramientas no deben ocupar tanto espacio como el contenido. Evitar títulos gigantes en barras laterales.
5. **Densidad útil.** Mostrar suficiente contexto para evitar abrir una pantalla solo para conocer una fecha, una materia o un tipo de archivo. No añadir indicadores de progreso ficticios.
6. **Interacciones intencionales.** Las filas clicables requieren un destino real; el estado hover comunica acción sin desplazar banners o recuadros.
7. **Responsive de verdad.** La columna de utilidades pasa a dos columnas en tabletas y a una columna de ancho completo en móvil. Objetivo: sin desplazamiento horizontal entre 320 y 1440 px.
8. **Accesibilidad.** Contraste, tamaños de toque, nombre accesible de iconos, estados de foco y movimiento reducido; comprobarlos en pruebas posteriores de teclado y tecnologías de asistencia.

## Revisión v0.5.0

En la vista de alumno, «Próximas clases» y «Material de clase» dejan de tener fondos pastel y grandes rellenos. Se integran como un área de trabajo con línea divisoria, encabezados funcionales y filas compactas. La agenda muestra enlaces reales; los recursos indican el tipo inferido de su formato (`PDF`, `ENLACE`, `APUNTE`...). No se han cambiado las rutas ni los contratos del backend.

Esta implementación es **frontend**. Las pruebas locales de presentación no sustituyen la autenticación, los permisos y la persistencia segura que debe proporcionar el VPS.
