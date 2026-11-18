# IPA Lab

A small browser game for learning the International Phonetic Alphabet through English, French, and German examples.

## Run locally

Double-click `start.bat` to start the game and open the default browser. For server-only use, run `start.cmd`, then open [localhost:8765](http://localhost:8765). Python must be on your PATH. Keep the terminal open; press Ctrl+C to stop the server.

Alternatively, run this command from the project directory:

```powershell
python scripts/launch.py --no-browser
```

Do not open `index.html` directly: the app loads its data over HTTP. No frontend dependencies are required.

## Practice

- 47 learning targets across three languages, with 24 available at the start and after a confirmed reset.
- Three correct answers in a row for a target mark it as learned (green ✓) and unlock another target.
- Available unlearned targets have equal selection weight (1). Learned targets have weight 1/3; a mistake removes the mark, resets that target’s streak, and restores weight 1. These are relative weights within the current practice pool.
- Set `approved_weight_multiplier` to `1` in `dataset/config.json` to disable the review-weight reduction without deleting progress.
- Unlocks are permanent. Making a mistake or relearning a target does not grant another unlock.
- Previously practiced targets remain available when older progress is loaded.
- Separate session streak and per-target progress, saved in your browser.
- Highlighted word → symbol, recorded word → symbol, and symbol → recorded word modes.
- Word playback during exercises and separate preview buttons for answer options with available recordings.
- Each question excludes the ten most recently presented target sounds in this tab, including across filters and reloads. A narrow filter can run out of eligible sounds; continue with all sounds to keep playing.
- Progress reset with confirmation.

## Audio

See the [audio inventory](docs/AUDIO_INVENTORY.md) for per-symbol and per-word availability and preview review status.

Word recordings combine Commons recordings extracted from a local Wiktionary archive and synthetic Magpie samples. The first 40 targets have local symbol previews; six previews in the new coverage batch remain queued, and every word in the current catalog has a recording. Consonants use demonstrations with supporting vowels where available; isolated vowel clips are replayed with a short pause. Listening and exact accent review remain pending for new material.

Audio is excluded from Git. Source metadata and preparation scripts are tracked. The local archive is at D:/wiktionary-audios.tar. To find exact-word candidates for the current catalog and import recordings with recognized source licenses, run python scripts/find_archive_words.py followed by python scripts/import_archive_words.py. The latter needs Commons access for attribution. Rebuild the availability report with python scripts/audio_inventory.py.

```powershell
python scripts/download_audio.py
python scripts/download_symbols.py
```

The symbol downloader attempts one pending mapped recording per run. On this Windows machine the scheduled task `IPA Trainer - Commons phonemes` runs every 15 minutes while the user is logged in. It logs results under `data/phoneme_downloads/`. Repeated network failures delay downloads by 15 minutes to 6 hours, or longer if Wikimedia requests it. Once all mapped candidates are present or flagged for source review, the task makes no network requests. Disable the task in Windows Task Scheduler to pause downloads. Word recordings are handled separately.

Sources, authors, licenses, and modifications are recorded in [audio_manifest.json](dataset/audio_manifest.json) and [symbol_audio.json](dataset/symbol_audio.json), and displayed in the game's credits. Audio files have been checked for an Ogg header. Attribution metadata and listening quality still need review before a release.

## Project structure

- `dataset/config.json`: initial target count and unlock order.
- `dataset/targets.json` defines stable target IDs, IPA notation, objective, chapter, prerequisites, and answer options.
- `dataset/examples.json` links each word to a target and an optional word recording. Each example has a transcription, written highlight, language, accent when known, definition, and note.
- Questions draw an eligible target first and then a word for it. For example, *ship* and *shoe* both teach /ʃ/ and share its progress.
- `dataset/legacy_targets.json` maps the 20 original entry IDs one-to-one. On the first answer or confirmed reset, the game saves target-based progress under `ipa-lab-progress-v2`. The original v1 save stays in browser storage as a backup. Subsequent loads prefer v2, including an empty reset save.
- `web/core.mjs`: game logic and save migration. Highlights are spelling correspondences, not audio timestamps.
- [docs/HANDOFF.md](docs/HANDOFF.md): current agent handoff, known limitations, and next implementation task.
- [docs/ROADMAP.md](docs/ROADMAP.md): current phased plan toward the full IPA chart.
- `docs/PLAN.md`: historical design proposal; the roadmap and this README take precedence.

Visual and listening practice share progress. A learned target does not certify listening recognition, and the small audio pool makes it possible to memorize words.

## Checks

```powershell
node scripts/test_game.mjs
node --check web/app.js
python scripts/validate_dataset.py
```

Tests cover streaks, weighting, unlocks, progress migration, written segments, distractors, and local audio files. The game tests currently require the downloaded audio fixtures. The dataset validator permits missing audio and reports it as a warning; a successful result only validates the structure.

The layout and playback controls have been checked in the integrated browser. Phonetic listening review is still pending.

## Same or different

Choose the ≠ button in the left rail. Listen to two words and compare the highlighted parts. The IPA answers appear after responding. This listening exercise updates the session streak; symbol mastery remains earned in Symbol quiz. It shares the ten-turn target exclusion history. With limited recordings, a filter can exhaust valid pairs and offer a return to Symbol quiz.

## Report audio during playtesting

Right-click a word playback button or a symbol preview to add a comment.
The report includes the exact recording path and source, word or symbol, and
exercise context. Reports are saved to data/audio_reports.json by the local server, with a browser backup under ipa-lab-audio-reports-v1. Existing browser notes sync on page load and when opening Audio reports. Restart any old server once using start.bat or start.cmd to enable file saving.
Use Audio reports in the footer to review or export them as JSON for fixes.
Reset progress leaves reports available. The context menu can also be invoked
with Shift+F10 on the focused audio button.

The Next button sits above the exercise and stays nearby while scrolling. Autoplay is off initially and remembers the switch setting in this browser. It plays each new word, both comparison words in sequence, or the target symbol in Symbol → audio mode. Browser audio permissions can require a manual Play click after reopening the page.

## Sort by sound

Choose the branching icon in the left rail or Sort by sound in Practice.
Listen to the word and put its highlighted sound in one of two IPA groups.
The correct group receives the word after answering. Reference previews,
right-click audio reports, autoplay, keyboard choices and Next remain available.

Each turn chooses a fresh target and an eligible contrast in the same language.
Groups change between turns to preserve the ten-turn target exclusion rule.
Preferred contrasts come from the target's existing confusers. This mode shares
the session streak with Same or different; target learning and unlocks currently
come from Symbol quiz. A limited language filter may exhaust eligible targets.

See [the language coverage matrix](docs/LANGUAGE_COVERAGE.md) for expected usage, current examples and outstanding objectives by language.
