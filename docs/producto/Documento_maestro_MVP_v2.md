# UNESPACIO AULA — DOCUMENTO MAESTRO DEL MVP

**Versión:** 2.0 — revisión estratégica del 19 de noviembre de 2026  
**Estado:** definición de producto actualizada. **No** equivale a funcionalidades implementadas o verificadas en producción.  
**Referencias:** `Documento-maestro-del-MVP.txt` (v1.0), `unespacio_aula_app_v10.html` (identidad inicial) y `unespacio_aula_campus_v21_7.html` (prototipo interactivo más reciente).

## 1. Visión y principio de producto — MANTENER
Unespacio Aula es una sola plataforma educativa web, sencilla y útil para **profesores particulares y pequeñas academias**. Su objetivo es reducir tareas administrativas y mejorar la continuidad de las clases, no competir con un LMS generalista ni desarrollar un ERP escolar.

**Regla obligatoria antes de implementar:** identificar qué tarea repetida cada semana ahorra la función, a quién y cuánto esfuerzo evita. Si no se puede justificar con un uso real, se pospone.

**Principio de organización actualizado:** el producto comparte tecnología, datos de aprendizaje y componentes, pero presenta **dos maneras de trabajar según el plan**. No se obliga a un profesor particular a crear aulas o cursos para cada alumno o asignatura.

## 2. Público y estructura por plan — DECISIÓN DE PRODUCTO
### Plan Profesor (organización por alumno)
- Público: **un único docente** que imparte clases particulares o refuerzo, normalmente individuales.
- Entrada principal: **Mis alumnos**. Puede consultar alumnos y próximos compromisos desde aquí; no necesita pasar por Cursos.
- Una **ficha única por alumno** recoge nombre, curso/nivel escolar, materias atendidas, materiales, tareas, próximas clases y resumen de la sesión anterior.
- Las materias (p. ej., Matemáticas e Inglés para Lucía de 2.º ESO) son filtros o agrupaciones **dentro de la misma ficha**, nunca motivos para duplicarla.
- Los **grupos son opcionales** y no son requisito para publicar recursos o tareas individuales.
- Solo puede haber **un profesor titular** en ese espacio (el acceso del alumno es gratuito y no consume otra licencia docente).

### Plan Academia (organización por grupo)
- Público: centros pequeños con varios docentes.
- Entrada principal del centro: **Grupos** / **Panel del centro**; desde ahí se organizan grupos por nivel y materia (p. ej., «2.º ESO · Matemáticas»).
- Cada grupo tiene docentes asignados, alumnos matriculados, materiales, tareas, avisos y agenda.
- Un docente publica una tarea o recurso **una sola vez para todo el grupo**. La relación con cada alumno permite consultar sus entregas y notas individuales.
- El administrador gestiona miembros y grupos; cada docente solo trabaja con los grupos que tenga asignados. Un alumno solo ve sus propios contenidos y entregas.

**Común:** identidad visual, inicio de sesión, perfiles de profesor/alumno/administrador según corresponda, materiales, tareas, entregas, notas sencillas, agenda y comunicación básica.

## 3. Hipótesis comerciales — NO APROBADAS COMO TARIFAS DEFINITIVAS
| Variable | Hipótesis | Estado |
|---|---|---|
| Precio Profesor | **6,99 €/mes** | Propuesta, validar disposición a pagar |
| Precio Academia | **19,99 €/mes** | Propuesta, validar costes y valor percibido |
| Prueba gratuita | **Tres meses** en ambos planes | Propuesta, evaluar conversión y abuso |
| Quién paga | Profesor particular o academia | Decisión de principio de negocio |
| Alumnos | Acceden **gratis** | Decisión de principio de negocio |
| Profesor | Un solo docente | Restricción funcional del plan propuesto |
| Alumnos activos en Profesor | **15–20** | Rango exploratorio; cifra no cerrada |
| Docentes y alumnos incluidos en Academia | Sin cifra acordada | Pendiente de validación |
| Cobros de clases a familias | Sin función comprometida | Decisión pendiente |

**Importante:** probar los dos recorridos de producto **no obliga** a introducir ahora cobros, pasarela de pagos ni facturación. Los precios y la duración de prueba pueden mostrarse solo en material comercial de investigación, nunca darse por operativos en este prototipo.

