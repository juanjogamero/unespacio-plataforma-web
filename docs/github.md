# Flujo de GitHub para Unespacio Aula

Repositorio: `https://github.com/juanjogamero/unespacio-aula-frontend`

1. Cada cambio se versiona mediante commits revisables.
2. `Frontend checks` ejecuta `npm run check` (tipado + pruebas + compilación de producción).
3. `Desplegar frontend de desarrollo` crea la **versión de desarrollo** con datos ficticios y la publica en `https://juanjogamero.github.io/unespacio-aula-frontend/`.
4. No añadir credenciales ni datos de menores al repositorio ni a las Actions.
5. El futuro frontend productivo se publicará en el VPS con `npm run build`, junto a la API same-origin y autenticación real. GitHub Pages no lo sustituye.

El código sigue siendo público según la visibilidad actual del repositorio. Los controles de seguridad reales deben residir en el servidor.
