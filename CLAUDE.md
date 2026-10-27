# spec-ads — contexto para Claude

Generador de spec ads verticales (1080×1920, 60 fps) estilo @riki.bosso, hechos con Remotion 4 + TypeScript + Zod. El README.md (en español) documenta plantillas, campos del brief, estilos de tarjeta, mascotas y sonido: léelo antes de cambiar algo.

## Cómo se trabaja

- Cada video es un JSON en `briefs/` que elige `template`. Los scripts lo validan con el schema de `src/schemas.ts` (completa defaults) antes de renderizar.
- Plantillas en `src/templates/`: HeroLogo, DataExplainer, MapPin, AppShowcase, AppFlow (roadmap animado de una app; ver duolingo.json y airbnb.json), Tunnel (universo 3D de tarjetas, componentes en `src/components/tunnel/`).
- Todo es función del frame (`useCurrentFrame`, `spring`, `interpolate`). Nada de animaciones CSS ni `Math.random()` — usar `random(seed)` de Remotion.
- Efectos de sonido: eventos `SfxEvent` sincronizados al frame de cada animación (`src/lib/sfx.tsx`), renderizados fuera de `CameraMotionBlur` (dentro se silencian). El audio se genera con `sh scripts/make-sounds.sh` (ffmpeg); los .wav ya están en el repo.
- Imágenes: placeholders procedurales cuando falta el archivo; `npm run prompts` genera prompts para IA.
- Comentarios del código: breves y en español. Respuestas al usuario: en español (México).

## Comandos

```bash
npm run dev                                   # Remotion Studio
npm run typecheck
npm run stills -- briefs/x.json 0 200 470     # capturas a out/stills/ (revisarlas antes de renderizar)
npm run render -- briefs/x.json               # → out/x.mp4 (H.264, CRF 17)
npm run render:all
npm run check:layouts                         # valida que las tarjetas de HeroLogo no se encimen
```

`CONCURRENCY` (default 3) controla las pestañas de Chrome en paralelo. En la PC (32 GB RAM, RTX 3060, Windows) se puede subir a 8–12: `set CONCURRENCY=8 && npm run render -- briefs/x.json` (PowerShell: `$env:CONCURRENCY=8; npm run render -- briefs/x.json`). `remotion.config.ts` y los scripts usan `gl: "angle"` (GPU en Windows). Excepción: `Tunnel` con 900 tarjetas se quedó sin memoria con `CONCURRENCY=8` (con el disco C: casi lleno); con 3 renderiza en ~2.5 min.

## Flujo entre máquinas

Se desarrolla en una Mac (8 GB, pocas tarjetas, render lento) y se renderiza lo pesado en la PC. Ambas sincronizan por GitHub (`Madafanes0/specads`, rama `main`): hacer `git pull` antes de renderizar. `out/` y `node_modules/` no se suben.

## Cliente actual: Cazauto (cazauto.com.mx)

Plataforma mexicana que busca autos usados en 4 portales a la vez, revisa cada 3 h, 24/7, y avisa por email/dashboard cuando aparece el auto o baja de precio.

- Colores: verde de marca `#15803d` (único color de marca), neutros `#171717`, `#111111`, `#52525b` (gris "A mano"), `#71717a`. Paleta de fondo `ink`. Sin footer (`footer` vacío).
- Logo: `public/logos/cazauto.svg` y `cazauto-wordmark.svg` (provisionales, una mira).
- Datos clave: 7.5 h de búsqueda a mano vs 10 min con Cazauto (Cox Automotive 2024); 7 vs 56 revisiones/semana; 4.2 portales visitados (Motors 2024); proceso de 48 días; 90 % investiga online (Forrester); modelos top se venden en ~30 días (iSeeCars 2026); 50 M visitas a seminuevos en Mercado Libre en un trimestre (Expansión 2026). Citar la fuente en pantalla cuando se use un dato.
- Hechos: `briefs/cazauto.json` (horas, ya con colores de marca) y `briefs/cazauto-revisiones.json` (aún en naranja #FF6A1A, pendiente de pasar a verde).

## Video "túnel" de Cazauto (plantilla `Tunnel`, primera versión hecha)

Inspirado en "How to Anything" de Riccardo Bosso (riccardobosso.com/#youtube): todo vive en un solo universo 3D de cientos de tarjetas y la cámara vuela de un momento a otro sin cortes. Concepto propuesto (vertical, ~16 s, verde #15803d), sujeto a ajustes del usuario:

1. Hook 0–1.5 s: la cámara entra por un túnel de anuncios de autos (precio, km, año) con rayas de luz verde; la mira de Cazauto aparece de golpe.
2. Búsqueda 1.5–4 s: barra que escribe "Mazda 3 2020 hasta $250 mil" con autocompletado.
3. Cacería 4–8 s: vuelo entre anuncios de 4 portales; la mira escanea, los que no coinciden se apagan, uno se ilumina en verde; contador "revisando cada 3 h · 24/7".
4. Alerta 8–11 s: teléfono con notificación "¡Encontramos tu Mazda 3! Bajó $12,000".
5. Dato 11–13.5 s: 7.5 h → 10 min.
6. Cierre 13.5–16 s: "Tú decides. Cazauto caza." + logo + cazauto.com.mx.

Brief: `briefs/cazauto-tunel.json` (`cardCount` 150 para revisar; subir a 800–1,100 para el render final). Los nombres de portales del brief son provisionales: confirmar cuáles usa Cazauto. Plantilla con la cantidad de tarjetas como campo del brief (≈150 para revisar en la Mac, 800–1,100 para el render final en la PC). Para que escale, desenfoque por capas (pocas tarjetas nítidas al frente, el fondo en grupos ya desenfocados) en lugar de `filter: blur` por tarjeta, y 30–40 imágenes reutilizadas.
