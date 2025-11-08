# Recuerdos Resonantes

Sitio estático con un quiz romántico-musical de 10 preguntas, visualizador reactivo y sección secreta con la ecuación de Dirac. Diseñado para desplegarse fácilmente en GitHub Pages.

## Características principales

- Reproductor de audio con controles completos (play/pause, anterior, siguiente, volumen, mute, progreso, tiempo restante) y visualizador Canvas usando Web Audio API.
- Fondo, partículas y confeti sincronizados con la energía y beats del audio.
- Quiz dinámico de 10 preguntas con imágenes, validación accesible y barra de progreso animada.
- Sección secreta que revela la ecuación de Dirac más un mensaje romántico cuando aciertas todo.
- Sonidos UI precargados con AudioBuffer para respuestas inmediatas.
- Tema glassmorphism oscuro con variación Dark/Dim, tipografías Inter y Playfair Display.
- Respeto a `prefers-reduced-motion` y control manual de animaciones.
- Arrastra y suelta tu propio MP3 o usa el selector para personalizar la música sin subirla a un servidor.

## Estructura del proyecto

```
/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── audio.js
│   ├── visualizer.js
│   ├── particles.js
│   └── confetti.js
├── config/
│   ├── images.js
│   └── music.js
├── img/
│   ├── placeholder.svg
│   ├── cover1.jpg
│   ├── cover2.jpg
│   └── q1.jpg ... q10.jpg
├── music/
│   ├── track1.mp3
│   └── track2.mp3
├── sfx/
│   ├── correct.mp3
│   ├── wrong.mp3
│   └── unlock.mp3
├── .github/workflows/deploy.yml
├── README.md
└── LICENSE
```

## Personalización

### Imágenes del quiz

Edita [`config/images.js`](config/images.js) para apuntar a tus propias imágenes (sustituye los `.jpg` en `img/`). Puedes emplear `img/placeholder.svg` como respaldo si falta alguna imagen.

### Música

La lista base de pistas vive en [`config/music.js`](config/music.js). Sustituye `music/track1.mp3`, `music/track2.mp3` y las portadas `img/cover1.jpg`, `img/cover2.jpg` por tus versiones. El reproductor admite arrastrar y soltar un MP3 personalizado o seleccionarlo con el botón **Subir canción**.

### Sonidos de interfaz

Los sonidos están en `sfx/`. Reemplázalos por tus propios MP3 para personalizar el timbre de acierto, error y desbloqueo.

## Uso local

1. Clona el repositorio.
2. Abre `index.html` directamente en tu navegador favorito.
3. Interactúa con el sitio y acepta la reproducción tras la primera interacción para cumplir las políticas de autoplay.

## Despliegue en GitHub Pages

1. Crea un repositorio en GitHub y sube todos los archivos.
2. Asegúrate de que la rama principal se llame `main`.
3. GitHub Actions ejecutará automáticamente el workflow definido en [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), que publicará el sitio en GitHub Pages.
4. Revisa la pestaña **Actions** para confirmar el despliegue y accede a la URL que aparece en el job **Deploy to GitHub Pages**.

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta [LICENSE](LICENSE) para más detalles.
