# spec-ads

Anuncios verticales tipo "spec ad" (1080×1920, 60 fps, 7–10 s) con Remotion 4, React y TypeScript.
Todo se anima por frame (`spring()` / `interpolate()`), así que el render es determinista: nada parpadea ni salta.

```bash
npm install
npm run dev          # Remotion Studio: edita las props de cada plantilla en vivo
```

## Plantillas

| Composition     | Para qué sirve                                                  | Brief de ejemplo        |
|-----------------|-----------------------------------------------------------------|-------------------------|
| `HeroLogo`      | Logo central con glow, 4–7 tarjetas de fotos en 3D y slogan     | `briefs/lumen.json`     |
| `DataExplainer` | Comparativa con barras 3D, contadores y piso con retícula       | `briefs/nordwear.json`  |
| `MapPin`        | Ciudad isométrica, pin con rebote, onda expansiva y rutas       | `briefs/parcela.json`   |
| `AppShowcase`   | Mockups de teléfono flotando alrededor del logo (producto/SaaS) | `briefs/orbit.json`     |
| `AppFlow`       | El uso principal de una app contado como roadmap, paso a paso   | `briefs/duolingo.json`, `briefs/airbnb.json` |
| `Tunnel`        | Un solo universo 3D de anuncios; la cámara vuela sin cortes      | `briefs/cazauto-tunel.json` |

Ritmo (para 8 s; se escala con `durationSec`):
- **0–0,6 s**: flash y entrada del logo.
- **0,6–3 s**: entran las tarjetas, con motion blur.
- **3–6 s**: drift de cámara y micro-zoom 1.00→1.06.
- **6 s**: entra el slogan y el resto baja al 70 %.
- **Último segundo**: hold. La órbita de cámara es periódica, así que empalma en loop.

## AppFlow: el roadmap de una app

Es la plantilla más compleja. En el centro hay un teléfono 3D cuya pantalla recorre los pasos del flujo principal de la app, con taps, tipeo, conteos y transiciones. En el piso se dibuja un camino serpenteante con un nodo por paso, y la cámara avanza por él. Arriba aparece el título de cada paso ("01 / 05"), y del borde del teléfono salen chips flotantes que destacan beneficios.

- **Duración:** 8–24 s, con 2–6 pasos. El hook dura 1 s y el slogan entra 2,2 s antes del final; el resto del tiempo se reparte en partes iguales entre los pasos. Con 5 pasos, 16 s funcionan bien.
- **`ui`:** el tema visual de la pantalla. Lleva los colores (`background`, `surface`, `text`, `muted`, `border`, `primary`, `primaryDark`), `radius`, `tabs` (los íconos de la barra inferior) y `playful`. Con `playful: true` los botones tienen borde "3D" y el texto va en mayúsculas, al estilo Duolingo.
- **`steps[]`:** cada paso tiene `title`, `caption`, `icon` (el nodo del roadmap), `callouts` (0–2 chips `{icon, text}`) y `screen`, que es una lista de bloques.

Bloques de pantalla disponibles. Cada uno trae su propia animación:

| Bloque | Qué anima |
|---|---|
| `header` | Título y subtítulo |
| `search` | Foco, tipeo letra por letra del `query` y cursor |
| `chips` | Fila de filtros (`active` marca uno) |
| `options` | Lista de opciones; tap en `pick`, que queda seleccionada |
| `lesson` | Palabras que vuelan del banco a la respuesta (en el orden de `answer`), tap en el botón de comprobar |
| `banner` | Panel inferior que sube en `at` (fracción del paso), p. ej. "Nicely done!" |
| `streak` | Fuego, número que pasa de `from` a `to` con un flip y días de la semana |
| `progress` | Barra que se llena de `from` a `to` (%) |
| `path` | Camino de lecciones en zigzag; el nodo `current` se completa y se desbloquea el siguiente |
| `celebrate` | Ícono con pop, confeti y tarjetas de stats |
| `listings` | Tarjetas con foto, rating y precio; corazón con tap y scroll |
| `calendar` | Tap en `start`, tap en `end` y el rango se rellena día a día |
| `button` | Botón principal con tap en `at` |
| `card` | Fila de resumen con ícono |
| `confirm` | Círculo con check que se dibuja y texto |