## 4. MVP: acciones semanales que deben funcionar
| Prioridad | Acción | Ahorro concreto |
|---|---|---|
| P0 | Ver en «Mis alumnos» qué toca con cada estudiante | Evita buscar en chats, notas y carpetas |
| P0 | Abrir ficha única de alumno con nivel y varias materias | Evita duplicar aulas y datos del mismo alumno |
| P0 | Ver lo trabajado en la última sesión | Evita reconstruir el contexto antes de clase |
| P0 | Preparar y registrar la próxima sesión en dos o tres pasos | Evita planificar a mano cada encuentro |
| P0 | Programar **clases recurrentes** (regla semanal básica) | Evita repetir la misma cita semana tras semana |
| P0 | Registrar **nota breve de sesión** (fecha, materia, qué se trabajó, siguiente paso) | Evita depender de la memoria y mensajes dispersos |
| P0 | Adjuntar/compartir material y asignar tarea desde ficha o grupo | Evita navegación innecesaria y duplicación |
| P0 | Entrega sencilla de tarea, revisión y nota básica | Cierra el ciclo docente-alumno sin herramientas externas |
| P0 | Crear grupo, matricular alumnos y asignar profesor (Academia) | Evita mantener listados y envíos individuales |
| P0 | Publicar una tarea/recurso una sola vez para el grupo (Academia) | Reduce trabajo repetido del docente |
| P1 reducido | Avisos o comentario privado vinculados a tarea/alumno/grupo | Reduce mensajes fuera de contexto |

Las acciones P0 definen el **núcleo**. P1 solo si no retrasa el lanzamiento. La tarea individual y la tarea a grupo se apoyan en la misma entidad `Actividad`; únicamente cambia el destinatario.

## 5. Qué ve cada usuario al entrar
**Profesor particular (plan Profesor):** pantalla «Mis alumnos» con búsqueda, fichas compactas, próxima sesión por alumno y accesos «Preparar clase», «Registrar sesión», «Enviar tarea/material». Agenda disponible; sección Cursos **no obligatoria ni principal**.

**Administrador de academia (plan Academia):** entrada a «Grupos», listado por nivel y materia, docentes asignados, próximos horarios, tareas que requieren atención y botón «Crear grupo / Asignar profesor / Añadir alumnos». No mostrar un módulo de finanzas ni paneles de métricas avanzadas.

**Profesor de academia:** entrada a «Mis grupos» con sesiones próximas y tareas por corregir. Dentro de un grupo puede publicar recursos y actividades, consultar entregas, anotar sesiones y comunicarse de forma básica.

**Alumno (ambos planes):** entrada a «Mi aprendizaje»: próximas clases, materias o grupos accesibles, tareas pendientes, materiales y notas. En Profesor ve su relación con el tutor y materias, no la estructura administrativa del docente.

**Administrador/profesor combinados:** permitir que el administrador también enseñe se mantiene como decisión **pendiente**; el prototipo puede simularlo, pero producción requiere especificar permisos.

## 6. Especificación de pantallas — REVISIÓN PROPUESTA
| Pantalla | Plan Profesor | Plan Academia | Reutilización del mockup |
|---|---|---|---|
| Inicio | Mis alumnos como hogar de trabajo | Grupos como hogar de trabajo | Barra lateral, cabecera, búsqueda, listas y acciones |
| Ficha de alumno | **Principal**: nivel, materias, sesiones, recursos, tareas, notas breves | Ficha secundaria para información individual y entregas | Fichas, listas, controles y paneles del alumno |
| Materia | Pestaña/filtro **dentro de ficha de alumno** | Atributo del grupo | Filtros de materias, pestañas actuales |
| Grupo | Opcional | **Principal** por nivel/materia | Pantalla de curso v21.7 adaptada a grupo |
| Actividad | Desde ficha de alumno, asignación directa | Desde grupo, publicación conjunta | Formularios de tareas, entregas y calificación |
| Material | Desde ficha/materia | Desde grupo/unidad | Fila de recurso, panel de material y adjuntos |
| Agenda | Individual y recurrente | Clases por grupo y docentes | Calendario existente; añadir patrón recurrente sencillo |
| Sesión | Última sesión, próxima y registro breve | Registro de clase de grupo | Componente de detalle y nuevo formulario corto |
| Mi perfil / ajustes | Pantalla completa, avatar abre panel | Igual | Componentes existentes |

