1 ) juego de aprendizaje AFI

# Plan paso a paso para armar el dataset + lógica de gamificación

## Objetivo inicial

Armar un dataset pequeño, usable y portable:

```text
20 sonidos iniciales
+ audios confiables
+ ejemplos por idioma
+ distractores
+ sistema de progreso
```

No arrancaría programando la app completa. Primero haría una **fase de curaduría de datos**.

---

# 1. Definir el scope inicial

Como querés inglés, francés y alemán, yo arrancaría con **20 sonidos mezclados**, priorizando sonidos útiles y conflictivos para hispanohablantes.

## Set inicial sugerido

| ID      | Símbolo | Idioma principal          | Ejemplo                 |
| ------- | ------: | ------------------------- | ----------------------- |
| `en_ʃ`  |   `/ʃ/` | inglés / francés / alemán | *ship*, *chat*, *schön* |
| `en_tʃ` |  `/tʃ/` | inglés                    | *chip*                  |
| `en_dʒ` |  `/dʒ/` | inglés                    | *judge*                 |
| `en_θ`  |   `/θ/` | inglés                    | *thin*                  |
| `en_ð`  |   `/ð/` | inglés                    | *this*                  |
| `en_ɪ`  |   `/ɪ/` | inglés / alemán           | *ship*, *ich*           |
| `en_iː` |  `/iː/` | inglés / alemán           | *sheep*, *Liebe*        |
| `en_æ`  |   `/æ/` | inglés                    | *cat*                   |
| `en_ʌ`  |   `/ʌ/` | inglés                    | *cut*                   |
| `en_ə`  |   `/ə/` | inglés / francés / alemán | *about*, *le*, *bitte*  |
| `fr_y`  |   `/y/` | francés / alemán          | *tu*, *über*            |
| `fr_ø`  |   `/ø/` | francés / alemán          | *deux*, *schön*         |
| `fr_œ`  |   `/œ/` | francés / alemán          | *sœur*, *können*        |
| `fr_ɑ̃` |  `/ɑ̃/` | francés                   | *sans*                  |
| `fr_ɛ̃` |  `/ɛ̃/` | francés                   | *vin*                   |
| `fr_ɔ̃` |  `/ɔ̃/` | francés                   | *bon*                   |
| `de_ç`  |   `/ç/` | alemán                    | *ich*                   |
| `de_x`  |   `/x/` | alemán                    | *Bach*                  |
| `de_ts` |  `/ts/` | alemán                    | *Zeit*                  |
| `de_pf` |  `/pf/` | alemán                    | *Pferd*                 |

Nota: algunos símbolos no pertenecen exclusivamente a un idioma. El `id` puede marcar el módulo principal, no una verdad fonética absoluta.

---

# 2. Crear la estructura de carpetas

Usaría una estructura así:

```text
ipa_trainer_dataset/
  dataset/
    sounds.json
    words.json
    sources.md
  audio/
    en/
    fr/
    de/
    phonemes/
  scripts/
    validate_dataset.py
```

Para empezar, podés tener solo esto:

```text
ipa_trainer_dataset/
  sounds.json
  audio/
    en/
    fr/
    de/
```

Pero recomiendo separar `dataset/` y `audio/` desde el principio.

---

# 3. Buscar audios

## Prioridad de búsqueda

Para cada sonido, buscá primero una **palabra ejemplo**, no necesariamente el sonido aislado.

Ejemplo:

```text
/y/  → francés: tu
/ç/  → alemán: ich
/θ/  → inglés: thin
```

## Fuentes recomendadas

### Opción 1: Wiktionary

Buena para:

```text
palabra → IPA → audio
```

Ejemplo de búsqueda manual:

```text
Wiktionary tu French pronunciation audio
Wiktionary ich German pronunciation audio
Wiktionary thin English pronunciation audio
```

### Opción 2: Wikimedia Commons

Buena para sonidos IPA aislados o grabaciones fonéticas.

Búsquedas útiles:

```text
Wikimedia Commons voiceless dental fricative audio
Wikimedia Commons close front rounded vowel audio
Wikimedia Commons voiceless palatal fricative audio
```

### Opción 3: Forvo

Útil como referencia, pero ojo con licencias si algún día publicás la app.

Para uso personal está bien como comparación auditiva, pero no lo usaría como fuente principal empaquetada.

---

# 4. Criterio para aceptar un audio

Cada archivo que bajes debería cumplir esto:

