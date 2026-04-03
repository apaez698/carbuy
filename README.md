# carbuy

Landing y dashboard para captación de leads de compra de autos.

## Arquitectura Escalable

El frontend se organiza por capas para evitar crecimiento monolítico:

- Estructura HTML por página:
  - `index.html` (landing)
  - `dashboard.html` (métricas)
- Estilos desacoplados en `assets/css/`:
  - `assets/css/index.css`
  - `assets/css/dashboard.css`
- Lógica desacoplada en `assets/js/`:
  - `assets/js/index.js`
  - `assets/js/dashboard.js`
  - `assets/js/index/constants.js`
  - `assets/js/dashboard/` (config, api, charts, loaders, main)
- API serverless en `api/`.

Esto mantiene responsabilidades separadas:

- HTML: contenido y semántica.
- CSS: presentación.
- JS: comportamiento.
- API: reglas de negocio y persistencia.

## Reglas Para No Volver Al Monolito

- No agregar bloques grandes inline (`<style>` o `<script>`) en páginas nuevas o existentes.
- Crear archivos por dominio/página dentro de `assets/`.
- Si una página crece, dividir por módulos funcionales (por ejemplo `assets/js/index.estimator.js`, `assets/js/index.form.js`).
- Usar entrypoints pequeños y módulos por dominio:
  - entrypoint: `assets/js/dashboard.js`
  - módulos internos: `assets/js/dashboard/*.js`
- Mantener funciones del frontend puras y pequeñas cuando sea posible.
- Centralizar constantes/configuración al inicio de cada archivo JS.

## Convención De Módulos JS

- Entry points:
  - `assets/js/index.js`
  - `assets/js/dashboard.js`
- Regla:
  - Los entry points solo orquestan.
  - Las piezas de negocio/UI se separan en módulos internos.
  - Si una función se usa desde HTML con `onclick`/`onchange`, debe exponerse explícitamente con `window.<fn>`.

## Desarrollo

- Instalar dependencias:
  - `npm install`
- Ejecutar pruebas:
  - `npm test`
