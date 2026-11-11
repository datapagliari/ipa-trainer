# IPA Lab

A small browser game for learning the International Phonetic Alphabet through English, French, and German examples.

## Run locally

Run `start.cmd`, then open [localhost:8765](http://localhost:8765). Python must be on your PATH. Keep the terminal open; press Ctrl+C to stop the server.

Alternatively, run this command from the project directory:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Do not open `index.html` directly: the app loads its data over HTTP. No frontend dependencies are required.

## Practice

- 20 learning targets across three languages, with 6 available at the start.
- Three correct answers in a row for a target mark it as learned and unlock another target.
- Unlocks are permanent. Making a mistake or relearning a target does not grant another unlock.
- Previously practiced targets remain available when older progress is loaded.
- Separate session streak and per-target progress, saved in your browser.
- Highlighted word → symbol, recorded word → symbol, and symbol → recorded word modes.
- Word playback during exercises and separate preview buttons for answer options with available recordings.
- Progress reset with confirmation.

## Audio

The local prototype has four recorded words (*thin*, *tu*, *Ich*, and *Pferd*) and two phonetic recordings (/ʃ/ and /θ/). Buttons without a recording are disabled. Phonetic recordings may include supporting vowels; they are not clips extracted from the example words. Listening review is still pending.

Audio files are currently excluded from Git by the project's existing policy. The six local recordings total approximately 200 KB; their exclusion is not a file-size requirement. This repository includes their source metadata and download scripts. A fresh clone needs the recordings downloaded before audio playback is available.

```powershell
python scripts/download_audio.py
python scripts/download_symbols.py
```

Downloads require internet access. Wikimedia Commons has rate-limited some requests (HTTP 429); the symbol downloader stops when this happens. Successfully downloaded files are retained for later runs.

Sources, authors, licenses, and modifications are recorded in [audio_manifest.json](dataset/audio_manifest.json) and [symbol_audio.json](dataset/symbol_audio.json), and displayed in the game's credits. Audio files have been checked for an Ogg header. Attribution metadata and listening quality still need review before a release.

## Project structure

- `dataset/config.json`: initial target count and unlock order.
- `dataset/sounds.json`: learning targets, example words, and explanations.
- `web/core.mjs`: game logic and written word segments. Highlights are spelling correspondences, not audio timestamps.
- `docs/PLAN.md`: the original design proposal; see this README for current behavior.

Visual and listening practice share progress. A learned target does not certify listening recognition, and the small audio pool makes it possible to memorize words.

## Checks

```powershell
node scripts/test_game.mjs
node --check web/app.js
python scripts/validate_dataset.py
```

Tests cover streaks, weighting, unlocks, progress migration, written segments, distractors, and local audio files. The game tests currently require the downloaded audio fixtures. The dataset validator permits missing audio and reports it as a warning; a successful result only validates the structure.

The layout and playback controls have been checked in the integrated browser. Phonetic listening review is still pending.