**Eliminar del primer plano:** métricas decorativas, porcentajes inventados, duplicación alumno→curso→unidad para la enseñanza 1:1, pantallas vacías de academias sin grupos y módulos de marketing dentro del campus.

## 7. Modelo conceptual y seguridad — ACTUALIZAR ANTES DE PROGRAMAR
**Espacio educativo / organización** (`workspace`) con tipo `profesor` o `academia`; `usuario`, `membresía`, `rol`, `alumno` (identidad única **por espacio**), `materia`, `alumno_materia` (y nivel si corresponde), `grupo` (opcional en Profesor), `grupo_docente`, `grupo_alumno`, `sesión`, `regla_recurrencia_semanal`, `recurso`, `actividad`, `destinatario_actividad`, `entrega`, `calificación`, `aviso/comentario`.

- Una **misma ficha de alumno** se vincula a **varias materias**; no se duplica por curso o nivel.
- El material y la actividad se destinan **a un alumno/materia o a un grupo**, sin duplicar la lógica de entrega y calificación.
- Una sesión admite `fecha_hora`, `duración`, `destinatario (alumno/grupo)`, `materia`, `resumen`, `siguiente_paso`, `autor`; el registro de la sesión no debe convertirse en expediente académico.
- La recurrencia MVP se limita a **una pauta semanal** con hora, duración, destinatario y fecha de fin opcional; las excepciones/cancelaciones pueden marcarse manualmente. No se incluye reserva automática ni disponibilidad compleja.
- Cada consulta y modificación debe comprobar **pertenencia a espacio, rol, asignación a alumno/grupo, y autoría cuando proceda, en servidor**. Jamás confiar en cambios de rol del navegador.
- Minimización de datos de menores, controles de archivos, eliminación, copias, RGPD/LOPDGDD y permisos se revisan antes de cualquier piloto real.

El diseño de las relaciones concretas, restricciones y proveedor técnico es aún preliminar; esta sección no representa tablas ya creadas.

## 8. Arquitectura y bajo coste — MANTENER
Aplicación web responsive, base de datos relacional, autenticación real, almacenamiento privado, permisos en servidor y separación entre espacios. Preferencia preliminar por Next.js/TypeScript y PostgreSQL o un servicio consolidado equivalente que reduzca mantenimiento. Sin microservicios ni infraestructura prematura. Proveedores y costes **pendientes de evaluación**.

## 9. Exclusiones MVP — AJUSTAR
No se desarrollan ahora: **pasarela de pago, facturación, cobros de familias, IA, videoconferencia propia, gamificación, cuestionarios complejos, informes avanzados, expedientes extensos, marketplace, integraciones oficiales, aplicaciones nativas, multi-sede, automatizaciones avanzadas**. 

A diferencia de la v1.0, **sí se definen dos propuestas comerciales** para investigación, pero **no** se implementa de entrada su suscripción en la app. «Gestión de cobros de clases» sigue sin decisión.

## 10. Dos recorridos objetivo (aceptación del MVP)
### Profesor: preparar la próxima clase de Lucía
1. Inicia sesión y llega a «Mis alumnos»; ve **Lucía Martín · 2.º ESO · Matemáticas e Inglés** en una sola ficha.
2. Abre Lucía, selecciona Matemáticas y consulta «Última sesión»: *ecuaciones de primer grado; quedó pendiente revisar problemas 4 y 5*.
3. Ve la próxima clase recurrente y pulsa **Preparar próxima sesión**; anota objetivo y materiales, sin crear curso.
4. Desde la ficha asigna *Ejercicios 4 y 5* y un PDF/enlace para Matemáticas, individualmente.
5. Después de la clase registra una nota corta: qué se trabajó, tarea acordada y siguiente paso. La siguiente visita muestra ese resumen como «Última sesión».

### Academia: asignar tarea al grupo de 2.º ESO
1. La administradora accede a «Grupos», abre **2.º ESO · Matemáticas** y comprueba docentes y alumnos inscritos.
2. Asigna o verifica el profesor responsable y los miembros del grupo.
3. El docente abre el grupo y pulsa **Crear actividad**; introduce instrucciones, fecha y material asociado si procede.
4. Publica **una sola vez**; todos los alumnos del grupo la ven en su vista.
5. Cada alumno entrega su trabajo individual; el docente consulta la lista de entregas, corrige y publica una nota básica con devolución.

