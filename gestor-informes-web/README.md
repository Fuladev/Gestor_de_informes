# Gestor de informes — versión web

Versión web (React + Material UI) del gestor de informes de visita técnica de **Fula Constructor S.A.S.**
Genera el mismo PDF que la aplicación de escritorio en Java (`informe_<orden>_<responsable>.pdf`):
encabezado con logo, una página por servicio con su grilla de evidencias y la página final de
documentación entregada, validación y firmas.

## Funcionalidades

- **Informes (CRUD):** crear, listar, buscar, editar y eliminar informes.
  - Orden de obra, ubicación, actividades, justificación (opcional)
  - Nombre, número y cargo (opcional) del responsable
  - Fecha de inicio y fecha de finalización (se valida que la final no sea anterior)
  - Texto de validación: *visita técnica* o *recibido a satisfacción*
- **Servicios (CRUD):** cada servicio se crea con un nombre y luego se le suben sus evidencias.
  Se pueden renombrar, eliminar y reordenar (1., 2., 3. … en el PDF).
- **Evidencias (CRUD):** subir varias imágenes a la vez (botón o arrastrar y soltar), ver, renombrar,
  reemplazar y eliminar. Se **ordenan por nombre en orden natural**: `img1`, `img1 2`, `img2`, `img10`.
  Las imágenes se validan al subirlas (archivos dañados o formatos no soportados se rechazan con un aviso)
  y se normalizan a JPEG (máx. 1600 px) para que el PDF quede liviano.
- **Previsualización:** muestra el PDF tal cual se descargará y una pestaña de **revisión** que marca
  servicios sin evidencias, imágenes dañadas, de baja resolución, sin nombre o con nombre repetido,
  y datos obligatorios faltantes.
- **Descarga del PDF:** desde el menú (⋮) de cada informe en el listado o desde el editor.
  Si el informe tiene errores, primero se abre la revisión.

Los datos se guardan en el navegador (IndexedDB), así que funciona sin servidor y sin conexión.
Cada navegador/equipo tiene sus propios informes.

## Uso

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run build    # build de producción en dist/
npm run preview  # sirve el build
npm run lint
```

El contenido de `dist/` se puede publicar en cualquier hosting estático (GitHub Pages, Netlify, Vercel…):
usa rutas relativas y navegación con `#`, no necesita configuración extra.

## Estructura

```
src/
  db.ts                    Base de datos IndexedDB (Dexie) y operaciones CRUD
  types.ts                 Modelos: Report, Service, Evidence
  config.ts                Datos fijos de la plantilla (empresa, gerente, documentación entregada)
  lib/pdf.ts               Generación del PDF con jsPDF (réplica de la plantilla iText)
  lib/images.ts            Validación y normalización de imágenes
  lib/validation.ts        Validación del formulario y revisión previa a la descarga
  lib/sort.ts              Orden natural de evidencias
  pages/                   Listado de informes y editor
  components/              Formulario, servicios, evidencias, previsualización, menús
  assets/                  Logo y firma usados en el PDF
```

Para cambiar el nombre del gerente, la lista de documentación entregada o la firma, edite
`src/config.ts` y `src/assets/firma.png`.
