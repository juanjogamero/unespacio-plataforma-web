# Unespacio Aula — Propuesta de pantallas v22

**Fecha:** 19 de noviembre de 2026  
**Base visual:** v21.7 (colores, DM Sans/Manrope, navegación, iconos, fichas y paneles), con adaptación estratégica de la v22.  
**Estado:** propuesta de UX y prototipo local. No es una aplicación de producción ni representa funciones validadas con usuarios.

## Modelo de navegación
**Una sola aplicación** con un modo de organización determinado por la configuración contratada. El selector «Vista previa del producto» de la v22 **solo existe para comparar recorridos en la maqueta**; no es un selector real de suscripción ni de permisos.

| Perfil y plan | Pantalla de entrada | Navegación primaria | Acción más frecuente |
|---|---|---|---|
| Profesor · Profesor | **Mis alumnos** | Mis alumnos, Tareas, Agenda; grupos opcionales | Abrir alumno → preparar clase / registrar sesión |
| Administrador · Academia | **Grupos del centro** | Grupos, Actividades, Agenda, Alumnos | Abrir grupo → asignar docentes/alumnos / crear tarea |
| Docente · Academia | **Mis grupos** | Mis grupos, Actividades, Agenda | Abrir grupo → publicar material o tarea para todos |
| Alumno (ambos) | **Mi aprendizaje** | Mi aprendizaje, Mis tareas, Agenda | Ver próxima clase, entregar tarea, consultar materiales |

## Pantallas por prioridad

### P0-01 Mis alumnos (Profesor)
**Contenido:** nombre, nivel, materias, fecha de próxima sesión y referencia a la última. **Acciones:** nueva ficha única, abrir ficha, buscar. **Ahorro:** no repetir datos ni construir aulas artificiales para 1:1.

### P0-02 Ficha única de alumno
**Encabezado:** persona y nivel; pestañas pequeñas para Matemáticas, Inglés, etc. **Columna de trabajo:** última clase, siguiente clase/preparación, tareas. **Columna contextual:** materiales y sesiones anteriores. **Acciones:** preparar, registrar, programar recurrente, asignar tarea y compartir recurso. Las materias organizan el contenido de una misma persona, no crean alumnos duplicados.

### P0-03 Clase recurrente / registro de sesión
Formulario breve: día de semana, hora y duración; agenda calcula próxima aparición. Al terminar, registrar fecha, materia/grupo, trabajo realizado y siguiente paso. Sin reservas, conciliación de horarios ni facturación.

### P0-04 Actividad y entrega individual
Desde la ficha se asignan instrucciones y plazo. El alumno responde y, cuando corresponda, el docente corrige con nota 0–10 y devolución. En producción se reutilizará el mismo núcleo de `Actividad` que se usa para grupos. **En la demo v22 la entrega individual está simplificada a texto; los flujos de archivos de la v21.7 siguen en las actividades de grupo.**

### P0-05 Grupos del centro (Academia)
Vista de grupos por nivel/materia, responsable, participantes y accesos directos. El administrador puede crear grupo y asignar profesor/alumnos; el docente trabaja solo en grupos asignados.

### P0-06 Grupo (Academia)
Se reutiliza la pantalla de curso v21.7: índice de temas, materiales, actividades, tablón y alumnos. Una actividad publicada tiene un único enunciado de grupo y entregas individuales. Añadidos accesos de agenda semanal y registro breve de sesión por grupo.

### P0-07 Mi aprendizaje (Alumno)
Prioriza pendientes, próximas clases, materias y grupos a los que pertenece. El alumno no ve configuración del centro, fichas de otros alumnos ni calificaciones ajenas.

### P1 reducido — avisos y perfil
Se conservan los accesos existentes al perfil (página completa), agenda contextual y notificaciones compactas. La comunicación avanzada no se incorpora.

## Recorrido A — Profesor prepara Matemáticas para Lucía
1. Entra en **Mis alumnos** y encuentra **Lucía Martín, 2.º ESO, Matemáticas e Inglés**.
2. Abre su **ficha única**; selecciona **Matemáticas** (sin crear aula).
3. Lee la **última sesión**: ecuaciones de primer grado; ejercicios 4–5 pendientes.
4. Consulta la **próxima clase recurrente**, o programa la pauta semanal si no existe.
5. Pulsa **Preparar próxima sesión**, anota el objetivo y el material a revisar.
6. Pulsa **Asignar tarea** y publica «Resolver los problemas 4 y 5» para Lucía.
7. Después de la clase pulsa **Registrar sesión**; el registro pasa a ser la referencia de la próxima visita.

**Criterio de aceptación:** el ciclo completo se realiza desde la ficha de una sola alumna, manteniendo separadas sus dos materias.

## Recorrido B — Academia asigna una tarea a 2.º ESO
1. La administradora abre **Grupos del centro**.
2. Localiza **Matemáticas · 2.º ESO** y gestiona responsables y estudiantes.
3. El profesor entra en ese grupo y pulsa **Crear actividad** desde sus controles.
4. Introduce instrucciones y fecha; **publica una sola vez**.
5. La actividad aparece para todos los alumnos del grupo, con entregas independientes.
6. El docente revisa quién entregó y califica cada trabajo.

**Criterio de aceptación:** asignar la tarea no requiere copiar instrucciones a alumnos uno por uno; la nota sí es individual.

## Componentes reutilizados de la v21.7
- Estructura de app, menú izquierdo, cabecera, buscador, avatar, notificaciones.
- Campos, botones, panel lateral para formularios y páginas completas para la ficha.
- Filas de recursos, lista de actividades, notas y comentarios.
- Tarjetas de cursos, ahora usadas como grupos en Academia; no obligatorias en Profesor.
- Agenda/calendario, con añadido mínimo de pauta recurrente semanal.
- Estética visual y tipografías; sin rediseño general ni nuevas bibliotecas.

## Límites explícitos de la maqueta
Los datos son de ejemplo y se guardan **solo en este navegador**. El cambio de vista Profesor/Academia/Alumno **no verifica permisos reales**. El backend, aislamiento por espacio, invitaciones reales, archivos privados compartidos, suscripciones y pruebas automáticas de producción siguen pendientes. El objetivo de v22 es contrastar **las pantallas y la lógica de trabajo**, no completar la implementación del SaaS.

## Decisiones comerciales aún abiertas
- **6,99 €/mes** Profesor y **19,99 €/mes** Academia: hipótesis de precios.
- **Tres meses gratis**: propuesta de adquisición, por validar.
- **15–20 alumnos activos** en Profesor: rango por validar.
- Academia: cupos de profesores y alumnos por determinar.
- Alumnos acceden gratis: principio establecido.
- Gestión de cobros y cuándo activar suscripciones: fuera de esta iteración, decisión pendiente.
