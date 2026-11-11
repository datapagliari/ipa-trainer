# IPA Lab

## Abrir

Ejecutar start.cmd y abrir http://localhost:8765. Requiere Python en PATH. Mantener la terminal abierta; Ctrl+C detiene el servidor. No abrir index.html con doble clic.

## Práctica

- 20 objetivos de inglés, francés y alemán; 6 abiertos al comenzar.
- Tres aciertos sin fallar ese objetivo lo marcan como aprendido y abren uno nuevo.
- Los desbloqueos se conservan aunque se falle o se vuelva a aprobar un sonido.
- El progreso anterior se conserva, incluidos los objetivos que ya se practicaron.
- Racha de sesión independiente; el progreso por sonido se guarda en el navegador.
- Palabra resaltada → símbolo, palabra grabada → símbolo y símbolo → palabra grabada.
- Botón para escuchar palabras durante el ejercicio; botón de escucha independiente bajo cada opción con audio disponible.
- Reiniciar progreso borra el recorrido previo, con confirmación.

## Audio

Cuatro palabras locales: thin, tu, Ich y Pferd. Dos grabaciones fonéticas: /ʃ/ y /θ/. Los botones sin archivo quedan deshabilitados. Las grabaciones fonéticas pueden incluir vocales de apoyo; no son recortes de las palabras. Revisión auditiva pendiente.

Fuentes, autores, licencias y cambios en dataset/audio_manifest.json y dataset/symbol_audio.json, visibles en los créditos. Los archivos se comprobaron como Ogg. Commons limitó otras descargas (429); el descargador de símbolos se detiene ante ese límite.

Reponer palabras: python scripts/download_audio.py. Ampliar símbolos: python scripts/download_symbols.py. Requieren internet. Los medios siguen excluidos de Git: incluirlos al compartir una copia o ejecutar los descargadores en destino.

## Datos

- dataset/config.json: número inicial y orden de desbloqueo.
- dataset/sounds.json: objetivos y ejemplos.
- web/core.mjs: lógica y correspondencias escritas. Los resaltados no son una alineación temporal.
- docs/PLAN.md: propuesta original, no lista de funciones implementadas.

El progreso visual y auditivo es compartido; aprendido no certifica reconocimiento auditivo. El repertorio reducido de grabaciones facilita memorizar palabras.

## Comprobación

    node scripts/test_game.mjs
    node --check web/app.js

Pruebas de rachas, ponderación, desbloqueos, migración del progreso, segmentos, distractores y archivos. Vista verificada en el navegador integrado. Se probaron los controles de escucha sin registrar una respuesta; revisión fonética a oído pendiente.