Para crear el flujo de otra app, copia `briefs/airbnb.json`, cambia el `ui` por los colores de la marca y arma los pasos combinando bloques. En Studio, cada brief de AppFlow aparece como su propia composition (`AppFlow-duolingo`, `AppFlow-airbnb`).

> Los logos reales de Duolingo y Airbnb no vienen en el repo. Si no hay `logo` ni `wordmark`, se dibuja el nombre de la marca en texto. Para el spec ad final, pon sus SVG oficiales en `public/logos/` y apúntalos desde el brief.

## Tunnel: un universo de tarjetas sin cortes

Inspirado en "How to Anything" de Riccardo Bosso. Cientos de anuncios forman un túnel y la cámara vuela por él de un momento a otro. Dura entre 14 y 20 s (diseñado a 16 s) y tiene 6 escenas:

1. **Hook:** entrada rápida con rayas de luz; la mira cae de golpe y vuela a la barra de búsqueda.
2. **Búsqueda:** `search.query` se escribe con autocompletado (`suggestions`, `pick`) y al dar enter caen los `chips`.
3. **Cacería:** HUD "en vivo", contador de anuncios y portales que se palomean. Los anuncios destellan en verde al escanearse y se apagan; la mira se fija en el `target`.
4. **Alerta:** teléfono con la notificación de `alert` (y `alert.secondary`, opcional).
5. **Dato:** `stat.fromValue` se tacha y entra `stat.toText`, con su fuente.
6. **Cierre:** mira, wordmark, `url` y slogan.

- **`cardCount`:** 40–1,500. Con unas 150 se revisa rápido (Mac); para el render final, 800–1,100 (PC). Las flotantes de la cacería tienen tope de densidad para no tapar la mira, y el resto va a las paredes.
- **Desenfoque por capas:** cada tarjeta cae en una de tres capas según su distancia (nítida, media y lejana, con fundido entre ellas). Cada capa lleva un solo `filter: blur`, y las lejanas usan una versión "lite" sin texto.
- **`images`:** fotos de autos reutilizadas (30–40 bastan). Si faltan, se dibujan siluetas procedurales.
- **`motionBlur`:** solo en el hook y en el arranque de la cacería.
- Los tiempos de cada escena están en `src/components/tunnel/timeline.ts` (`MARKS` y la curva de velocidad `SPEED`).

## Crear un video nuevo en 5 pasos

1. **Copia un brief**: `cp briefs/lumen.json briefs/mimarca.json` y cambia `brand`, `brandColor`, `accentColor`, `headline` y `concept`.
2. **Logos**: pon `logos/mimarca.svg` (símbolo, idealmente blanco) y `logos/mimarca-wordmark.svg` en `public/`, y apúntalos en `logo` y `wordmark`.
3. **Imágenes**: ejecuta `npm run prompts -- briefs/mimarca.json`, genera las fotos con los prompts de `briefs/mimarca.prompts.md` y guárdalas en `public/img/mimarca/1.jpg`, `2.jpg`… Después agrégalas a `"images"`. Si todavía no tienes fotos, se usan placeholders con gradiente.
4. **Previsualiza**: `npm run dev`, abre la plantilla y pega los valores de tu brief en el panel de props. Para revisar frames clave sin abrir Studio: `npm run stills -- briefs/mimarca.json` (genera los stills en `out/stills/`).
5. **Renderiza**: `npm run render -- briefs/mimarca.json` → `out/mimarca.mp4`.

## Campos del brief