```text
[ ] Es de hablante nativo o fuente fonética confiable
[ ] La palabra contiene claramente el sonido objetivo
[ ] El sonido objetivo no queda tapado o demasiado rápido
[ ] El audio no tiene ruido fuerte
[ ] La licencia permite uso personal / redistribución futura si te importa
[ ] Guardaste la URL de origen
```

Esto último es importante:

```text
No bajes audios sueltos sin anotar de dónde salieron.
```

Después no sabés qué es qué.

---

# 5. Convención de nombres

Evitá nombrar archivos directamente con símbolos raros al principio, porque puede traer quilombos en Windows, Android o Git.

Mejor:

```text
audio/en/ship__sh.ogg
audio/en/thin__theta.ogg
audio/fr/tu__y.ogg
audio/fr/vin__nasal_eh.ogg
audio/de/ich__ç.ogg
audio/de/bach__x.ogg
```

O más seguro todavía, sin caracteres IPA en filename:

```text
audio/en/ship__esh.ogg
audio/en/thin__theta.ogg
audio/fr/tu__close_front_rounded.ogg
audio/fr/vin__nasal_e.ogg
audio/de/ich__palatal_fricative.ogg
audio/de/bach__velar_fricative.ogg
```

En el JSON sí podés guardar el símbolo real:

```json
{
  "symbol": "ç",
  "audio": "audio/de/ich__palatal_fricative.ogg"
}
```

---

# 6. Primer modelo de datos

Yo haría un solo `sounds.json` así:

```json
[
  {
    "id": "fr_y_tu",
    "language": "fr",
    "symbol": "y",
    "kind": "vowel",
    "example_word": "tu",
    "word_ipa": "ty",
    "audio": "audio/fr/tu__close_front_rounded.ogg",
    "confusers": ["i", "u", "ø"],
    "note": "Vocal cerrada anterior redondeada. Pensala como /i/ con labios de /u/.",
    "source_url": "PEGAR_URL_ACA",
    "license": "PEGAR_LICENCIA_ACA"
  }
]
```

Para inglés:

```json
{
  "id": "en_theta_thin",
  "language": "en",
  "symbol": "θ",
  "kind": "consonant",
  "example_word": "thin",
  "word_ipa": "θɪn",
  "audio": "audio/en/thin__theta.ogg",
  "confusers": ["s", "f", "t"],
  "note": "TH sorda. No vibra la garganta.",
  "source_url": "PEGAR_URL_ACA",
  "license": "PEGAR_LICENCIA_ACA"
}
```

Para alemán:

```json
{
  "id": "de_ich_ch",
  "language": "de",
  "symbol": "ç",
  "kind": "consonant",
  "example_word": "ich",
  "word_ipa": "ɪç",
  "audio": "audio/de/ich__palatal_fricative.ogg",
  "confusers": ["ʃ", "x", "h"],
  "note": "CH suave alemán, como en ich. No es /x/, que aparece en Bach.",
  "source_url": "PEGAR_URL_ACA",
  "license": "PEGAR_LICENCIA_ACA"
}
```

---

# 7. Archivo de progreso

Separaría el dataset del progreso personal.

```text
dataset/sounds.json       → datos fijos
user_progress.json        → progreso del usuario
```

Ejemplo:

```json
{
  "fr_y_tu": {
    "correct_count": 2,
    "wrong_count": 1,
    "approved": false,
    "weight_multiplier": 1.0
  },
  "en_theta_thin": {
    "correct_count": 3,
    "wrong_count": 0,
    "approved": true,
    "weight_multiplier": 0.5
  }
}
```

---

# 8. Lógica de gamificación

Tu regla sería:

## Estado inicial

Todos los sonidos arrancan así:

```json
{
  "correct_count": 0,
  "approved": false,
  "weight_multiplier": 1.0
}
```

---

## Cuando el usuario acierta

```python
correct_count += 1
```

Si llega a 3 aciertos:

```python
approved = True
weight_multiplier = 0.5
```

Y además:

```text
se desbloquea un sonido nuevo
```

---

## Cuando el usuario falla

Si el sonido estaba aprobado:

```python
approved = False
correct_count = 0
weight_multiplier = 1.0
```

O sea:

```text
desaprobado → vuelve a aparecer con frecuencia normal
```

Si todavía no estaba aprobado:

```python
correct_count = 0
```

Esto evita que alguien haga:

```text
acierto, acierto, error, acierto
```

y quede como aprobado igual. Tiene que tener una racha de 3.

---

# 9. Sistema de sonidos activos

Tendrías tres conceptos:

```text
locked     → todavía no aparece
active     → aparece con probabilidad normal
approved   → aparece con mitad de probabilidad
```

