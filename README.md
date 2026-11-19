# LeerIA · página del proyecto

Página de presentación de LeerIA, el proyecto de el Instituto IES 9-023 (Mendoza) para evaluar la fluidez lectora con ayuda de la inteligencia artificial.

Es un sitio estático (HTML, CSS y JavaScript, sin dependencias ni compilación) pensado para GitHub Pages.

## Qué incluye

- **Demo de la evaluación**: compara un texto con lo que leyó un alumno usando el mismo algoritmo de alineación de la aplicación (`src/reading.js`) y calcula PPM, PPCM y precisión.
- Secciones del pitch: apertura, problema, solución, el camino y cierre, más un resumen técnico.

## Archivos

| Archivo | Para qué |
|---|---|
| `index.html` | Contenido de la página |
| `styles.css` | Estilos (colores del logo, tipografía Nunito como la app) |
| `app.js` | Demo de alineación |
| `assets/logo.jpg` | Logo |
| `.nojekyll` | Le indica a GitHub Pages que publique los archivos tal cual |

## Verla en la computadora

Abrir `index.html` con el navegador, o servir la carpeta:

```bash
npx serve .
```

## Publicar en GitHub Pages

1. Crear un repositorio en GitHub, por ejemplo `leeria` (o `<usuario>.github.io` para usar la dirección principal).
2. Subir estos archivos:

   ```bash
   git init
   git add .
   git commit -m "Página de presentación de LeerIA"
   git branch -M main
   git remote add origin https://github.com/<usuario>/leeria.git
   git push -u origin main
   ```

3. En GitHub: **Settings → Pages → Build and deployment**, elegir *Deploy from a branch*, rama `main`, carpeta `/ (root)` y guardar.
4. A los pocos minutos queda en `https://<usuario>.github.io/leeria/`.

Para usar un dominio propio, cargarlo en **Settings → Pages → Custom domain** y crear el registro DNS que indica GitHub.