| Campo | Descripción |
|---|---|
| `template` | `HeroLogo` · `DataExplainer` · `MapPin` · `AppShowcase` · `AppFlow` · `Tunnel` |
| `brand`, `brandColor`, `accentColor` | El color de marca se usa en el logo; el de acento, en glow, fondo, rutas y barras |
| `logo`, `wordmark` | Rutas relativas a `public/`. Si faltan, se dibuja el nombre en texto |
| `headline` | Slogan de 2 líneas como máximo. Usa `\n` para forzar el salto |
| `footer` | `"Spec ad · Tu nombre"` |
| `palette` | `noir` · `warm` · `cold` (tono base del fondo) |
| `layout` | `orbit` · `columns` · `scatter` · `arc` (HeroLogo y AppShowcase) |
| `cardCount` | Número de tarjetas, de 4 a 7 (HeroLogo) |
| `grid` | Piso con retícula en perspectiva |
| `music` | Ruta en `public/`. Incluidas: `audio/music/drive-118.wav` (oscura) y `audio/music/bounce-128.wav` (alegre) |
| `bpm` | BPM de la música. Genera los beats automáticamente: el logo pulsa a tempo y el slogan cae en un beat |
| `beats` | `[0.5, 1.0, …]` en segundos. Si lo pones, manda sobre `bpm` y sobre la amplitud |
| `sfx` | Efectos de sonido (`true` por defecto): impacto, riser, hit del slogan, taps, pops… |
| `flyers` | Mascotas u objetos voladores (ver abajo) |
| `cardStyle` | Estilo de tarjeta en HeroLogo: `glass` · `polaroid` · `sticker` · `frame` · `ticket` · `mix` |
| `captions` | Texto de cada tarjeta: pie de polaroid, badge del sticker, dato del visor o del ticket |
| `durationSec` | De 5 a 15 s. Se aplica con `calculateMetadata` |
| `concept` | Descripción del mundo de la marca, usada para los prompts de imagen |

Campos propios de cada plantilla:
- **DataExplainer**: `title`, `prefix`, `suffix`, `decimals` e `items[]` (`label`, `value`, `year`, `color`, `logo`).
- **MapPin**: `city`, `pinLabel`, `routes` (1–5) y `seed`. Cambia `seed` para obtener otra ciudad.
- **AppShowcase**: `screens[]` con capturas reales. Si está vacío, se muestra una UI de ejemplo con los colores de la marca.

## Estilos de tarjeta

Para que no todos los videos se vean iguales, elige el "objeto" que mejor cuente la marca:

| `cardStyle` | Se ve como | Ideal para |
|---|---|---|
| `glass` | Foto con borde fino translúcido | Lujo, minimal |
| `polaroid` | Papel blanco, cinta adhesiva y nota manuscrita | Viajes, recuerdos, comida |
| `sticker` | Borde blanco grueso, sombra sólida de color y badge | Marcas juguetonas, apps de consumo |
| `frame` | Visor tech con chip "● LIVE", esquinas y datos en mono | Movilidad, fintech, SaaS |
| `ticket` | Boarding pass con perforación y talón | Eventos, aerolíneas, cine |
| `mix` | Alterna todos | Moodboards |

En AppFlow los chips flotantes también siguen la marca. Con `ui.playful: true` son stickers sólidos del color de la marca con borde 3D (Duolingo); con `false` son tarjetas blancas limpias (Airbnb).

## Mascotas y voladores

`flyers` agrega personajes u objetos que vuelan en 3D. Pasan por delante y por detrás del teléfono o del logo, dejan una estela y tienen su propio sonido (aleteo o paso de avión).

```json
"flyers": [
  { "kind": "owl", "path": "swoop", "from": 0.05, "to": 1.5, "scale": 1.4 },
  { "kind": "owl", "path": "orbit", "from": 11.2, "to": 13.0 },
  { "kind": "owl", "path": "perch", "from": 13.2, "to": 16, "target": { "x": 300, "y": 170 } }
]
```

- **`kind`:** `owl` es un búho cartoon original con alas articuladas, parpadeo y patitas. También hay `plane` (avión con la cola en el color de marca) y `paperplane`. Con `src` usas tu propio SVG o PNG, por ejemplo la mascota oficial de la marca.
- **`path`:**
  - `swoop`: entra por abajo y sale en curva hacia arriba.
  - `orbit`: rodea el centro pasando por delante y por detrás.
  - `flyby`: cruza la pantalla.
  - `perch`: llega volando y se posa en `target`, donde respira y aletea de vez en cuando.
- **`from` / `to`:** el inicio y el fin del vuelo, en segundos.

> El búho incluido es un diseño propio inspirado en el estilo cartoon, no el personaje oficial. Para un spec ad de Duolingo con Duo, pon su asset en `public/mascots/duo.png` y usa `"src": "mascots/duo.png"`.

## Sonido

Toda la librería es sintetizada con ffmpeg (`sh scripts/make-sounds.sh`), así que no hay problemas de licencia:

- **Efectos** (`public/audio/sfx/`): impact, whoosh, whoosh-big, swipe, riser, hit, pop, tap, type, tick, success, coin, thud, ping, flap, rise.
- **Música** (`public/audio/music/`): `drive-118` (menor, oscura) y `bounce-128` (mayor, alegre), de 30 s cada una.