## 11. Plan de ejecución en fases pequeñas
1. **Fase 0 / especificación:** aprobar pantallas, reglas de destinatario alumno/grupo, recurrencia semanal y estados mínimos de tarea. Verificar con 2–3 usuarios de cada segmento.
2. **Fase 1 / base segura:** cuentas y membresías, espacios y aislamiento, permisos en servidor; navegación acorde al plan.
3. **Fase 2 / Profesor:** fichas únicas, materias, sesiones recurrentes, registro de última sesión y materiales/tareas individuales.
4. **Fase 3 / Academia:** grupos, profesores/asignaciones, publicaciones conjuntas; reutilizar tareas/entregas del núcleo.
5. **Fase 4 / piloto:** entregas/calificaciones, correcciones y usabilidad; validar repetición semanal y costes antes de fijar precios.

**Backlog mínimo sugerido (18 entregables, sujeto a recorte):** 1) acceso y recuperación; 2) espacios y permisos; 3) invitaciones; 4) navegación por modo; 5) alta/lista de alumnos; 6) ficha y nivel; 7) materias; 8) resumen de sesión anterior; 9) agenda; 10) recurrencia semanal; 11) registro de sesión; 12) materiales; 13) tareas individuales; 14) entregas; 15) corrección/nota; 16) grupos y matrículas; 17) asignación de profesor y tareas grupales; 18) pruebas de aislamiento, móvil y piloto.

## 12. Métricas de validación (sin panel de informes)
Docentes que preparan o registran **al menos una sesión por semana**, porcentaje de clases registradas, tareas/materiales enviados desde ficha o grupo, entregas completadas, tiempo hasta preparar la siguiente clase y retorno semanal. Entrevistas breves para descubrir por qué siguen usando o dejan de usar el producto. Comprobar coste de almacenamiento y soporte por espacio.

## 13. Decisiones confirmadas frente a hipótesis abiertas
**Decidido para el diseño del producto:** una sola plataforma; dos organizaciones de trabajo; ficha única por alumno para Profesor; grupos/niveles para Academia; un docente en Profesor; alumnos acceden gratis; prioridad a sesiones recurrentes, notas de sesión, materiales y tareas desde contexto. Preservar estilo visual del mockup.

**Pendiente de validar:** precios 6,99/19,99 €, prueba de 3 meses, límite 15–20 alumnos, cupos de docentes y alumnos en Academia, cobros de clases, política concreta de archivos/almacenamiento, mensajería mínima, permisos de administrador que enseña, proveedor/infraestructura, y momento de implementar suscripción.

**Estado real actual:** las pantallas HTML son prototipos locales. No existe aquí evidencia de backend de producción, cuentas reales, sincronización entre usuarios ni cobro en funcionamiento. Toda función implementada en el prototipo debe validarse después al construir la aplicación real.

## 14. Reglas de colaboración y control de cambios
Mantener separadas **decisión de alcance**, **hipótesis**, **prototipo implementado**, **funcionalidad de producción** y **función probada**. Todo cambio estructural requiere revisar este documento; las propuestas de precio no crean obligaciones técnicas inmediatas. No añadir funciones si no ahorran trabajo recurrente a profesores o academias. Usar iteraciones pequeñas y conservar las fuentes visuales existentes.

---
### Registro de cambios respecto a la v1.0
- **§2, §3:** Cursos ya no son el centro obligatorio; se sustituye por ficha única + grupos opcionales (Profesor) o grupos como centro (Academia).
- **§3:** Añadidas recurrencia semanal, memoria de sesión y preparación contextual como P0; no se trataban explícitamente en v1.
- **§4, §11 y §12:** La exclusión absoluta de múltiples planes y precios se reemplaza por **hipótesis comerciales documentadas**, sin cobro implementado; se mantiene fuera la gestión de cobros de clases hasta decidir.
- **§5:** El aspecto del mockup se conserva, pero cambian accesos, jerarquía de navegación y pantalla de entrada según plan.
- **§7:** Entidades y relaciones ampliadas para alumno con materias y grupos sin duplicación; sesiones y recurrencia.
- **§9–10:** Fases y criterios de éxito pasan a medir preparación de sesiones y tareas individuales/grupales, no solo creación de cursos.
- **§14:** Próximo hito: validar recorridos Profesor y Academia antes de seguir ampliando el campus visual.