Ejemplo de progreso:

```json
{
  "active_sound_ids": [
    "en_esh_ship",
    "en_theta_thin",
    "fr_y_tu",
    "de_ich_ch"
  ],
  "locked_sound_ids": [
    "fr_nasal_a_sans",
    "de_bach_x"
  ]
}
```

Pero yo no lo duplicaría demasiado. Mejor que cada entrada tenga un estado:

```json
{
  "en_esh_ship": {
    "status": "active",
    "correct_streak": 1,
    "weight_multiplier": 1.0
  },
  "en_theta_thin": {
    "status": "approved",
    "correct_streak": 3,
    "weight_multiplier": 0.5
  },
  "fr_nasal_a_sans": {
    "status": "locked",
    "correct_streak": 0,
    "weight_multiplier": 0.0
  }
}
```

---

# 10. Regla para desbloquear sonidos nuevos

Tu idea dice:

> si el usuario acierta tres veces un sonido, se agrega un sonido nuevo a la lista.

Entonces:

```text
cada vez que un sonido pasa de active → approved
desbloqueás 1 sonido locked
```

Importante: solo debería pasar **cuando cruza el umbral**, no cada vez que vuelve a acertar un sonido ya aprobado.

Pseudológica:

```python
def handle_correct(sound_id):
    progress = user_progress[sound_id]

    if progress["status"] == "approved":
        return

    progress["correct_streak"] += 1

    if progress["correct_streak"] >= 3:
        progress["status"] = "approved"
        progress["weight_multiplier"] = 0.5
        unlock_next_sound()
```

Y error:

```python
def handle_wrong(sound_id):
    progress = user_progress[sound_id]

    progress["correct_streak"] = 0

    if progress["status"] == "approved":
        progress["status"] = "active"
        progress["weight_multiplier"] = 1.0
```

---

# 11. Probabilidad de aparición

La selección de pregunta debería usar pesos.

Ejemplo:

| Sonido | Estado   | Peso |
| ------ | -------- | ---: |
| `/θ/`  | active   |  1.0 |
| `/ʃ/`  | approved |  0.5 |
| `/y/`  | active   |  1.0 |
| `/ç/`  | locked   |  0.0 |

Entonces se sortea entre los sonidos activos/aprobados.

Pseudocódigo:

```python
import random

def pick_sound(sounds, progress):
    available = []
    weights = []

    for sound in sounds:
        sound_id = sound["id"]
        state = progress[sound_id]

        if state["status"] == "locked":
            continue

        available.append(sound)
        weights.append(state["weight_multiplier"])

    return random.choices(available, weights=weights, k=1)[0]
```

---

# 12. Color para aprobados

Sí: los aprobados deberían tener otro color.

En la UI:

| Estado          | Color sugerido  | Significado     |
| --------------- | --------------- | --------------- |
| locked          | gris            | bloqueado       |
| active          | normal / blanco | en práctica     |
| approved        | verde o azul    | aprobado        |
| failed recently | rojo breve      | acaba de fallar |
| newly unlocked  | amarillo breve  | nuevo sonido    |

Ejemplo visual:

```text
/θ/  active
/ʃ/  approved
/y/  active
/ç/  locked
```

En una UI simple:

```text
[ /θ/ ] [ /ʃ/ ✓ ] [ /y/ ] [ /ç/ 🔒 ]
```

---

# 13. Orden de desbloqueo

No lo haría completamente random. Usaría un orden curado.

Ejemplo:

```json
{
  "unlock_order": [
    "en_esh_ship",
    "en_tesh_chip",
    "en_theta_thin",
    "en_eth_this",
    "en_ih_ship",
    "en_ee_sheep",
    "fr_y_tu",
    "fr_u_tout",
    "fr_oe_soeur",
    "fr_o_deux",
    "de_ich_ch",
    "de_bach_ch",
    "de_ts_zeit",
    "de_pf_pferd"
  ]
}
```

Pero si querés empezar con 20 activos, entonces el orden de unlock aplica a partir del sonido 21.

Estructura:

```json
{
  "initial_active_count": 20,
  "unlock_order": [
    "sound_001",
    "sound_002",
    "sound_003",
    "... más sonidos ..."
  ]
}
```

Al iniciar:

```text
primeros 20 → active
resto → locked
```

---

# 14. Plan de trabajo concreto

## Fase 1 — Dataset mínimo

1. Crear carpeta del proyecto.
2. Crear `sounds.json`.
3. Definir los primeros 20 sonidos.
4. Para cada sonido, elegir:

   * idioma
   * palabra ejemplo
   * IPA
   * distractores
   * nota explicativa