Cada plantilla sincroniza los efectos con su animación:
- **Todas:** impacto con el logo, riser antes del slogan y hit cuando entra.
- **HeroLogo y AppShowcase:** whoosh al entrar cada tarjeta y pop al asentarse.
- **DataExplainer:** tono que sube, ticks del contador y monedas al llegar al valor.
- **MapPin:** caída del pin, golpe al aterrizar, ping del sonar y swipe de cada ruta.
- **AppFlow:** cada bloque suena con su interacción: taps, teclas al escribir, ding de "correcto", monedas en la racha, swipe entre pantallas y pop de los callouts.

La música va al 55 % para que los efectos se escuchen. Para usar tu propia pista, pon el archivo en `public/audio/` y define `music` y `bpm` en el brief. Para apagar los efectos, usa `"sfx": false`.

## Cambiar layouts y colores

- **Layouts de tarjetas**: están en `src/presets/layouts.ts`. Después de editarlos, corre `npm run check:layouts`, que valida que ninguna tarjeta se superponga con otra ni con el logo y que no se salga del cuadro. Cada slot tiene `x, y, z, rx, ry, rz, w, h`, medidos desde el centro del cuadro; un `z` negativo aleja la tarjeta. Las tarjetas lejanas se oscurecen y desenfocan automáticamente. Para crear un layout nuevo, agrega una clave al objeto y al enum `layoutEnum` en `src/schemas.ts`.
- **Paletas**: están en `src/presets/palettes.ts`.
- **Springs y stagger**: están en `src/presets/springs.ts`.
- **Tiempos de los beats**: están en `src/presets/beats.ts`.
- **Cámara**: el drift, la perspectiva y el micro-zoom se controlan en `src/components/Camera.tsx`.
- **Grano y viñeta**: se ajustan en `src/components/SceneShell.tsx`.

## Generar imágenes

```bash
npm run prompts                      # todos los briefs
npm run prompts -- briefs/lumen.json # uno solo
```

Crea `briefs/{marca}.prompts.md` con 6–8 prompts que comparten luz, grading, lente de 35 mm y estilo editorial, sin texto ni logos. Pégalos en Higgsfield, Nano Banana o GPT Image. Para que todas las fotos se vean de la misma sesión, conviene usar la misma seed o la misma imagen de referencia de estilo.

## Renderizar

```bash
npm run render -- briefs/lumen.json   # → out/lumen.mp4 (H.264, CRF 17)
npm run render:all                    # todos los briefs/*.json
npm run stills -- briefs/lumen.json 0 20 90 200   # stills de revisión
```

## Estructura

```
src/
  Root.tsx              registra las compositions (schema zod + calculateMetadata)
  schemas.ts            props validadas de cada plantilla
  templates/            HeroLogo, DataExplainer, MapPin, AppShowcase, AppFlow
  components/           Background, Vignette, FilmGrain, LightFlash, Camera, GlowLogo,
                        FloatingCard, CardField, KineticHeadline, Chrome (wordmark/footer),
                        Counter, Bar3D, Pin, PerspectiveGrid, PhoneScreen, Placeholder, SceneShell,
                        Flyer (búho / aviones voladores)
  components/flow/      Phone3D, Roadmap, StepHeader, Callout, blocks (UI animada de AppFlow)
  presets/              springs, beats, palettes, layouts
  lib/                  color, assets (fallback a placeholder), fonts (Inter Tight), audio (pulso),
                        sfx (librería de efectos y eventos sincronizados)
scripts/                render, render-all, stills, image-prompts,
                        check-layouts (valida superposiciones), make-sounds.sh (genera audio)
briefs/                 un JSON por video + sus prompts
public/                 logos/, img/, mascots/ (opcional), audio/sfx/, audio/music/
```

## Notas

- La tipografía es Inter Tight, de Google Fonts, y se carga durante el render (necesita conexión).
- El motion blur (`CameraMotionBlur`, 6 muestras) solo se activa en la ventana de entradas, para no multiplicar el tiempo de render del video completo.
- Safe zones: el wordmark está a 118 px del borde superior y el slogan termina a 330 px del inferior. El footer es lo único que queda dentro de la zona baja.
