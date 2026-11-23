# Unespacio Aula · Sistema de pantallas 0.6

## Principios que sustituyen los patrones de maqueta

- **Un módulo, una función**: la agenda se ve como un calendario real; los grupos como clases; los temas como un itinerario; las entregas como registros de trabajo. No reutilizar tarjetas blancas genéricas para información de naturaleza distinta.
- **Contexto visual**: los colores indican una asignatura, un grupo o un estado; no se añaden KPI o porcentajes decorativos.
- **Menos desplazamiento en escritorio**: las pantallas docentes y del alumno utilizan columnas complementarias. En móvil se reorganizan por prioridad y se permite desplazamiento vertical natural.
- **Jerarquía y accionabilidad**: cada vista tiene una acción principal; los demás accesos están en la zona contextual adecuada. Las tareas se crean dentro del tema, no desde un segundo menú duplicado.
- **Conservación de identidad**: logotipo existente intacto, paleta de azules profundos, contrastes definidos, acentos medidos por contexto.

## Calendario

`src/ui/calendar.ts` lee `Snapshot.lessons` y `Snapshot.assignments`, ambos procedentes del Gateway. Permite seleccionar días, cambiar de mes y alternar entre vista mensual y semanal. No utiliza un proveedor externo. La vista compacta siempre cambia de mes aunque el usuario haya abierto la vista semanal completa; las fechas se calculan en hora local del navegador.

Los botones del calendario tienen `aria-pressed`, etiquetas accesibles y un indicador independiente para sesiones y plazos. No se generan ni cancelan eventos desde el calendario: eso sigue perteneciendo a los formularios de sesión y actividad existentes.

## Organización visual por perfil

- **Profesor de academia**: próxima sesión protagonista, clases diferenciadas por grupo, seguimiento y calendario interactivo a la derecha.
- **Profesor particular**: una ficha única por alumno, próxima sesión y calendario. No se obliga a crear cursos.
- **Administrador**: grupos con sus alumnos y agenda de centro. La edición depende de las operaciones autorizadas por el Gateway.
- **Alumno**: siguiente tarea, materias, calendario mensual y recursos; agenda completa en `/agenda`.
- **Temas**: navegación visible por temas, un tema principal seleccionado y controles de añadir material / crear actividad junto a su sección. La tarea sigue asignándose a un grupo una sola vez.

## Verificación

Las comprobaciones automáticas cubren la generación de interfaces, los permisos de entorno, el escape de HTML, el cálculo de calendario, el cambio mensual/semanal y la estructura de clases/temas. Se han renderizado representaciones aisladas de las vistas con los mismos CSS a 320, 390 y 1440 px; esas capturas no sustituyen una prueba E2E real del sitio alojado.

**Estado de seguridad:** el frontend está preparado para la integración con `/api/v1` en el VPS. GitHub Pages ejecuta exclusivamente la configuración de desarrollo, con datos ficticios y roles de desarrollo. No utilizarlo con datos reales de menores ni para validar permisos de servidor.