5. Buscar audio.
6. Guardar URL y licencia.
7. Normalizar nombres de archivo.
8. Probar que todos los audios se reproduzcan.

Resultado de fase 1:

```text
20 sonidos jugables
```

---

## Fase 2 — Dataset extendido

1. Agregar 10–20 sonidos bloqueados.
2. Definir `unlock_order`.
3. Validar que cada sonido tenga:

   * audio
   * símbolo
   * palabra
   * distractores
   * idioma
4. Crear script validador.

Resultado:

```text
20 iniciales + backlog desbloqueable
```

---

## Fase 3 — Prototipo consola

Antes de UI:

```text
audio → opciones → respuesta → progreso
```

Objetivo:

```text
probar la lógica de pesos, aprobados y desbloqueos
```

No hace falta que sea lindo.

---

## Fase 4 — Prototipo Pygame

Pantalla mínima:

```text
[Play audio]

¿Qué símbolo escuchás?

A /θ/
B /s/
C /f/
D /t/

Score: 120
Sonidos activos: 20
Aprobados: 4
```

Abajo:

```text
/θ/  /ʃ/ ✓  /y/  /ç/ 🔒
```

---

## Fase 5 — Exportabilidad futura

Cuando esto funcione:

1. Congelar formato del JSON.
2. Mantener audios en `.ogg`.
3. Evitar paths raros.
4. Separar lógica de juego del frontend.
5. Después decidir:

   * Godot
   * Kotlin Android
   * Web

---

# 15. Checklist para cada entrada del dataset

Podés usar esta plantilla:

```text
[ ] id
[ ] language
[ ] symbol
[ ] kind: vowel/consonant/diphthong/affricate
[ ] example_word
[ ] word_ipa
[ ] audio file
[ ] 3 confusers
[ ] note
[ ] source_url
[ ] license
[ ] validated by listening
```

---

# 16. Ejemplo completo de `sounds.json`

```json
[
  {
    "id": "en_theta_thin",
    "language": "en",
    "symbol": "θ",
    "kind": "consonant",
    "example_word": "thin",
    "word_ipa": "θɪn",
    "audio": "audio/en/thin__theta.ogg",
    "confusers": ["s", "f", "t"],
    "note": "TH sorda inglesa. No vibra la garganta.",
    "source_url": "",
    "license": ""
  },
  {
    "id": "fr_y_tu",
    "language": "fr",
    "symbol": "y",
    "kind": "vowel",
    "example_word": "tu",
    "word_ipa": "ty",
    "audio": "audio/fr/tu__close_front_rounded.ogg",
    "confusers": ["i", "u", "ø"],
    "note": "Vocal cerrada anterior redondeada. Similar a /i/ con labios de /u/.",
    "source_url": "",
    "license": ""
  },
  {
    "id": "de_ich_ch",
    "language": "de",
    "symbol": "ç",
    "kind": "consonant",
    "example_word": "ich",
    "word_ipa": "ɪç",
    "audio": "audio/de/ich__palatal_fricative.ogg",
    "confusers": ["ʃ", "x", "h"],
    "note": "CH suave alemán. No confundir con /x/ de Bach.",
    "source_url": "",
    "license": ""
  }
]
```

---

# 17. Detalle importante: “sonido” vs “entrada”

Para el juego, yo no trataría cada símbolo como una entidad abstracta pura.

Mejor tratá cada elemento como una **entrada entrenable**:

```text
symbol + language + example_word
```

Porque `/r/`, `/ʁ/`, `/x/`, `/ə/`, `/i/` pueden variar bastante según idioma, acento y contexto.

Entonces:

```text
fr_ʁ_rue
de_ʁ_rot
```

pueden ser dos entradas distintas aunque compartan símbolo.

Eso te da más control y evita que el juego se vuelva demasiado teórico.

---

# 18. Regla final de gamificación

La escribiría así:

```text
Cada entrada empieza activa o bloqueada.

Una entrada activa se aprueba cuando el usuario la responde bien 3 veces consecutivas.

Al aprobarse:
- cambia a color de aprobado
- su probabilidad baja a 50%
- se desbloquea una entrada nueva

Si el usuario falla una entrada aprobada:
- pierde el estado de aprobado
- vuelve al color normal
- vuelve a probabilidad 100%
- su racha vuelve a 0
```

Esto está bastante bien: mantiene los sonidos aprendidos en circulación, pero les baja el peso. No desaparecen del todo, que es importante.
